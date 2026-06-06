"""Analyze pipeline + status polling."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from db.database import get_pipeline_status, get_session, get_session_raw_text, session_exists
from models.schemas import PipelineStatus, SessionPayload
from services.cases import profile_is_ready
from services.pipeline import run_demo_pipeline, run_pipeline, run_pipeline_from_profile

router = APIRouter(prefix="/api", tags=["analyze"])


@router.post("/analyze/{session_id}", response_model=SessionPayload)
async def analyze_session(session_id: str):
    if not session_exists(session_id):
        raise HTTPException(404, "Session not found")

    payload = get_session(session_id)

    # Pre-built profile from preset case or JSON upload — skip Agent 1
    if payload and profile_is_ready(payload.patient_profile):
        return await run_pipeline_from_profile(session_id, payload.patient_profile)

    # Legacy fixed demo session id (loads demo_patient.json if no profile)
    if session_id.startswith("demo") or session_id == "demo-patient-001":
        return await run_demo_pipeline(session_id)

    raw_text = get_session_raw_text(session_id)
    if not raw_text:
        raise HTTPException(400, "No session data — upload a case or call POST /api/demo")

    return await run_pipeline(session_id, raw_text)


@router.get("/analyze/{session_id}/status", response_model=PipelineStatus)
async def analyze_status(session_id: str):
    status = get_pipeline_status(session_id)
    if not status:
        raise HTTPException(404, "Session not found")
    return status
