"""
Lightweight auth for the local app — SQLite for storage, PBKDF2 for password
hashing, random opaque tokens for sessions (no external auth deps needed).
"""

import hashlib
import secrets
import sqlite3
import time
import uuid
from pathlib import Path

DB_PATH = Path(__file__).parent / "storage" / "app.db"


def _conn():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = _conn()
    conn.execute("""CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        created_at REAL NOT NULL
    )""")
    conn.execute("""CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        created_at REAL NOT NULL
    )""")
    conn.execute("""CREATE TABLE IF NOT EXISTS videos (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        filename TEXT,
        uploaded_at REAL NOT NULL
    )""")
    conn.execute("""CREATE TABLE IF NOT EXISTS general_analyses (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        filename TEXT,
        uploaded_at REAL NOT NULL
    )""")
    conn.execute("""CREATE TABLE IF NOT EXISTS report_settings (
        user_id TEXT PRIMARY KEY,
        manager_email TEXT,
        verified INTEGER NOT NULL DEFAULT 0
    )""")
    conn.execute("""CREATE TABLE IF NOT EXISTS email_verifications (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        manager_email TEXT NOT NULL,
        created_at REAL NOT NULL
    )""")
    conn.commit()
    conn.close()


def _hash_password(password: str, salt: str | None = None):
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 200_000).hex()
    return digest, salt


def create_user(email: str, password: str) -> str:
    conn = _conn()
    existing = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
    if existing:
        conn.close()
        raise ValueError("An account with this email already exists")

    user_id = uuid.uuid4().hex[:12]
    digest, salt = _hash_password(password)
    conn.execute(
        "INSERT INTO users (id, email, password_hash, salt, created_at) VALUES (?, ?, ?, ?, ?)",
        (user_id, email, digest, salt, time.time()),
    )
    conn.commit()
    conn.close()
    return user_id


def authenticate(email: str, password: str) -> str:
    conn = _conn()
    row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    if not row:
        conn.close()
        raise ValueError("Invalid email or password")
    digest, _ = _hash_password(password, row["salt"])
    if not secrets.compare_digest(digest, row["password_hash"]):
        conn.close()
        raise ValueError("Invalid email or password")
    conn.close()
    return row["id"]


def create_session(user_id: str) -> str:
    conn = _conn()
    token = secrets.token_hex(32)
    conn.execute(
        "INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)",
        (token, user_id, time.time()),
    )
    conn.commit()
    conn.close()
    return token


def get_user_id_for_token(token: str) -> str | None:
    conn = _conn()
    row = conn.execute("SELECT user_id FROM sessions WHERE token = ?", (token,)).fetchone()
    conn.close()
    return row["user_id"] if row else None


def record_video(video_id: str, user_id: str, filename: str):
    conn = _conn()
    conn.execute(
        "INSERT INTO videos (id, user_id, filename, uploaded_at) VALUES (?, ?, ?, ?)",
        (video_id, user_id, filename, time.time()),
    )
    conn.commit()
    conn.close()


def get_video_owner(video_id: str) -> str | None:
    conn = _conn()
    row = conn.execute("SELECT user_id FROM videos WHERE id = ?", (video_id,)).fetchone()
    conn.close()
    return row["user_id"] if row else None


def list_user_videos(user_id: str):
    conn = _conn()
    rows = conn.execute(
        "SELECT id, filename, uploaded_at FROM videos WHERE user_id = ? ORDER BY uploaded_at DESC",
        (user_id,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def record_general_analysis(job_id: str, user_id: str, filename: str):
    conn = _conn()
    conn.execute(
        "INSERT INTO general_analyses (id, user_id, filename, uploaded_at) VALUES (?, ?, ?, ?)",
        (job_id, user_id, filename, time.time()),
    )
    conn.commit()
    conn.close()


def get_general_analysis_owner(job_id: str) -> str | None:
    conn = _conn()
    row = conn.execute("SELECT user_id FROM general_analyses WHERE id = ?", (job_id,)).fetchone()
    conn.close()
    return row["user_id"] if row else None


def list_user_general_analyses(user_id: str):
    conn = _conn()
    rows = conn.execute(
        "SELECT id, filename, uploaded_at FROM general_analyses WHERE user_id = ? ORDER BY uploaded_at DESC",
        (user_id,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def save_report_settings(user_id: str, manager_email: str):
    """Saving a new manager email always resets verification — it only
    becomes active again once they click the fresh confirmation link."""
    conn = _conn()
    conn.execute(
        """INSERT INTO report_settings (user_id, manager_email, verified)
           VALUES (?, ?, 0)
           ON CONFLICT(user_id) DO UPDATE SET
             manager_email = excluded.manager_email,
             verified = 0""",
        (user_id, manager_email),
    )
    conn.commit()
    conn.close()


def get_report_settings(user_id: str):
    conn = _conn()
    row = conn.execute(
        "SELECT manager_email, verified FROM report_settings WHERE user_id = ?",
        (user_id,),
    ).fetchone()
    conn.close()
    return dict(row) if row else None


def create_verification(user_id: str, manager_email: str) -> str:
    conn = _conn()
    token = secrets.token_hex(24)
    conn.execute(
        "INSERT INTO email_verifications (token, user_id, manager_email, created_at) VALUES (?, ?, ?, ?)",
        (token, user_id, manager_email, time.time()),
    )
    conn.commit()
    conn.close()
    return token


def verify_manager_email(token: str) -> str | None:
    """Marks the report_settings row verified if this token's email still
    matches what's currently saved (protects against a stale link re-verifying
    an email the user has since changed)."""
    conn = _conn()
    row = conn.execute(
        "SELECT user_id, manager_email FROM email_verifications WHERE token = ?", (token,)
    ).fetchone()
    if not row:
        conn.close()
        return None
    current = conn.execute(
        "SELECT manager_email FROM report_settings WHERE user_id = ?", (row["user_id"],)
    ).fetchone()
    if not current or current["manager_email"] != row["manager_email"]:
        conn.close()
        return None
    conn.execute(
        "UPDATE report_settings SET verified = 1 WHERE user_id = ?", (row["user_id"],)
    )
    conn.execute("DELETE FROM email_verifications WHERE token = ?", (token,))
    conn.commit()
    conn.close()
    return row["user_id"]