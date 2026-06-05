import aiosqlite
import json
from backend.config import settings

DB_PATH = settings.database_url

async def get_db():
    """FastAPI dependency — yields one connection per request."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        yield db

async def init_db():
    """Called once at app startup — creates all tables."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.executescript("""
            CREATE TABLE IF NOT EXISTS sessions (
                session_id   TEXT PRIMARY KEY,
                status       TEXT DEFAULT 'pending',
                payload_json TEXT,
                created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                approved_at  TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS historical_cohorts (
                cohort_id           TEXT PRIMARY KEY,
                cancer_subtype      TEXT,
                primary_mutation    TEXT,
                stage               TEXT,
                pd_l1_percent       REAL,
                age                 INTEGER,
                sex                 TEXT,
                smoking             TEXT,
                ecog                INTEGER,
                pathology_summary   TEXT,
                treatment_given     TEXT,
                outcome_os_months   REAL,
                outcome_pfs_months  REAL,
                clinical_outcome    TEXT,
                toxicity_profile    TEXT,
                raw_json            TEXT
            );

            CREATE TABLE IF NOT EXISTS trials_cache (
                nct_id           TEXT PRIMARY KEY,
                title            TEXT,
                phase            TEXT,
                eligibility_text TEXT,
                biomarker_tags   TEXT,
                raw_json         TEXT
            );

            CREATE TABLE IF NOT EXISTS knowledge_snippets (
                snippet_id TEXT PRIMARY KEY,
                content    TEXT,
                tags       TEXT,
                source     TEXT
            );

            CREATE TABLE IF NOT EXISTS audit_log (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id   TEXT,
                step         TEXT,
                model_name   TEXT,
                input_hash   TEXT,
                retrieved_ids TEXT,
                timestamp    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        await db.commit()

async def save_session(session_id: str, payload_json: str):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """INSERT OR REPLACE INTO sessions (session_id, payload_json)
               VALUES (?, ?)""",
            (session_id, payload_json)
        )
        await db.commit()

async def load_session(session_id: str) -> dict | None:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM sessions WHERE session_id = ?", (session_id,)
        ) as cur:
            row = await cur.fetchone()
            if row:
                return json.loads(row["payload_json"])
            return None

async def update_session_status(session_id: str, status: str, approved_at=None):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "UPDATE sessions SET status=?, approved_at=? WHERE session_id=?",
            (status, approved_at, session_id)
        )
        await db.commit()