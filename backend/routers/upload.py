"""Session API — preset cases, demo, and .txt/.json upload."""

from __future__ import annotations

import json
import uuid

from fastapi import APIRouter, File, HTTPException, Query, UploadFile

from db.database import create_upload_session, save_session
from models.schemas import CaseSummary, PatientProfile, SessionPayload, UploadResponse
from services.cases import CASE_REGISTRY, list_cases, load_case_pack, parse_upload_content

router = APIRouter(prefix="/api", tags=["session"])

ALLOWED_EXTENSIONS = {".txt", ".md", ".json"}


def _ocr_preview(text: str | None, limit: int = 500) -> str | None:
    if not text:
        return None
    return text[:limit] + ("…" if len(text) > limit else "")


def _session_from_pack(pack: dict, *, demo: bool = False, file_count: int = 0) -> UploadResponse:
    case_id = pack.get("case_id")
    session_id = pack.get("demo_session_id") if demo and pack.get("demo_session_id") else f"case-{uuid.uuid4().hex[:10]}"
    raw_text = pack.get("raw_ocr_text") or pack.get("raw_text") or ""

    profile = PatientProfile()
    if pack.get("patient_profile"):
        profile = PatientProfile.model_validate(pack["patient_profile"])

    create_upload_session(
        session_id,
        raw_text or None,
        file_count=file_count,
        patient_description=pack.get("label"),
        demo=demo,
    )

    payload = SessionPayload(
        session_id=session_id,
        status="uploaded",
        patient_profile=profile,
    )
    save_session(session_id, payload, raw_text=raw_text or None, pipeline_status="uploaded")

    return UploadResponse(
        session_id=session_id,
        status="uploaded",
        file_count=file_count,
        ocr_preview=_ocr_preview(raw_text),
        demo=demo,
        raw_text=raw_text or None,
        case_id=case_id,
        case_label=pack.get("label"),
    )


@router.get("/cases", response_model=list[CaseSummary])
async def get_cases():
    """Preset cases for Safe Demo dropdown."""
    return list_cases()


@router.post("/demo", response_model=UploadResponse, status_code=201)
async def create_demo_session(case_id: str = Query(default="egfr-exon19")):
    """Create session from a preset case (default: EGFR Exon 19 / SYN-001)."""
    if case_id not in CASE_REGISTRY:
        raise HTTPException(404, f"Unknown case_id: {case_id}. Use GET /api/cases")
    pack = load_case_pack(case_id)
    demo = case_id == "egfr-exon19" and bool(pack.get("demo_session_id"))
    return _session_from_pack(pack, demo=demo)


@router.post("/upload", response_model=UploadResponse, status_code=201)
async def upload_files(files: list[UploadFile] = File(...)):
    """
    Upload one or more .txt / .md / .json files.
    - Plain text → stored as raw report; Agent 1 extracts on analyze.
    - JSON with patient_profile → skips Agent 1 (same shape as demo_patient.json).
    """
    if not files:
        raise HTTPException(400, "At least one file is required")

    combined_raw: list[str] = []
    profile: PatientProfile | None = None
    case_label: str | None = None
    case_id: str | None = None

    for f in files:
        name = (f.filename or "upload.txt").lower()
        if not any(name.endswith(ext) for ext in ALLOWED_EXTENSIONS):
            raise HTTPException(
                400,
                f"Unsupported file '{f.filename}'. Use .txt, .md, or .json",
            )
        content = (await f.read()).decode("utf-8", errors="replace")
        parsed_profile, raw = parse_upload_content(content)
        if parsed_profile:
            profile = parsed_profile
        if raw:
            combined_raw.append(raw.strip())
        if name.endswith(".json"):
            try:
                data = json.loads(content)
                case_id = data.get("case_id") or case_id
                case_label = data.get("label") or case_label
            except json.JSONDecodeError:
                pass

    raw_text = "\n\n---\n\n".join(combined_raw) if combined_raw else None
    if not raw_text and not profile:
        raise HTTPException(400, "File(s) contained no usable text or patient_profile")

    pack = {
        "case_id": case_id,
        "label": case_label or (files[0].filename if files else "Uploaded case"),
        "patient_profile": profile.model_dump() if profile else None,
        "raw_ocr_text": raw_text or "",
    }
    # Drop None profile so _session_from_pack uses empty default when text-only
    if not profile:
        pack.pop("patient_profile", None)

    resp = _session_from_pack(pack, demo=False, file_count=len(files))
    return resp
