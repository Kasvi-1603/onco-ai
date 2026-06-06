"""Audit trail API."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from db.database import get_audit_log, session_exists
from models.schemas import AuditEntry, AuditResponse

router = APIRouter(prefix="/api/audit", tags=["audit"])


@router.get("/{session_id}", response_model=AuditResponse)
async def get_audit(session_id: str):
    if not session_exists(session_id):
        raise HTTPException(404, "Session not found")
    rows = get_audit_log(session_id)
    return AuditResponse(
        session_id=session_id,
        entries=[AuditEntry(**r) for r in rows],
    )
