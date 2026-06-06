"""Tests for preset cases and file upload."""

from __future__ import annotations

import io

import pytest
from fastapi.testclient import TestClient

from db.database import init_db, seed_if_empty
from main import app


@pytest.fixture
def client(tmp_path, monkeypatch):
    db = tmp_path / "cases.db"
    monkeypatch.setattr("config.settings.database_url", str(db))
    monkeypatch.setattr("db.database.settings.database_url", str(db))
    init_db()
    seed_if_empty()
    return TestClient(app)


def test_list_cases(client):
    r = client.get("/api/cases")
    assert r.status_code == 200
    ids = {c["case_id"] for c in r.json()}
    assert "egfr-exon19" in ids
    assert "kras-g12c" in ids


def test_demo_with_case_id(client):
    r = client.post("/api/demo?case_id=kras-g12c")
    assert r.status_code == 201
    data = r.json()
    assert data["case_id"] == "kras-g12c"
    assert data["session_id"]

    analyzed = client.post(f"/api/analyze/{data['session_id']}").json()
    top = analyzed["similar_cohorts"][0]["cohort_id"]
    assert top == "SYN-003"


def test_upload_txt_report(client):
    text = "PATHOLOGY: 54F never smoker. EGFR exon 19 deletion. Stage IIIA LUAD. PD-L1 12%."
    r = client.post(
        "/api/upload",
        files=[("files", ("report.txt", io.BytesIO(text.encode()), "text/plain"))],
    )
    assert r.status_code == 201
    sid = r.json()["session_id"]
    assert r.json()["ocr_preview"]


def test_upload_json_case_pack(client):
    pack = client.get("/api/cases").json()
    r = client.post("/api/demo?case_id=egfr-exon19")
    sid = r.json()["session_id"]
    # Re-use demo json file content via upload
    import json
    from pathlib import Path

    root = Path(__file__).resolve().parents[1] / "db" / "mock_data" / "demo_patient.json"
    r2 = client.post(
        "/api/upload",
        files=[("files", ("case.json", io.BytesIO(root.read_bytes()), "application/json"))],
    )
    assert r2.status_code == 201
    analyzed = client.post(f"/api/analyze/{r2.json()['session_id']}").json()
    assert analyzed["patient_profile"]["genomic"]["egfr"]


def test_upload_empty_returns_400(client):
    r = client.post("/api/upload", files=[])
    assert r.status_code == 422 or r.status_code == 400
