"""POST /api/analyze — run pipeline."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from db.database import get_session, get_session_raw_text
from models.schemas import SessionPayload
from services.pipeline import run_demo_pipeline, run_pipeline

router = APIRouter(prefix="/api", tags=["analyze"])


@router.post("/analyze/{session_id}", response_model=SessionPayload)
async def analyze_session(session_id: str):
    existing = get_session(session_id)
    if not existing:
        raise HTTPException(404, "Session not found")

    if session_id.startswith("demo"):
        return await run_demo_pipeline(session_id)

    raw_text = get_session_raw_text(session_id)
    if not raw_text:
        raise HTTPException(400, "No uploaded documents — upload files or use demo patient")

    return await run_pipeline(session_id, raw_text)
