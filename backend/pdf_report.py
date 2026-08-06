"""
Turns an analysis report dict (see detect.py output) into a formatted PDF
using reportlab. Kept separate from app.py so the report layout can evolve
independently of the API.
"""

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle,
)

GREEN = colors.HexColor("#1E7A46")
RED = colors.HexColor("#D6402B")
INK = colors.HexColor("#1A1D1E")
SOFT = colors.HexColor("#5B6063")
AMBER = colors.HexColor("#FFB300")


def build_pdf_report(report: dict, output_path: str, video_label: str = "Uploaded Video"):
    doc = SimpleDocTemplate(
        str(output_path), pagesize=letter,
        topMargin=0.7 * inch, bottomMargin=0.7 * inch,
        leftMargin=0.7 * inch, rightMargin=0.7 * inch,
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("TitleX", parent=styles["Title"], textColor=INK, fontSize=22, spaceAfter=4)
    eyebrow_style = ParagraphStyle("Eyebrow", parent=styles["Normal"], textColor=AMBER, fontSize=9,
                                    spaceAfter=10, fontName="Helvetica-Bold")
    h2_style = ParagraphStyle("H2", parent=styles["Heading2"], textColor=INK, spaceBefore=16, spaceAfter=8)
    soft_style = ParagraphStyle("SoftX", parent=styles["Normal"], textColor=SOFT, fontSize=9)

    story = []
    story.append(Paragraph("SITEWATCH &mdash; PPE COMPLIANCE ENGINE", eyebrow_style))
    story.append(Paragraph("PPE Compliance Report", title_style))
    story.append(Paragraph(
        f"{video_label} &nbsp;&bull;&nbsp; Processed {report.get('processed_at', '-')} "
        f"&nbsp;&bull;&nbsp; {report.get('resolution', '-')} @ {report.get('fps', '-')} fps",
        soft_style,
    ))
    story.append(Spacer(1, 16))

    rate = report.get("overall_compliance_rate")
    rate_txt = f"{rate}%" if rate is not None else "N/A"
    summary_data = [
        ["Overall Compliance", "Total Violations", "Peak Persons/Frame", "Frames Analyzed"],
        [rate_txt, str(report.get("total_violations", 0)),
         str(report.get("max_persons_in_frame", 0)), str(report.get("total_frames", 0))],
    ]
    summary_table = Table(summary_data, colWidths=[1.7 * inch] * 4)
    summary_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EEEFE9")),
        ("TEXTCOLOR", (0, 0), (-1, 0), SOFT),
        ("FONTSIZE", (0, 0), (-1, 0), 8),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 1), (-1, 1), 16),
        ("FONTNAME", (0, 1), (-1, 1), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, 1), (0, 1), GREEN if (rate or 0) >= 80 else RED),
        ("TEXTCOLOR", (1, 1), (1, 1), RED if report.get("total_violations", 0) > 0 else GREEN),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#DBD9CC")),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
    ]))
    story.append(summary_table)

    if report.get("ai_summary"):
        story.append(Paragraph("AI Summary", h2_style))
        story.append(Paragraph(report["ai_summary"], styles["Normal"]))

    story.append(Paragraph("Compliance by Category", h2_style))
    compliance = report.get("compliance", {})
    cat_data = [["PPE Item", "Compliant", "Violations", "Rate"]]
    for label, v in compliance.items():
        rate_str = f"{v['rate']}%" if v.get("rate") is not None else "N/A"
        cat_data.append([label, str(v["compliant"]), str(v["violations"]), rate_str])
    cat_table = Table(cat_data, colWidths=[2.2 * inch, 1.4 * inch, 1.4 * inch, 1.0 * inch])
    cat_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), INK),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#DBD9CC")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F5F5F0")]),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(cat_table)

    story.append(Paragraph("Raw Detection Counts", h2_style))
    class_totals = report.get("class_totals", {})
    raw_data = [["Class", "Detections"]] + [[k, str(v)] for k, v in class_totals.items()]
    raw_table = Table(raw_data, colWidths=[3.0 * inch, 1.5 * inch])
    raw_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EEEFE9")),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#DBD9CC")),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(raw_table)

    story.append(Spacer(1, 20))
    story.append(Paragraph(
        "Generated automatically by SiteWatch. Violations are detected directly from "
        "the trained model's NO-Hardhat / NO-Mask / NO-Safety Vest classes.",
        soft_style,
    ))

    doc.build(story)
    return output_path


def build_general_pdf_report(data: dict, output_path: str, video_label: str = "Uploaded Video"):
    """PDF for the Gemini-powered general video analysis (objects/activities/
    safety observations) — a lighter, text-focused report vs the PPE one above."""
    doc = SimpleDocTemplate(
        str(output_path), pagesize=letter,
        topMargin=0.7 * inch, bottomMargin=0.7 * inch,
        leftMargin=0.7 * inch, rightMargin=0.7 * inch,
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("TitleX", parent=styles["Title"], textColor=INK, fontSize=22, spaceAfter=4)
    eyebrow_style = ParagraphStyle("Eyebrow", parent=styles["Normal"], textColor=AMBER, fontSize=9,
                                    spaceAfter=10, fontName="Helvetica-Bold")
    h2_style = ParagraphStyle("H2", parent=styles["Heading2"], textColor=INK, spaceBefore=16, spaceAfter=8)
    soft_style = ParagraphStyle("SoftX", parent=styles["Normal"], textColor=SOFT, fontSize=9)
    body_style = ParagraphStyle("BodyX", parent=styles["Normal"], textColor=INK, fontSize=10, leading=15)

    story = []
    story.append(Paragraph("SITEWATCH &mdash; GENERAL VIDEO ANALYSIS", eyebrow_style))
    story.append(Paragraph("General Analysis Report", title_style))
    story.append(Paragraph(video_label, soft_style))
    story.append(Spacer(1, 16))

    story.append(Paragraph("Overall Summary", h2_style))
    story.append(Paragraph(data.get("overall_summary", "-"), body_style))

    if data.get("scene_description"):
        story.append(Paragraph("Scene", h2_style))
        story.append(Paragraph(data["scene_description"], body_style))

    if data.get("objects_detected"):
        story.append(Paragraph("Objects Detected", h2_style))
        story.append(Paragraph(", ".join(data["objects_detected"]), body_style))

    if data.get("activities"):
        story.append(Paragraph("Activities", h2_style))
        for a in data["activities"]:
            story.append(Paragraph(f"&bull; {a}", body_style))

    if data.get("safety_observations"):
        story.append(Paragraph("Safety Observations", h2_style))
        for s in data["safety_observations"]:
            story.append(Paragraph(f"&bull; {s}", body_style))
    else:
        story.append(Paragraph("Safety Observations", h2_style))
        story.append(Paragraph("No safety concerns noted.", body_style))

    story.append(Spacer(1, 20))
    story.append(Paragraph(
        "Generated automatically by SiteWatch using Gemini's native video understanding.",
        soft_style,
    ))

    doc.build(story)
    return output_path