"""SQLite init, session persistence, pipeline state, seed data."""

from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterator

from config import settings
from models.schemas import (
    PIPELINE_STEPS,
    PipelineStatus,
    SessionDocuments,
    SessionPayload,
)

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
                patient_description TEXT,
                approved_at TEXT,
                pipeline_status TEXT NOT NULL DEFAULT 'uploaded',
                pipeline_step TEXT NOT NULL DEFAULT 'ocr',
                pipeline_steps_json TEXT NOT NULL DEFAULT '[]',
                pipeline_error TEXT,
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
        _migrate_sessions(conn)


def _migrate_sessions(conn: sqlite3.Connection) -> None:
    cols = {r[1] for r in conn.execute("PRAGMA table_info(sessions)").fetchall()}
    migrations = {
        "patient_description": "ALTER TABLE sessions ADD COLUMN patient_description TEXT",
        "pipeline_status": "ALTER TABLE sessions ADD COLUMN pipeline_status TEXT NOT NULL DEFAULT 'uploaded'",
        "pipeline_step": "ALTER TABLE sessions ADD COLUMN pipeline_step TEXT NOT NULL DEFAULT 'ocr'",
        "pipeline_steps_json": "ALTER TABLE sessions ADD COLUMN pipeline_steps_json TEXT NOT NULL DEFAULT '[]'",
        "pipeline_error": "ALTER TABLE sessions ADD COLUMN pipeline_error TEXT",
    }
    for col, sql in migrations.items():
        if col not in cols:
            conn.execute(sql)


def load_json_file(name: str) -> Any:
    with open(MOCK_DATA_DIR / name, encoding="utf-8") as f:
        return json.load(f)


def seed_if_empty() -> None:
    with get_conn() as conn:
        if conn.execute("SELECT COUNT(*) FROM historical_cohorts").fetchone()[0] == 0:
            for row in load_json_file("cohorts.json"):
                conn.execute(
                    "INSERT INTO historical_cohorts (cohort_id, data_json) VALUES (?, ?)",
                    (row["cohort_id"], json.dumps(row)),
                )
        if conn.execute("SELECT COUNT(*) FROM trials_cache").fetchone()[0] == 0:
            for row in load_json_file("trials.json"):
                conn.execute(
                    "INSERT INTO trials_cache (nct_id, data_json) VALUES (?, ?)",
                    (row["nct_id"], json.dumps(row)),
                )
        if conn.execute("SELECT COUNT(*) FROM knowledge_snippets").fetchone()[0] == 0:
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


def update_pipeline_status(
    session_id: str,
    *,
    pipeline_status: str,
    current_step: str,
    steps_completed: list[str] | None = None,
    error: str | None = None,
) -> None:
    now = datetime.now(timezone.utc).isoformat()
    with get_conn() as conn:
        conn.execute(
            """
            UPDATE sessions SET pipeline_status = ?, pipeline_step = ?,
            pipeline_steps_json = ?, pipeline_error = ?, updated_at = ?
            WHERE session_id = ?
            """,
            (
                pipeline_status,
                current_step,
                json.dumps(steps_completed or []),
                error,
                now,
                session_id,
            ),
        )


def get_pipeline_status(session_id: str) -> PipelineStatus | None:
    with get_conn() as conn:
        row = conn.execute(
            """
            SELECT pipeline_status, pipeline_step, pipeline_steps_json, pipeline_error
            FROM sessions WHERE session_id = ?
            """,
            (session_id,),
        ).fetchone()
    if not row:
        return None
    return PipelineStatus(
        session_id=session_id,
        status=row["pipeline_status"],
        current_step=row["pipeline_step"],
        steps_completed=json.loads(row["pipeline_steps_json"] or "[]"),
        steps_total=len(PIPELINE_STEPS),
        error=row["pipeline_error"],
    )


