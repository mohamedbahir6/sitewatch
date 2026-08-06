"""
Real vector-store RAG: every analyzed video's report gets turned into a text
summary, embedded with Gemini's embedding model, and stored in a local
ChromaDB collection. Chat queries embed the user's question and retrieve the
most relevant past reports before answering — this is what lets the
assistant reason across a user's whole video history, not just whichever
video happens to be on screen.
"""

import os
from pathlib import Path

import chromadb
import google.generativeai as genai

CHROMA_DIR = Path(__file__).parent / "storage" / "chroma"
CHROMA_DIR.mkdir(parents=True, exist_ok=True)

_client = None
_collection = None


def _get_collection():
    global _client, _collection
    if _collection is None:
        _client = chromadb.PersistentClient(path=str(CHROMA_DIR))
        _collection = _client.get_or_create_collection("video_reports")
    return _collection


def _embed(text: str, task_type: str = "retrieval_document"):
    genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
    result = genai.embed_content(model="models/text-embedding-004", content=text, task_type=task_type)
    return result["embedding"]


def _report_to_text(video_id: str, filename: str, report: dict) -> str:
    """Flatten a report's key numbers into a short paragraph — this is what
    actually gets embedded, since embedding raw JSON works poorly."""
    compliance = report.get("compliance", {})
    lines = [
        f"Video: {filename or video_id} (id {video_id}), processed {report.get('processed_at')}.",
        f"Resolution {report.get('resolution')} at {report.get('fps')} fps, "
        f"{report.get('total_frames')} frames analyzed.",
        f"Overall compliance rate: {report.get('overall_compliance_rate')}%. "
        f"Total violations: {report.get('total_violations')}. "
        f"Peak persons in frame: {report.get('max_persons_in_frame')}.",
    ]
    for label, v in compliance.items():
        lines.append(
            f"{label}: {v.get('compliant')} compliant, {v.get('violations')} violations, "
            f"rate {v.get('rate')}%."
        )
    if report.get("ai_summary"):
        lines.append(f"Summary: {report['ai_summary']}")
    return " ".join(lines)


def index_report(video_id: str, user_id: str, filename: str, report: dict):
    """Call once, right after analysis finishes, to embed + store this report."""
    if not os.getenv("GOOGLE_API_KEY"):
        return
    try:
        text = _report_to_text(video_id, filename, report)
        embedding = _embed(text, task_type="retrieval_document")
        _get_collection().upsert(
            ids=[video_id],
            embeddings=[embedding],
            documents=[text],
            metadatas=[{"user_id": user_id, "video_id": video_id, "filename": filename or ""}],
        )
    except Exception:
        pass  # indexing is a bonus feature — never let it break the analysis pipeline


def query_similar_reports(user_id: str, query: str, exclude_video_id: str = None, n_results: int = 3):
    """Embed the question, retrieve the most relevant past reports for this user
    (excluding the video already being viewed, which is sent in full separately)."""
    if not os.getenv("GOOGLE_API_KEY"):
        return []
    try:
        query_embedding = _embed(query, task_type="retrieval_query")
        results = _get_collection().query(
            query_embeddings=[query_embedding],
            n_results=n_results + 1,
            where={"user_id": user_id},
        )
        docs = []
        for doc_id, doc_text in zip(results["ids"][0], results["documents"][0]):
            if doc_id == exclude_video_id:
                continue
            docs.append(doc_text)
        return docs[:n_results]
    except Exception:
        return []