import json
import os
import uuid
from pathlib import Path

from dotenv import load_dotenv
from fastapi import BackgroundTasks, Depends, FastAPI, File, Header, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from pydantic import BaseModel

import auth
import vectorstore
from detect import PPEDetector
from email_utils import send_verification_email, send_report_email
from general_analysis import analyze_video_general
from pdf_report import build_pdf_report, build_general_pdf_report

load_dotenv()

BASE_DIR = Path(__file__).parent
STORAGE_DIR = BASE_DIR / "storage"
UPLOADS_DIR = STORAGE_DIR / "uploads"
OUTPUTS_DIR = STORAGE_DIR / "outputs"
RESULTS_DIR = STORAGE_DIR / "results"
REPORTS_DIR = STORAGE_DIR / "reports"
GENERAL_UPLOADS_DIR = STORAGE_DIR / "general_uploads"
GENERAL_RESULTS_DIR = STORAGE_DIR / "general_results"
for d in (UPLOADS_DIR, OUTPUTS_DIR, RESULTS_DIR, REPORTS_DIR, GENERAL_UPLOADS_DIR, GENERAL_RESULTS_DIR):
    d.mkdir(parents=True, exist_ok=True)

auth.init_db()

WEIGHTS_PATH = os.getenv("PPE_MODEL_WEIGHTS", str(BASE_DIR / "models" / "best.pt"))
CONF_THRESHOLD = float(os.getenv("PPE_CONF_THRESHOLD", "0.4"))
FRAME_SKIP = int(os.getenv("PPE_FRAME_SKIP", "2"))
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

app = FastAPI(title="PPE Safety Analysis API")

