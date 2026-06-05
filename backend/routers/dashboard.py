from fastapi import APIRouter, HTTPException
from datetime import datetime
import json
from backend.db.database import load_session, save_session, update_session_status
from backend.models.schemas import SessionPayload

router = APIRouter()

@router.get("/dashboard/{session_id}", response_model=SessionPayload)
async def get_dashboard(session_id: str):
    data = await load_session(session_id)
    if not data:
        raise HTTPException(status_code=404, detail="Session not found.")
    return SessionPayload(**data)

@router.post("/dashboard/{session_id}/approve")
async def approve_session(session_id: str):
    data = await load_session(session_id)
    if not data:
        raise HTTPException(status_code=404, detail="Session not found.")

    approved_at = datetime.utcnow().isoformat()
    data["status"] = "shared"
    data["approved_at"] = approved_at
    data["approved_documents"] = data.get("documents", {})

    await save_session(session_id, json.dumps(data))
    await update_session_status(session_id, "shared", approved_at)

    return {
        "status": "shared",
        "approved_at": approved_at,
        "approved_documents": data["approved_documents"]
    }