def save_session(
    session_id: str,
    payload: SessionPayload,
    *,
    raw_text: str | None = None,
    patient_description: str | None = None,
    pipeline_status: str | None = None,
) -> None:
    now = datetime.now(timezone.utc).isoformat()
    payload_json = payload.model_dump_json()
    with get_conn() as conn:
        existing = conn.execute(
            "SELECT session_id FROM sessions WHERE session_id = ?", (session_id,)
        ).fetchone()
        if existing:
            if pipeline_status:
                conn.execute(
                    """
                    UPDATE sessions SET status = ?, payload_json = ?,
                    raw_text = COALESCE(?, raw_text),
                    patient_description = COALESCE(?, patient_description),
                    pipeline_status = ?, updated_at = ?
                    WHERE session_id = ?
                    """,
                    (
                        payload.status,
                        payload_json,
                        raw_text,
                        patient_description,
                        pipeline_status,
                        now,
                        session_id,
                    ),
                )
            else:
                conn.execute(
                    """
                    UPDATE sessions SET status = ?, payload_json = ?,
                    raw_text = COALESCE(?, raw_text),
                    patient_description = COALESCE(?, patient_description),
                    updated_at = ? WHERE session_id = ?
                    """,
                    (
                        payload.status,
                        payload_json,
                        raw_text,
                        patient_description,
                        now,
                        session_id,
                    ),
                )
        else:
            conn.execute(
                """
                INSERT INTO sessions (
                    session_id, status, payload_json, raw_text, patient_description,
                    pipeline_status, pipeline_step, pipeline_steps_json,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    session_id,
                    payload.status,
                    payload_json,
                    raw_text,
                    patient_description,
                    pipeline_status or "uploaded",
                    "ocr",
                    "[]",
                    now,
                    now,
                ),
            )


def create_upload_session(
    session_id: str,
    raw_text: str | None,
    *,
    file_count: int = 0,
    patient_description: str | None = None,
    demo: bool = False,
) -> None:
    payload = SessionPayload(session_id=session_id, status="uploaded")
    save_session(
        session_id,
        payload,
        raw_text=raw_text,
        patient_description=patient_description,
        pipeline_status="uploaded",
    )
    steps = ["ocr"] if raw_text else []
    update_pipeline_status(
        session_id,
        pipeline_status="uploaded",
        current_step="extract" if raw_text else "ocr",
        steps_completed=steps,
    )


def get_session(session_id: str) -> SessionPayload | None:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT payload_json FROM sessions WHERE session_id = ?", (session_id,)
        ).fetchone()
    if not row:
        return None
    return SessionPayload.model_validate_json(row["payload_json"])


def session_exists(session_id: str) -> bool:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT 1 FROM sessions WHERE session_id = ?", (session_id,)
        ).fetchone()
    return row is not None


def get_session_raw_text(session_id: str) -> str | None:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT raw_text, patient_description FROM sessions WHERE session_id = ?",
            (session_id,),
        ).fetchone()
    if not row:
        return None
    parts = []
    if row["raw_text"]:
        parts.append(row["raw_text"])
    if row["patient_description"]:
        parts.append(f"\n--- Patient-reported symptoms ---\n{row['patient_description']}")
    return "\n".join(parts) if parts else None


def is_pipeline_ready(session_id: str) -> bool:
    ps = get_pipeline_status(session_id)
    return ps is not None and ps.status == "ready"


def update_session_documents(session_id: str, documents: SessionDocuments) -> SessionPayload | None:
    payload = get_session(session_id)
    if not payload:
        return None
    payload.documents = documents
    if payload.status == "uploaded":
        payload.status = "pending"
    save_session(session_id, payload)
    return payload


def approve_session(
    session_id: str,
    *,
    approved_documents: SessionDocuments | None = None,
    approver_note: str | None = None,
) -> SessionPayload | None:
    payload = get_session(session_id)
    if not payload:
        return None
    approved_at = datetime.now(timezone.utc)
    docs = approved_documents or payload.documents
    payload.status = "shared"
    payload.approved_at = approved_at
    payload.approved_documents = docs
    save_session(session_id, payload)
    insert_audit(
        session_id,
        "oncologist_approved",
        details={"approver_note": approver_note} if approver_note else None,
    )
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
