import uuid
import shutil
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException
from backend.services.ocr import extract_text
from backend.services.audit import log_step

router = APIRouter()
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/upload")
async def upload_files(files: list[UploadFile] = File(...)):
    session_id = str(uuid.uuid4())
    session_dir = UPLOAD_DIR / session_id
    session_dir.mkdir(parents=True)

    all_text_parts = []

    for file in files:
        contents = await file.read()
        # Save raw file
        (session_dir / file.filename).write_bytes(contents)
        # Extract text
        text = extract_text(file.filename, contents)
        all_text_parts.append(f"=== {file.filename} ===\n{text}")

    combined_text = "\n\n".join(all_text_parts)
    # Cache raw text for analyze step
    (session_dir / "_raw_text.txt").write_text(combined_text)

    await log_step(session_id, "upload_complete",
                   input_text=combined_text[:200])

    return {"session_id": session_id, "raw_text_preview": combined_text[:300]}