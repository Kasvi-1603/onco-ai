"""View 2 — patient localization portal API."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse

from db.database import get_session
from models.schemas import PatientLocalizedView, SupportedLang
from services.translation import localize_for_patient

router = APIRouter(prefix="/api/patient", tags=["patient"])


@router.get("/{session_id}", response_model=PatientLocalizedView)
async def get_patient_portal(
    session_id: str,
    lang: SupportedLang = Query(default="en"),
):
    payload = get_session(session_id)
    if not payload:
        raise HTTPException(404, "Session not found")
    if payload.status != "shared":
        return JSONResponse(
            status_code=403,
            content={
                "error": "not_shared",
                "message": "Your doctor is reviewing your results",
                "status": payload.status,
            },
        )
    return await localize_for_patient(payload, lang)


@router.post("/{session_id}/summary", response_model=PatientLocalizedView)
async def regenerate_summary(
    session_id: str,
    lang: SupportedLang = Query(...),
):
    payload = get_session(session_id)
    if not payload:
        raise HTTPException(404, "Session not found")
    if payload.status != "shared":
        raise HTTPException(403, "Session not shared with patient")
    return await localize_for_patient(payload, lang)
