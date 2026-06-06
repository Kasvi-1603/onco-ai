"""Dev 3 — end-to-end: RAGContext → Agent 2 → documents."""

from __future__ import annotations

import pytest

from agents.synthesizer import synthesize
from services.document_generator import generate_documents


@pytest.mark.asyncio
async def test_dev3_pipeline_produces_complete_session_documents(rag_context, mock_llm_fallback):
    """What BE Dev 1's pipeline expects from Dev 3 modules."""
    agent2, synth_model = await synthesize(rag_context)
    docs, doc_model = await generate_documents(rag_context, agent2)

    assert synth_model in ("fallback", "mock-groq", "llama-3.3-70b-versatile")
    assert doc_model in ("fallback", "mock-groq", "llama-3.3-70b-versatile")

    assert agent2.cohort_comparison
    assert agent2.clinical_question_suggestion
    assert docs.treatment_plan
    assert docs.mdt_brief
    assert docs.trial_report

    # Safety guardrails
    assert "DRAFT" in docs.treatment_plan.upper()
    assert "recommended" not in docs.trial_report.lower()

    # Grounding — top cohort and trial appear somewhere in outputs
    top_cohort = rag_context.top_cohorts[0].cohort_id
    assert top_cohort in agent2.cohort_comparison or top_cohort in docs.mdt_brief

    if rag_context.top_trials:
        nct = rag_context.top_trials[0].nct_id
        assert nct in docs.trial_report or any(j.nct_id == nct for j in agent2.trial_justifications)


@pytest.mark.asyncio
async def test_dev3_retrieval_ids_present_in_context(rag_context):
    assert len(rag_context.retrieval_ids) >= 3
    assert any(id.startswith("SYN-") for id in rag_context.retrieval_ids)
    assert any(id.startswith("NCT") for id in rag_context.retrieval_ids)
    assert any(id.startswith("NCCN") or id.startswith("FDA") for id in rag_context.retrieval_ids)
