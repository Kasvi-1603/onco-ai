"""Edge cases and adversarial API tests — verify error handling and safety gates."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from db.database import init_db, seed_if_empty
from main import app


@pytest.fixture
def client(tmp_path, monkeypatch):
    db = tmp_path / "edge.db"
    monkeypatch.setattr("config.settings.database_url", str(db))
    monkeypatch.setattr("db.database.settings.database_url", str(db))
    init_db()
    seed_if_empty()
    return TestClient(app)


def test_missing_session_returns_404(client):
    assert client.get("/api/dashboard/nope").status_code == 404
    assert client.post("/api/analyze/nope").status_code == 404
    assert client.get("/api/analyze/nope/status").status_code == 404
    assert client.get("/api/patient/nope").status_code == 404
    assert client.get("/api/audit/nope").status_code == 404


def test_approve_before_analyze_returns_425(client):
    sid = client.post("/api/demo").json()["session_id"]
    assert client.post(f"/api/dashboard/{sid}/approve").status_code == 425


def test_patch_before_analyze_returns_200_but_dashboard_still_425(client):
    sid = client.post("/api/demo").json()["session_id"]
    r = client.patch(
        f"/api/dashboard/{sid}/documents",
        json={"documents": {"treatment_plan": "early edit"}},
    )
    assert r.status_code == 200
    assert client.get(f"/api/dashboard/{sid}").status_code == 425


def test_invalid_lang_returns_422(client):
    sid = client.post("/api/demo").json()["session_id"]
    client.post(f"/api/analyze/{sid}")
    client.post(f"/api/dashboard/{sid}/approve")
    assert client.get(f"/api/patient/{sid}?lang=xx").status_code == 422


def test_patch_missing_documents_returns_422(client):
    sid = client.post("/api/demo").json()["session_id"]
    client.post(f"/api/analyze/{sid}")
    assert client.patch(f"/api/dashboard/{sid}/documents", json={}).status_code == 422


def test_double_analyze_still_produces_cohorts(client):
    sid = client.post("/api/demo").json()["session_id"]
    client.post(f"/api/analyze/{sid}")
    second = client.post(f"/api/analyze/{sid}").json()
    assert len(second["similar_cohorts"]) > 0
    assert second["documents"]["treatment_plan"]


def test_all_four_patient_languages(client):
    sid = client.post("/api/demo").json()["session_id"]
    client.post(f"/api/analyze/{sid}")
    client.post(f"/api/dashboard/{sid}/approve")
    for lang in ("en", "hi", "ta", "kn"):
        r = client.get(f"/api/patient/{sid}?lang={lang}")
        assert r.status_code == 200, lang
        assert r.json()["sections"]["what_we_found"]


def test_patient_summary_regenerate(client):
    sid = client.post("/api/demo").json()["session_id"]
    client.post(f"/api/analyze/{sid}")
    client.post(f"/api/dashboard/{sid}/approve")
    r = client.post(f"/api/patient/{sid}/summary?lang=hi")
    assert r.status_code == 200
    assert r.json()["lang"] == "hi"


def test_patient_summary_before_share_returns_403(client):
    sid = client.post("/api/demo").json()["session_id"]
    client.post(f"/api/analyze/{sid}")
    assert client.post(f"/api/patient/{sid}/summary?lang=en").status_code == 403


def test_upload_without_files_returns_error(client):
    r = client.post("/api/upload", files=[])
    assert r.status_code in (400, 422)


def test_demo_default_case(client):
    demo = client.post("/api/demo").json()
    assert demo["demo"] is True
    assert demo.get("case_id") == "egfr-exon19"


def test_treatment_plan_never_prescriptive_language(client):
    sid = client.post("/api/demo").json()["session_id"]
    payload = client.post(f"/api/analyze/{sid}").json()
    plan = payload["documents"]["treatment_plan"].upper()
    assert "DRAFT" in plan
    banned = ["YOU MUST TAKE", "START IMMEDIATELY", "PRESCRIBE"]
    for phrase in banned:
        assert phrase not in plan


def test_audit_log_has_pipeline_steps(client):
    sid = client.post("/api/demo").json()["session_id"]
    client.post(f"/api/analyze/{sid}")
    client.post(f"/api/dashboard/{sid}/approve")
    steps = {e["step"] for e in client.get(f"/api/audit/{sid}").json()["entries"]}
    assert "similarity" in steps
    assert "trial_match" in steps
    assert "agent2" in steps
    assert "oncologist_approved" in steps
