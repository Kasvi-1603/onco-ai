"""API integration tests — simulated demo flow."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from db.database import init_db, seed_if_empty
from main import app


@pytest.fixture
def client(tmp_path, monkeypatch):
    db = tmp_path / "test.db"
    monkeypatch.setattr("config.settings.database_url", str(db))
    monkeypatch.setattr("db.database.settings.database_url", str(db))
    init_db()
    seed_if_empty()
    return TestClient(app)


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["mode"] == "simulated"


def test_demo_upload_and_analyze(client):
    r = client.post("/api/demo")
    assert r.status_code == 201
    data = r.json()
    assert data["session_id"]
    assert data["status"] == "uploaded"
    assert data["demo"] is True

    sid = data["session_id"]
    r2 = client.post(f"/api/analyze/{sid}")
    assert r2.status_code == 200
    payload = r2.json()
    assert len(payload["similar_cohorts"]) > 0
    assert len(payload["trial_matches"]) > 0
    assert payload["documents"]["treatment_plan"]
    assert payload["documents"]["mdt_brief"]
    assert "DRAFT" in payload["documents"]["treatment_plan"].upper()


def test_dashboard_425_before_analyze(client):
    # Fresh session without analyze
    r = client.post("/api/demo")
    sid = r.json()["session_id"]
    # Reset pipeline to uploaded-only by re-creating without analyze - demo creates uploaded state
    r2 = client.get(f"/api/dashboard/{sid}")
    assert r2.status_code == 425


def test_full_flow_approve_and_patient(client):
    r = client.post("/api/demo")
    sid = r.json()["session_id"]
    client.post(f"/api/analyze/{sid}")

    dash = client.get(f"/api/dashboard/{sid}")
    assert dash.status_code == 200

    patch = client.patch(
        f"/api/dashboard/{sid}/documents",
        json={"documents": {"treatment_plan": "Edited draft plan", "mdt_brief": "x", "trial_report": "x",
                            "referral_letter": "", "toxicity_check": "", "prognosis": "", "patient_summary_clinical": ""}},
    )
    assert patch.status_code == 200
    assert "Edited" in patch.json()["documents"]["treatment_plan"]

    before = client.get(f"/api/patient/{sid}")
    assert before.status_code == 403

    approve = client.post(f"/api/dashboard/{sid}/approve", json={})
    assert approve.status_code == 200
    assert approve.json()["status"] == "shared"
    assert f"/patient/{sid}" in approve.json()["patient_portal_url"]

    portal = client.get(f"/api/patient/{sid}?lang=en")
    assert portal.status_code == 200
    assert portal.json()["sections"]["what_we_found"]

    audit = client.get(f"/api/audit/{sid}")
    assert audit.status_code == 200
    assert audit.json()["session_id"] == sid
    assert len(audit.json()["entries"]) > 0


def test_analyze_status(client):
    r = client.post("/api/demo")
    sid = r.json()["session_id"]
    client.post(f"/api/analyze/{sid}")
    st = client.get(f"/api/analyze/{sid}/status")
    assert st.status_code == 200
    assert st.json()["status"] == "ready"
