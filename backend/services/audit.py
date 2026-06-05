import hashlib
import json
import aiosqlite
from datetime import datetime
from backend.config import settings

async def log_step(
    session_id: str,
    step: str,
    model_name: str = "",
    input_text: str = "",
    retrieved_ids: list[str] = []
):
    """Write one audit entry for a pipeline step."""
    input_hash = hashlib.sha256(input_text.encode()).hexdigest()[:16] if input_text else ""

    async with aiosqlite.connect(settings.database_url) as db:
        await db.execute("""
            INSERT INTO audit_log
            (session_id, step, model_name, input_hash, retrieved_ids, timestamp)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            session_id, step, model_name, input_hash,
            json.dumps(retrieved_ids),
            datetime.utcnow().isoformat()
        ))
        await db.commit()

async def get_audit_trail(session_id: str) -> list[dict]:
    """Fetch all audit entries for a session."""
    async with aiosqlite.connect(settings.database_url) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM audit_log WHERE session_id = ? ORDER BY timestamp",
            (session_id,)
        ) as cur:
            rows = await cur.fetchall()
            return [dict(r) for r in rows]