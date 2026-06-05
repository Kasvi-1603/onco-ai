"""API routers — upload."""

from __future__ import annotations

import uuid
from pathlib import Path

from fastapi import APIRouter, File, UploadFile

from db.database import load_json_file, save_session
from models.schemas import PatientProfile, SessionPayload, UploadResponse
from services.ocr import extract_from_upload_dir

router = APIRouter(prefix="/api", tags=["upload"])

UPLOADS_ROOT = Path(__file__).resolve().parent.parent.parent / "uploads"


@router.post("/demo", response_model=UploadResponse)
async def create_demo_session():
    """Create demo session from bundled simulated patient (matches SYN-001 ~87%)."""
    demo = load_json_file("demo_patient.json")
    session_id = demo.get("demo_session_id", str(uuid.uuid4()))
    payload = SessionPayload(
        session_id=session_id,
        status="pending",
        patient_profile=PatientProfile.model_validate(demo["patient_profile"]),
    )
    save_session(session_id, payload, raw_text=demo.get("raw_ocr_text"))
    return UploadResponse(
        session_id=session_id,
        raw_text=demo.get("raw_ocr_text"),
        demo=True,
    )


@router.post("/upload", response_model=UploadResponse)
async def upload_files(files: list[UploadFile] = File(...)):
    session_id = str(uuid.uuid4())
    session_dir = UPLOADS_ROOT / session_id
    session_dir.mkdir(parents=True, exist_ok=True)

    for f in files:
        dest = session_dir / (f.filename or "upload.bin")
        content = await f.read()
        dest.write_bytes(content)

    raw_text = extract_from_upload_dir(session_dir) if files else ""
    payload = SessionPayload(session_id=session_id, status="pending")
    save_session(session_id, payload, raw_text=raw_text or None)

    return UploadResponse(session_id=session_id, raw_text=raw_text or None)
