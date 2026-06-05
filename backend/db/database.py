"""SQLite init, session persistence, seed data access."""

from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterator

from config import settings
from models.schemas import SessionPayload

MOCK_DATA_DIR = Path(__file__).parent / "mock_data"


def _db_path() -> Path:
    return Path(settings.database_url).resolve()


@contextmanager
def get_conn() -> Iterator[sqlite3.Connection]:
    path = _db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(path))
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    with get_conn() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS sessions (
                session_id TEXT PRIMARY KEY,
                status TEXT NOT NULL DEFAULT 'pending',
                payload_json TEXT NOT NULL,
                raw_text TEXT,
                approved_at TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS historical_cohorts (
                cohort_id TEXT PRIMARY KEY,
                data_json TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS trials_cache (
                nct_id TEXT PRIMARY KEY,
                data_json TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS knowledge_snippets (
                snippet_id TEXT PRIMARY KEY,
                data_json TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS audit_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                step TEXT NOT NULL,
                model TEXT,
                input_hash TEXT,
                retrieved_ids_json TEXT,
                details_json TEXT,
                timestamp TEXT NOT NULL
            );
            """
        )


def load_json_file(name: str) -> Any:
    with open(MOCK_DATA_DIR / name, encoding="utf-8") as f:
        return json.load(f)


def seed_if_empty() -> None:
    with get_conn() as conn:
        cohort_count = conn.execute("SELECT COUNT(*) FROM historical_cohorts").fetchone()[0]
        if cohort_count == 0:
            for row in load_json_file("cohorts.json"):
                conn.execute(
                    "INSERT INTO historical_cohorts (cohort_id, data_json) VALUES (?, ?)",
                    (row["cohort_id"], json.dumps(row)),
                )
        trial_count = conn.execute("SELECT COUNT(*) FROM trials_cache").fetchone()[0]
        if trial_count == 0:
            for row in load_json_file("trials.json"):
                conn.execute(
                    "INSERT INTO trials_cache (nct_id, data_json) VALUES (?, ?)",
                    (row["nct_id"], json.dumps(row)),
                )
        knowledge_count = conn.execute("SELECT COUNT(*) FROM knowledge_snippets").fetchone()[0]
        if knowledge_count == 0:
            for row in load_json_file("knowledge.json"):
                conn.execute(
                    "INSERT INTO knowledge_snippets (snippet_id, data_json) VALUES (?, ?)",
                    (row["snippet_id"], json.dumps(row)),
                )


def get_all_cohorts() -> list[dict[str, Any]]:
    with get_conn() as conn:
        rows = conn.execute("SELECT data_json FROM historical_cohorts").fetchall()
    return [json.loads(r["data_json"]) for r in rows]


def get_all_trials() -> list[dict[str, Any]]:
    with get_conn() as conn:
        rows = conn.execute("SELECT data_json FROM trials_cache").fetchall()
    return [json.loads(r["data_json"]) for r in rows]


def get_all_knowledge() -> list[dict[str, Any]]:
    with get_conn() as conn:
        rows = conn.execute("SELECT data_json FROM knowledge_snippets").fetchall()
    return [json.loads(r["data_json"]) for r in rows]


def save_session(session_id: str, payload: SessionPayload, raw_text: str | None = None) -> None:
    now = datetime.now(timezone.utc).isoformat()
    payload_json = payload.model_dump_json()
    with get_conn() as conn:
        existing = conn.execute(
            "SELECT session_id FROM sessions WHERE session_id = ?", (session_id,)
        ).fetchone()
        if existing:
            conn.execute(
                """
                UPDATE sessions SET status = ?, payload_json = ?, raw_text = COALESCE(?, raw_text),
                updated_at = ? WHERE session_id = ?
                """,
                (payload.status, payload_json, raw_text, now, session_id),
            )
        else:
            conn.execute(
                """
                INSERT INTO sessions (session_id, status, payload_json, raw_text, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (session_id, payload.status, payload_json, raw_text, now, now),
            )


def get_session(session_id: str) -> SessionPayload | None:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT payload_json FROM sessions WHERE session_id = ?", (session_id,)
        ).fetchone()
    if not row:
        return None
    return SessionPayload.model_validate_json(row["payload_json"])


def get_session_raw_text(session_id: str) -> str | None:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT raw_text FROM sessions WHERE session_id = ?", (session_id,)
        ).fetchone()
    return row["raw_text"] if row else None


def update_session_status(
    session_id: str,
    status: str,
    approved_at: datetime | None = None,
    approved_documents: dict | None = None,
) -> SessionPayload | None:
    payload = get_session(session_id)
    if not payload:
        return None
    payload.status = status  # type: ignore[assignment]
    if approved_at:
        payload.approved_at = approved_at
    if approved_documents:
        from models.schemas import SessionDocuments

        payload.approved_documents = SessionDocuments.model_validate(approved_documents)
    save_session(session_id, payload)
    return payload


def insert_audit(
    session_id: str,
    step: str,
    *,
    model: str | None = None,
    input_hash: str | None = None,
    retrieved_ids: list[str] | None = None,
    details: dict | None = None,
) -> None:
    now = datetime.now(timezone.utc).isoformat()
    with get_conn() as conn:
        conn.execute(
            """
            INSERT INTO audit_log (session_id, step, model, input_hash, retrieved_ids_json, details_json, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                session_id,
                step,
                model,
                input_hash,
                json.dumps(retrieved_ids or []),
                json.dumps(details or {}),
                now,
            ),
        )


def get_audit_log(session_id: str) -> list[dict[str, Any]]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM audit_log WHERE session_id = ? ORDER BY id",
            (session_id,),
        ).fetchall()
    return [
        {
            "step": r["step"],
            "model": r["model"],
            "input_hash": r["input_hash"],
            "retrieved_ids": json.loads(r["retrieved_ids_json"] or "[]"),
            "timestamp": r["timestamp"],
            "details": json.loads(r["details_json"] or "{}"),
        }
        for r in rows
    ]
