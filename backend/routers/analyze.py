from fastapi import APIRouter, HTTPException
from pathlib import Path
from backend.services.pipeline import run_pipeline
from backend.models.schemas import SessionPayload

router = APIRouter()

@router.post("/analyze/{session_id}", response_model=SessionPayload)
async def analyze(session_id: str):
    raw_text_path = Path("uploads") / session_id / "_raw_text.txt"

    if not raw_text_path.exists():
        raise HTTPException(status_code=404, detail="Session not found. Upload files first.")

    raw_text = raw_text_path.read_text()
    payload = await run_pipeline(session_id, raw_text)
    return payload