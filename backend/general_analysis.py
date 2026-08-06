"""
General-purpose video analysis — a second, independent analysis pipeline
alongside the PPE/YOLO one. Instead of a custom-trained model, this uses
Gemini's native multimodal video understanding: the video is uploaded to
Gemini's File API, Gemini watches it directly, and returns a structured
description of what's happening — objects, activities, scene, and general
safety observations (not limited to PPE).

Uses the newer `google-genai` SDK specifically for this — the older
`google-generativeai` package's File API support is deprecated/unreliable,
even though its basic generate_content calls (used elsewhere in this app
for chat and summaries) still work fine.
"""

import json
import os
import time

from google import genai

PROMPT = """Watch this video carefully and provide a detailed analysis.
Respond with ONLY a JSON object (no markdown, no code fences) in exactly this shape:

{
  "overall_summary": "2-3 sentence summary of what happens in the video",
  "scene_description": "1-2 sentences describing the setting/environment",
  "objects_detected": ["object 1", "object 2", "..."],
  "activities": ["activity or event 1", "activity or event 2", "..."],
  "safety_observations": ["any general safety-relevant observation 1", "..."]
}

For safety_observations, note anything safety-relevant you can see (not just PPE) —
e.g. tripping hazards, unsafe machinery use, poor lighting, blocked exits, crowding.
If there is nothing notable, return an empty list for that field. Keep every list
to at most 6 items."""


def analyze_video_general(video_path: str) -> dict:
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise RuntimeError("GOOGLE_API_KEY not set — general analysis needs it")

    client = genai.Client(api_key=api_key)

    uploaded = client.files.upload(file=video_path)

    while uploaded.state.name == "PROCESSING":
        time.sleep(3)
        uploaded = client.files.get(name=uploaded.name)

    if uploaded.state.name == "FAILED":
        raise RuntimeError("Gemini could not process this video file")

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[uploaded, PROMPT],
    )

    text = response.text.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.lower().startswith("json"):
            text = text[4:]
        text = text.strip()

    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        data = {
            "overall_summary": text,
            "scene_description": "",
            "objects_detected": [],
            "activities": [],
            "safety_observations": [],
        }

    client.files.delete(name=uploaded.name)  # don't leave the video sitting on Gemini's servers
    return data