"""Audit trail API."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from db.database import get_audit_log, get_session
from models.schemas import AuditEntry

router = APIRouter(prefix="/api/audit", tags=["audit"])


@router.get("/{session_id}", response_model=list[AuditEntry])
async def get_audit(session_id: str):
    if not get_session(session_id):
        raise HTTPException(404, "Session not found")
    rows = get_audit_log(session_id)
    return [AuditEntry(**r) for r in rows]
