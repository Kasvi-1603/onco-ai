from fastapi import APIRouter
from backend.services.audit import get_audit_trail

router = APIRouter()

@router.get("/audit/{session_id}")
async def get_audit(session_id: str):
    return await get_audit_trail(session_id)