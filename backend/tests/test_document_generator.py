"""Dev 3 — document generator tests."""

from __future__ import annotations

import pytest

from agents.synthesizer import _fallback_synthesize
from models.schemas import SessionDocuments
from services.document_generator import (
    _fallback_mdt,
    _fallback_treatment,
    _fallback_trial_report,
    generate_documents,
)


class TestDocumentFallbacks:
    def test_treatment_plan_is_draft_not_prescription(self, minimal_rag_context):
        agent2 = _fallback_synthesize(minimal_rag_context)
        text = _fallback_treatment(minimal_rag_context, agent2)
        assert "DRAFT" in text
        assert "NOT A PRESCRIPTION" in text.upper() or "FOR ONCOLOGIST REVIEW" in text.upper()

    def test_treatment_plan_cites_egfr_and_osimertinib(self, minimal_rag_context):
        agent2 = _fallback_synthesize(minimal_rag_context)
        text = _fallback_treatment(minimal_rag_context, agent2)
        assert "Osimertinib" in text
        assert "EGFR" in text or "exon 19" in text.lower()

    def test_treatment_plan_cites_similar_cohort(self, minimal_rag_context):
        agent2 = _fallback_synthesize(minimal_rag_context)
        text = _fallback_treatment(minimal_rag_context, agent2)
        assert "SYN-001" in text

    def test_treatment_plan_cites_nccn_snippet(self, minimal_rag_context):
        agent2 = _fallback_synthesize(minimal_rag_context)
        text = _fallback_treatment(minimal_rag_context, agent2)
        assert "NCCN" in text

    def test_mdt_brief_includes_demographics_and_question(self, minimal_rag_context):
        agent2 = _fallback_synthesize(minimal_rag_context)
        text = _fallback_mdt(minimal_rag_context, agent2)
        assert "54" in text
        assert "SYN-001" in text
        assert agent2.clinical_question_suggestion.split()[0] in text or "Clinical question" in text

    def test_trial_report_lists_nct_ids(self, minimal_rag_context):
        text = _fallback_trial_report(minimal_rag_context)
        assert "NCT03164553" in text

    def test_trial_report_never_says_recommended(self, minimal_rag_context):
        text = _fallback_trial_report(minimal_rag_context)
        assert "recommended" not in text.lower()


class TestDocumentGeneratorAsync:
    @pytest.mark.asyncio
    async def test_generate_all_three_mvp_docs(self, rag_context, mock_llm_fallback):
        agent2 = _fallback_synthesize(rag_context)
        docs, model = await generate_documents(rag_context, agent2)
        assert model == "fallback"
        assert isinstance(docs, SessionDocuments)
        assert len(docs.treatment_plan) > 100
        assert len(docs.mdt_brief) > 50
        assert len(docs.trial_report) > 20

    @pytest.mark.asyncio
    async def test_generate_with_mock_llm(self, rag_context, mock_llm_docs):
        agent2 = _fallback_synthesize(rag_context)
        docs, model = await generate_documents(rag_context, agent2)
        assert model == "mock-groq"
        assert "DRAFT TREATMENT PLAN" in docs.treatment_plan
        assert "MDT BRIEF" in docs.mdt_brief
        assert "NCT03164553" in docs.trial_report

    @pytest.mark.asyncio
    async def test_demo_patient_docs_reference_retrieved_trials(self, rag_context, mock_llm_fallback):
        agent2 = _fallback_synthesize(rag_context)
        docs, _ = await generate_documents(rag_context, agent2)
        nct_in_report = any(t.nct_id in docs.trial_report for t in rag_context.top_trials)
        assert nct_in_report

    @pytest.mark.asyncio
    async def test_prognosis_in_mdt_when_available(self, rag_context, mock_llm_fallback):
        agent2 = _fallback_synthesize(rag_context)
        docs, _ = await generate_documents(rag_context, agent2)
        if rag_context.prognosis_stats and rag_context.prognosis_stats.summary:
            assert "Median" in docs.mdt_brief or "similar" in docs.mdt_brief.lower()
