import asyncio
import json
import aiosqlite
from pathlib import Path
from backend.config import settings

async def seed_knowledge():
    data_path = Path(__file__).parent / "mock_data" / "knowledge.json"
    snippets = json.loads(data_path.read_text())

    async with aiosqlite.connect(settings.database_url) as db:
        for s in snippets:
            await db.execute("""
                INSERT OR IGNORE INTO knowledge_snippets
                (snippet_id, content, tags, source)
                VALUES (?,?,?,?)
            """, (
                s["snippet_id"], s["content"],
                json.dumps(s["tags"]), s["source"]
            ))
        await db.commit()
    print(f"Seeded {len(snippets)} knowledge snippets.")