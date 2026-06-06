"""Shared fixtures for backend tests."""

from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest

from db.database import init_db, load_json_file, seed_if_empty
from models.schemas import (
    Agent2Output,
    KnowledgeSnippet,
    PatientProfile,
    PrognosisStats,
    RAGContext,
    SimilarCohort,
    TrialMatch,
)
from services.knowledge_retriever import retrieve_knowledge
from services.prognosis import compute_prognosis
from services.similarity import rank_similar_cohorts
from services.trial_matcher import compute_risk_flags, match_trials


@pytest.fixture
def seeded_db(tmp_path, monkeypatch):
    """Isolated SQLite DB with cohorts, trials, knowledge seeded."""
    db_path = tmp_path / "test.db"
    monkeypatch.setattr("config.settings.database_url", str(db_path))
    monkeypatch.setattr("db.database.settings.database_url", str(db_path))
    init_db()
    seed_if_empty()
    return db_path


@pytest.fixture
def demo_profile() -> PatientProfile:
    demo = load_json_file("demo_patient.json")
    return PatientProfile.model_validate(demo["patient_profile"])


@pytest.fixture
def rag_context(seeded_db, demo_profile) -> RAGContext:
    """Full RAGContext as Dev 3 receives it from pipeline (Phase 1 already run)."""
    cohorts = rank_similar_cohorts(demo_profile, top_k=10)
    trials = match_trials(demo_profile)
    knowledge = retrieve_knowledge(demo_profile, limit=5)
    prognosis = compute_prognosis(cohorts, top_k=8)
    risk_flags = compute_risk_flags(demo_profile)
    retrieval_ids = (
        [c.cohort_id for c in cohorts[:5]]
        + [t.nct_id for t in trials[:5]]
        + [k.snippet_id for k in knowledge]
    )
    return RAGContext(
        session_id="test-session-dev3",
        patient_profile=demo_profile,
        top_cohorts=cohorts,
        top_trials=trials,
        knowledge_snippets=knowledge,
        risk_flags=risk_flags,
        prognosis_stats=prognosis,
        retrieval_ids=retrieval_ids,
    )


@pytest.fixture
def minimal_rag_context() -> RAGContext:
    """Minimal context for unit tests without DB."""
    profile = PatientProfile(
        pathology={"subtype": "LUAD", "histological_type": "Adenocarcinoma"},
        genomic={"egfr": "Exon 19 deletion", "pd_l1_percent": 12},
        clinical={"age": 54, "sex": "F", "stage": "IIIA", "ecog": 1, "smoking": "never"},
        source_snippets={"egfr": "EGFR exon 19 deletion detected."},
    )
    cohort = SimilarCohort(
        cohort_id="SYN-001",
        overall_score=0.87,
        param_breakdown=[],
        primary_mutation="EGFR Exon 19 deletion",
        treatment_given="Osimertinib 80mg PO daily",
        outcome_os_months=18,
        outcome_pfs_months=14,
        clinical_outcome="Partial response",
        toxicity_profile="Grade 2 rash",
    )
    trial = TrialMatch(
        nct_id="NCT03164553",
        title="FLAURA osimertinib first-line",
        phase="Phase 3",
        eligibility="eligible_for_review",
        matched_on=["EGFR (Exon 19 deletion)", "ECOG 1"],
        conflicts=[],
    )
    snippet = KnowledgeSnippet(
        snippet_id="NCCN-NSCLC-EGFR-001",
        source="NCCN mock",
        tags=["EGFR", "osimertinib"],
        content="EGFR exon 19 del → osimertinib preferred first-line.",
    )
    return RAGContext(
        session_id="minimal-test",
        patient_profile=profile,
        top_cohorts=[cohort],
        top_trials=[trial],
        knowledge_snippets=[snippet],
        risk_flags=[],
        prognosis_stats=PrognosisStats(
            cohort_count=1,
            median_os_months=18.0,
            os_range=(14.0, 22.0),
            summary="Median OS 18.0 mo in 1 similar case.",
        ),
        retrieval_ids=["SYN-001", "NCT03164553", "NCCN-NSCLC-EGFR-001"],
    )


@pytest.fixture
def mock_llm_fallback(monkeypatch):
    """Force LLM layer to use template fallbacks (no Groq/Ollama needed)."""
    monkeypatch.setattr("config.settings.groq_api_key", "")
    with patch("services.llm.complete", new_callable=AsyncMock, return_value=("", "fallback")):
        yield


@pytest.fixture
def mock_llm_synth_json():
    """Mock Groq returning valid Agent2 JSON."""
    payload = {
        "trial_justifications": [
            {
                "nct_id": "NCT03164553",
                "rationale": "EGFR exon 19 matches FLAURA inclusion per retrieved trial row.",
                "matched_criteria": ["EGFR sensitizing mutation"],
            }
        ],
        "cohort_comparison": "Patient aligns with SYN-001 (87% match) on EGFR exon 19 del.",
        "toxicity_warnings": ["SYN-001: Grade 2 rash on osimertinib"],
        "clinical_question_suggestion": "First-line osimertinib vs chemoradiation for stage III?",
    }
    import json

    text = json.dumps(payload)
    with patch("agents.synthesizer.complete", new_callable=AsyncMock, return_value=(text, "mock-groq")):
        yield payload


@pytest.fixture
def mock_llm_docs():
    """Mock document generator LLM responses."""
    async def fake_complete(system, user, **kwargs):
        if "treatment plan" in user.lower():
            return "DRAFT TREATMENT PLAN\nOsimertinib 80mg PO QD [NCCN-NSCLC-EGFR-001]", "mock-groq"
        if "mdt" in user.lower() or "tumor board" in user.lower():
            return "MDT BRIEF\nSYN-001 reference case.", "mock-groq"
        if "trial eligibility" in user.lower():
            return "TRIAL REPORT\nNCT03164553 eligible for review.", "mock-groq"
        return "DRAFT", "mock-groq"

    with patch("services.document_generator.complete", side_effect=fake_complete):
        yield
