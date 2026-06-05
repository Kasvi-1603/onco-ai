import asyncio
import json
import aiosqlite
from pathlib import Path
from backend.config import settings

async def seed_trials():
    data_path = Path(__file__).parent / "mock_data" / "trials.json"
    trials = json.loads(data_path.read_text())

    async with aiosqlite.connect(settings.database_url) as db:
        for t in trials:
            await db.execute("""
                INSERT OR IGNORE INTO trials_cache
                (nct_id, title, phase, eligibility_text, biomarker_tags, raw_json)
                VALUES (?,?,?,?,?,?)
            """, (
                t["nct_id"], t["title"], t["phase"],
                t["eligibility_text"],
                json.dumps(t["biomarker_tags"]),
                json.dumps(t)
            ))
        await db.commit()
    print(f"Seeded {len(trials)} trials.")