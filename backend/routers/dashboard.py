"""View 1 dashboard API."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from db.database import get_session, update_session_status
from models.schemas import ApproveResponse, SessionPayload

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/{session_id}", response_model=SessionPayload)
async def get_dashboard(session_id: str):
    payload = get_session(session_id)
    if not payload:
        raise HTTPException(404, "Session not found")
    return payload


@router.post("/{session_id}/approve", response_model=ApproveResponse)
async def approve_session(session_id: str):
    payload = get_session(session_id)
    if not payload:
        raise HTTPException(404, "Session not found")

    approved_at = datetime.now(timezone.utc)
    updated = update_session_status(
        session_id,
        "shared",
        approved_at=approved_at,
        approved_documents=payload.documents.model_dump(),
    )
    if not updated:
        raise HTTPException(500, "Failed to approve session")

    return ApproveResponse(
        status="shared",
        approved_documents=updated.documents,
        approved_at=approved_at,
    )
