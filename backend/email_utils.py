"""
Sends two kinds of emails via SMTP:
1. A verification email when a manager's address is first added in Settings.
2. The compliance report PDF once analysis finishes, but only after that
   manager's email has been verified.

Uses plain smtplib — works with Gmail (with an App Password), Outlook, or any
standard SMTP provider. No external email service/API key required.
"""

import os
import smtplib
from email.message import EmailMessage

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_FROM = os.getenv("SMTP_FROM") or SMTP_USER
PUBLIC_BASE_URL = os.getenv("PUBLIC_BASE_URL", "http://localhost:8000")


def _send(to_email: str, subject: str, body: str, attachment_path: str = None, attachment_name: str = None):
    if not (SMTP_HOST and SMTP_USER and SMTP_PASSWORD):
        raise RuntimeError(
            "SMTP not configured — set SMTP_HOST, SMTP_USER, SMTP_PASSWORD in backend/.env"
        )

    msg = EmailMessage()
    msg["From"] = SMTP_FROM
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(body)

    if attachment_path:
        with open(attachment_path, "rb") as f:
            data = f.read()
        msg.add_attachment(
            data, maintype="application", subtype="pdf",
            filename=attachment_name or "report.pdf",
        )

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(msg)


def send_verification_email(to_email: str, token: str):
    verify_url = f"{PUBLIC_BASE_URL}/api/settings/verify?token={token}"
    body = (
        "You've been added as a report recipient on SiteWatch.\n\n"
        "Click the link below to confirm — once confirmed, you'll automatically "
        "receive PPE compliance reports as a PDF whenever a new video is analyzed:\n\n"
        f"{verify_url}\n\n"
        "If you weren't expecting this, you can safely ignore this email."
    )
    _send(to_email, "Confirm your SiteWatch report subscription", body)


def send_report_email(to_email: str, pdf_path: str, filename: str, compliance_rate):
    rate_text = f"{compliance_rate}%" if compliance_rate is not None else "N/A"
    body = (
        "A new PPE compliance report is ready.\n\n"
        f"Overall compliance: {rate_text}\n\n"
        "See the attached PDF for the full breakdown."
    )
    _send(to_email, "New SiteWatch Compliance Report", body,
          attachment_path=pdf_path, attachment_name=filename)