FRONTEND_URL = os.getenv("FRONTEND_URL", "")
allowed_origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
if FRONTEND_URL:
    allowed_origins.append(FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_detector = None


def get_detector():
    global _detector
    if _detector is None:
        if not Path(WEIGHTS_PATH).exists():
            raise HTTPException(
                status_code=400,
                detail=f"Model weights not found at {WEIGHTS_PATH}. "
                       f"Put your trained best.pt there or set PPE_MODEL_WEIGHTS in .env",
            )
        _detector = PPEDetector(WEIGHTS_PATH, conf=CONF_THRESHOLD, frame_skip=FRAME_SKIP)
    return _detector


JOBS = {}
GENERAL_JOBS = {}


def generate_ai_summary(report: dict) -> str:
    if not GOOGLE_API_KEY:
        return ""
    try:
        import google.generativeai as genai
        genai.configure(api_key=GOOGLE_API_KEY)
        model = genai.GenerativeModel("gemini-2.5-flash")
        prompt = (
            "Write a concise 3-4 sentence plain-English summary of this PPE compliance "
            "video analysis for a busy safety manager. Mention the overall compliance rate, "
            "the biggest violation category, and one clear, actionable recommendation. "
            "Plain prose only, no markdown, no bullet points.\n\n"
            f"ANALYSIS REPORT:\n{json.dumps(report)}"
        )
        resp = model.generate_content(prompt)
        return resp.text.strip()
    except Exception:
        return ""


class SignupRequest(BaseModel):
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


def get_current_user(authorization: str = Header(default=None), t: str = Query(default=None)) -> str:
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.removeprefix("Bearer ").strip()
    elif t:
        token = t
    if not token:
        raise HTTPException(401, "Not authenticated — please log in")
    user_id = auth.get_user_id_for_token(token)
    if not user_id:
        raise HTTPException(401, "Session expired — please log in again")
    return user_id


@app.post("/api/auth/signup")
def signup(req: SignupRequest):
    if len(req.password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")
    try:
        user_id = auth.create_user(req.email.lower().strip(), req.password)
    except ValueError as e:
        raise HTTPException(400, str(e))
    token = auth.create_session(user_id)
    return {"token": token, "email": req.email}


@app.post("/api/auth/login")
def login(req: LoginRequest):
    try:
        user_id = auth.authenticate(req.email.lower().strip(), req.password)
    except ValueError as e:
        raise HTTPException(401, str(e))
    token = auth.create_session(user_id)
    return {"token": token, "email": req.email}


@app.get("/api/health")
def health():
    return {"status": "ok", "weights_found": Path(WEIGHTS_PATH).exists()}


# ---------------- Settings (manager email for auto-emailed reports) ----------------

class SettingsRequest(BaseModel):
    manager_email: str


@app.post("/api/settings")
def save_settings(req: SettingsRequest, user_id: str = Depends(get_current_user)):
    auth.save_report_settings(user_id, req.manager_email.strip())
    token = auth.create_verification(user_id, req.manager_email.strip())
    try:
        send_verification_email(req.manager_email.strip(), token)
    except Exception as e:
        raise HTTPException(400, f"Settings saved, but the verification email failed to send: {e}")
    return {"status": "verification_sent"}


@app.get("/api/settings")
def get_settings(user_id: str = Depends(get_current_user)):
    s = auth.get_report_settings(user_id)
    if not s:
        return {"manager_email": None, "verified": False}
    return {"manager_email": s["manager_email"], "verified": bool(s["verified"])}


@app.get("/api/settings/verify")
def verify_settings(token: str):
    """Public — no auth. The manager clicks this link from their inbox, not
    while logged into SiteWatch, so it can't require a session token."""
    user_id = auth.verify_manager_email(token)
    if not user_id:
        return HTMLResponse(
            "<h2 style='font-family:sans-serif'>This verification link is invalid or has expired.</h2>",
            status_code=400,
        )
    return HTMLResponse(
        "<h2 style='font-family:sans-serif'>✅ Email verified — you'll now receive SiteWatch reports.</h2>"
        "<p style='font-family:sans-serif;color:#667085'>You can close this tab.</p>"
    )


@app.get("/api/videos")
def my_videos(user_id: str = Depends(get_current_user)):
    return auth.list_user_videos(user_id)


@app.get("/api/trends")
def trends(user_id: str = Depends(get_current_user)):
    videos = auth.list_user_videos(user_id)
    points = []
    for v in sorted(videos, key=lambda x: x["uploaded_at"]):
        results_path = RESULTS_DIR / f"{v['id']}.json"
        if not results_path.exists():
            continue
        report = json.loads(results_path.read_text())
        points.append({
            "video_id": v["id"],
            "filename": v["filename"],
            "uploaded_at": v["uploaded_at"],
            "overall_compliance_rate": report.get("overall_compliance_rate"),
            "total_violations": report.get("total_violations"),
        })
    return points


@app.post("/api/upload")
async def upload_video(file: UploadFile = File(...), user_id: str = Depends(get_current_user)):
    video_id = uuid.uuid4().hex[:12]
    ext = Path(file.filename).suffix or ".mp4"
    dest = UPLOADS_DIR / f"{video_id}{ext}"
    with open(dest, "wb") as f:
        f.write(await file.read())
    JOBS[video_id] = {"status": "uploaded", "progress": 0, "source_path": str(dest), "filename": file.filename}
    auth.record_video(video_id, user_id, file.filename)
    return {"video_id": video_id, "filename": file.filename}


def _require_ownership(video_id: str, user_id: str):
    owner = auth.get_video_owner(video_id)
    if owner is None:
        raise HTTPException(404, "Unknown video_id")
    if owner != user_id:
        raise HTTPException(403, "This video does not belong to your account")


def _run_analysis(video_id: str, conf: float = None):
    JOBS[video_id]["status"] = "processing"
    try:
        detector = get_detector()

        def progress_cb(pct):
            JOBS[video_id]["progress"] = pct

        report = detector.analyze_video(
            video_path=JOBS[video_id]["source_path"],
            output_dir=str(OUTPUTS_DIR),
            video_id=video_id,
            progress_cb=progress_cb,
            conf_override=conf,
        )
        report["ai_summary"] = generate_ai_summary(report)
        with open(RESULTS_DIR / f"{video_id}.json", "w") as f:
            json.dump(report, f, indent=2)
        owner_id = auth.get_video_owner(video_id)
        vectorstore.index_report(video_id, owner_id, JOBS[video_id].get("filename"), report)
        _maybe_email_report(video_id, owner_id, report)
        JOBS[video_id]["status"] = "done"
        JOBS[video_id]["progress"] = 100
    except Exception as e:
        JOBS[video_id]["status"] = "error"
        JOBS[video_id]["error"] = str(e)


def _maybe_email_report(video_id: str, user_id: str, report: dict):
    """If this user has a verified manager email configured in Settings,
    auto-generate the PDF and email it. Silently does nothing if settings
    aren't configured — never breaks the analysis pipeline if email sending
    fails (bad SMTP creds, offline, etc.)."""
    settings = auth.get_report_settings(user_id)
    if not settings or not settings["verified"] or not settings["manager_email"]:
        return
    try:
        pdf_path = REPORTS_DIR / f"{video_id}.pdf"
        build_pdf_report(report, pdf_path, video_label=f"Video {video_id}")
        send_report_email(
            settings["manager_email"], str(pdf_path),
            f"sitewatch-report-{video_id}.pdf", report.get("overall_compliance_rate"),
        )
    except Exception:
        pass


@app.post("/api/analyze/{video_id}")
def analyze(video_id: str, background_tasks: BackgroundTasks, conf: float = Query(default=None), user_id: str = Depends(get_current_user)):
    _require_ownership(video_id, user_id)
    if video_id not in JOBS:
        raise HTTPException(404, "Unknown video_id — upload first")
    if JOBS[video_id]["status"] == "processing":
        return {"status": "already_processing"}
    background_tasks.add_task(_run_analysis, video_id, conf)
    return {"status": "started", "video_id": video_id}


@app.get("/api/status/{video_id}")
def status(video_id: str, user_id: str = Depends(get_current_user)):
    _require_ownership(video_id, user_id)
    if video_id not in JOBS:
        raise HTTPException(404, "Unknown video_id")
    return JOBS[video_id]


@app.get("/api/results/{video_id}")
def results(video_id: str, user_id: str = Depends(get_current_user)):
    _require_ownership(video_id, user_id)
    path = RESULTS_DIR / f"{video_id}.json"
    if not path.exists():
        raise HTTPException(404, "No results yet for this video_id")
    return JSONResponse(json.loads(path.read_text()))


@app.get("/api/video/{video_id}/annotated")
def annotated_video(video_id: str, user_id: str = Depends(get_current_user)):
    _require_ownership(video_id, user_id)
    path = OUTPUTS_DIR / f"{video_id}_annotated.mp4"
    if not path.exists():
        raise HTTPException(404, "Annotated video not found")
    return FileResponse(path, media_type="video/mp4")


@app.get("/api/report/{video_id}/pdf")
def report_pdf(video_id: str, user_id: str = Depends(get_current_user)):
    _require_ownership(video_id, user_id)
    results_path = RESULTS_DIR / f"{video_id}.json"
    if not results_path.exists():
        raise HTTPException(404, "No results yet for this video_id")
    report = json.loads(results_path.read_text())
    pdf_path = REPORTS_DIR / f"{video_id}.pdf"
    build_pdf_report(report, pdf_path, video_label=f"Video {video_id}")
    return FileResponse(pdf_path, media_type="application/pdf",
                         filename=f"sitewatch-report-{video_id}.pdf")


def _require_general_ownership(job_id: str, user_id: str):
    owner = auth.get_general_analysis_owner(job_id)
    if owner is None:
        raise HTTPException(404, "Unknown job_id")
    if owner != user_id:
        raise HTTPException(403, "This analysis does not belong to your account")


def _run_general_analysis(job_id: str):
    GENERAL_JOBS[job_id]["status"] = "processing"
    try:
        data = analyze_video_general(GENERAL_JOBS[job_id]["source_path"])
        with open(GENERAL_RESULTS_DIR / f"{job_id}.json", "w") as f:
            json.dump(data, f, indent=2)
        GENERAL_JOBS[job_id]["status"] = "done"
    except Exception as e:
        GENERAL_JOBS[job_id]["status"] = "error"
        GENERAL_JOBS[job_id]["error"] = str(e)


@app.get("/api/general/history")
def general_history(user_id: str = Depends(get_current_user)):
    items = auth.list_user_general_analyses(user_id)
    return [i for i in items if (GENERAL_RESULTS_DIR / f"{i['id']}.json").exists()]


@app.post("/api/general/upload")
async def general_upload(file: UploadFile = File(...), user_id: str = Depends(get_current_user)):
    job_id = uuid.uuid4().hex[:12]
    ext = Path(file.filename).suffix or ".mp4"
    dest = GENERAL_UPLOADS_DIR / f"{job_id}{ext}"
    with open(dest, "wb") as f:
        f.write(await file.read())
    GENERAL_JOBS[job_id] = {"status": "uploaded", "source_path": str(dest), "filename": file.filename}
    auth.record_general_analysis(job_id, user_id, file.filename)
    return {"job_id": job_id, "filename": file.filename}


@app.post("/api/general/analyze/{job_id}")
def general_analyze(job_id: str, background_tasks: BackgroundTasks, user_id: str = Depends(get_current_user)):
    _require_general_ownership(job_id, user_id)
    if job_id not in GENERAL_JOBS:
        raise HTTPException(404, "Unknown job_id — upload first")
    if GENERAL_JOBS[job_id]["status"] == "processing":
        return {"status": "already_processing"}
    background_tasks.add_task(_run_general_analysis, job_id)
    return {"status": "started", "job_id": job_id}


@app.get("/api/general/status/{job_id}")
def general_status(job_id: str, user_id: str = Depends(get_current_user)):
    _require_general_ownership(job_id, user_id)
    if job_id not in GENERAL_JOBS:
        if (GENERAL_RESULTS_DIR / f"{job_id}.json").exists():
            return {"status": "done", "error": None}
        raise HTTPException(404, "Unknown job_id")
    return {"status": GENERAL_JOBS[job_id]["status"], "error": GENERAL_JOBS[job_id].get("error")}


@app.get("/api/general/results/{job_id}")
def general_results(job_id: str, user_id: str = Depends(get_current_user)):
    _require_general_ownership(job_id, user_id)
    path = GENERAL_RESULTS_DIR / f"{job_id}.json"
    if not path.exists():
        raise HTTPException(404, "No results yet")
    return JSONResponse(json.loads(path.read_text()))


@app.get("/api/general/report/{job_id}/pdf")
def general_report_pdf(job_id: str, user_id: str = Depends(get_current_user)):
    _require_general_ownership(job_id, user_id)
    results_path = GENERAL_RESULTS_DIR / f"{job_id}.json"
    if not results_path.exists():
        raise HTTPException(404, "No results yet")
    data = json.loads(results_path.read_text())
    pdf_path = GENERAL_RESULTS_DIR / f"{job_id}.pdf"
    label = GENERAL_JOBS.get(job_id, {}).get("filename") or job_id
    build_general_pdf_report(data, pdf_path, video_label=label)
    return FileResponse(pdf_path, media_type="application/pdf",
                         filename=f"sitewatch-general-{job_id}.pdf")


class GeneralChatRequest(BaseModel):
    job_id: str
    message: str
    history: list[dict] = []


@app.post("/api/general/chat")
def general_chat(req: GeneralChatRequest, user_id: str = Depends(get_current_user)):
    _require_general_ownership(req.job_id, user_id)
    if not GOOGLE_API_KEY:
        raise HTTPException(400, "Set GOOGLE_API_KEY in backend/.env to enable the assistant")

    results_path = GENERAL_RESULTS_DIR / f"{req.job_id}.json"
    if not results_path.exists():
        raise HTTPException(404, "No analysis results found for this job_id yet")

    data = json.loads(results_path.read_text())

    system_prompt = (
        "You are an assistant answering questions about a video that was analyzed. "
        "Answer ONLY using the JSON analysis provided below. Be concise. "
        "If the data doesn't contain the answer, say so.\n\n"
        f"VIDEO ANALYSIS:\n{json.dumps(data)}"
    )

    import google.generativeai as genai_legacy
    genai_legacy.configure(api_key=GOOGLE_API_KEY)
    model = genai_legacy.GenerativeModel("gemini-2.5-flash", system_instruction=system_prompt)

    gemini_history = [
        {"role": "model" if m["role"] == "assistant" else "user", "parts": [m["content"]]}
        for m in req.history
    ]
    chat_session = model.start_chat(history=gemini_history)
    resp = chat_session.send_message(req.message)
    return {"reply": resp.text}


class ChatRequest(BaseModel):
    video_id: str
    message: str
    history: list[dict] = []


@app.post("/api/chat")
def chat(req: ChatRequest, user_id: str = Depends(get_current_user)):
    _require_ownership(req.video_id, user_id)
    if not GOOGLE_API_KEY:
        raise HTTPException(400, "Set GOOGLE_API_KEY in backend/.env to enable the assistant")

    results_path = RESULTS_DIR / f"{req.video_id}.json"
    if not results_path.exists():
        raise HTTPException(404, "No analysis results found for this video_id yet")

    report = json.loads(results_path.read_text())

    related_reports = vectorstore.query_similar_reports(
        user_id, req.message, exclude_video_id=req.video_id, n_results=3
    )
    related_context = (
        "\n\nRELATED REPORTS FROM THIS USER'S OTHER VIDEOS (retrieved via vector search):\n"
        + "\n".join(f"- {r}" for r in related_reports)
        if related_reports else ""
    )

    system_prompt = (
        "You are a safety-compliance assistant for a manufacturing plant's PPE "
        "video analysis dashboard. Answer questions using the JSON analysis report "
        "for the video currently open, and the related reports below if relevant. "
        "Be concise, use concrete numbers, and flag safety concerns plainly. "
        "If the data doesn't contain the answer, say so.\n\n"
        f"CURRENT VIDEO REPORT:\n{json.dumps(report)}"
        f"{related_context}"
    )

    import google.generativeai as genai
    genai.configure(api_key=GOOGLE_API_KEY)
    model = genai.GenerativeModel("gemini-2.5-flash", system_instruction=system_prompt)

    gemini_history = [
        {"role": "model" if m["role"] == "assistant" else "user", "parts": [m["content"]]}
        for m in req.history
    ]
    chat_session = model.start_chat(history=gemini_history)
    resp = chat_session.send_message(req.message)
    return {"reply": resp.text}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)