"""View 1 — oncologist dashboard API."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from db.database import (
    approve_session,
    get_session,
    is_pipeline_ready,
    update_session_documents,
)
from models.schemas import (
    ApproveRequest,
    ApproveResponse,
    DocumentsPatchRequest,
    SessionPayload,
)

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/{session_id}", response_model=SessionPayload)
async def get_dashboard(session_id: str):
    if not get_session(session_id):
        raise HTTPException(404, "Session not found")
    if not is_pipeline_ready(session_id):
        raise HTTPException(425, "Pipeline not complete — call POST /api/analyze/{session_id}")
    payload = get_session(session_id)
    assert payload is not None
    return payload


@router.patch("/{session_id}/documents", response_model=SessionPayload)
async def patch_documents(session_id: str, body: DocumentsPatchRequest):
    if not get_session(session_id):
        raise HTTPException(404, "Session not found")
    updated = update_session_documents(session_id, body.documents)
    if not updated:
        raise HTTPException(500, "Failed to save documents")
    return updated


@router.post("/{session_id}/approve", response_model=ApproveResponse)
async def approve(session_id: str, body: ApproveRequest | None = None):
    payload = get_session(session_id)
    if not payload:
        raise HTTPException(404, "Session not found")
    if not is_pipeline_ready(session_id):
        raise HTTPException(425, "Pipeline not complete")

    updated = approve_session(
        session_id,
        approved_documents=body.approved_documents if body else None,
        approver_note=body.approver_note if body else None,
    )
    if not updated or not updated.approved_at:
        raise HTTPException(500, "Failed to approve session")

    return ApproveResponse(
        session_id=session_id,
        status="shared",
        approved_at=updated.approved_at,
        patient_portal_url=f"/patient/{session_id}",
        approved_documents=updated.approved_documents,
    )
