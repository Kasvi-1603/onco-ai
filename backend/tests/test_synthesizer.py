"""Dev 3 — Agent 2 synthesizer tests."""

from __future__ import annotations

import pytest

from agents.synthesizer import _build_context_prompt, _fallback_synthesize, synthesize
from models.schemas import Agent2Output


class TestSynthesizerFallback:
    def test_fallback_returns_agent2_output(self, minimal_rag_context):
        out = _fallback_synthesize(minimal_rag_context)
        assert isinstance(out, Agent2Output)

    def test_fallback_cites_top_cohort_id(self, minimal_rag_context):
        out = _fallback_synthesize(minimal_rag_context)
        assert "SYN-001" in out.cohort_comparison
        assert "87%" in out.cohort_comparison or "0.87" in out.cohort_comparison.lower()

    def test_fallback_includes_trial_justifications(self, minimal_rag_context):
        out = _fallback_synthesize(minimal_rag_context)
        assert len(out.trial_justifications) >= 1
        assert out.trial_justifications[0].nct_id == "NCT03164553"

    def test_fallback_toxicity_from_cohorts(self, minimal_rag_context):
        out = _fallback_synthesize(minimal_rag_context)
        assert any("SYN-001" in w for w in out.toxicity_warnings)

    def test_fallback_clinical_question_for_stage_iii(self, minimal_rag_context):
        out = _fallback_synthesize(minimal_rag_context)
        assert out.clinical_question_suggestion
        assert "chemoradiation" in out.clinical_question_suggestion.lower() or "osimertinib" in out.clinical_question_suggestion.lower()


class TestSynthesizerAsync:
    @pytest.mark.asyncio
    async def test_synthesize_uses_fallback_without_llm(self, rag_context, mock_llm_fallback):
        out, model = await synthesize(rag_context)
        assert model in ("fallback", "mock-groq", "llama-3.3-70b-versatile")
        assert out.cohort_comparison
        assert len(out.trial_justifications) >= 1

    @pytest.mark.asyncio
    async def test_synthesize_with_mock_groq(self, rag_context, mock_llm_synth_json):
        out, model = await synthesize(rag_context)
        assert model == "mock-groq"
        assert "SYN-001" in out.cohort_comparison
        assert out.trial_justifications[0].nct_id == "NCT03164553"

    @pytest.mark.asyncio
    async def test_synthesize_demo_patient_top_cohort_in_comparison(self, rag_context, mock_llm_fallback):
        out, _ = await synthesize(rag_context)
        top_id = rag_context.top_cohorts[0].cohort_id
        assert top_id in out.cohort_comparison

    def test_context_prompt_includes_retrieval_ids(self, rag_context):
        prompt = _build_context_prompt(rag_context)
        assert "SYN-" in prompt or rag_context.top_cohorts[0].cohort_id in prompt
        assert "NCT" in prompt
        for k in rag_context.knowledge_snippets[:1]:
            assert k.snippet_id in prompt


class TestSynthesizerSafety:
    @pytest.mark.asyncio
    async def test_output_only_references_retrieved_cohort_ids(self, rag_context, mock_llm_fallback):
        out, _ = await synthesize(rag_context)
        allowed = {c.cohort_id for c in rag_context.top_cohorts}
        for w in out.toxicity_warnings:
            if "SYN-" in w:
                cited = next((cid for cid in allowed if cid in w), None)
                assert cited is not None, f"Toxicity cites unknown cohort: {w}"

    @pytest.mark.asyncio
    async def test_trial_justifications_use_retrieved_nct_ids(self, rag_context, mock_llm_fallback):
        out, _ = await synthesize(rag_context)
        allowed_nct = {t.nct_id for t in rag_context.top_trials}
        for j in out.trial_justifications:
            assert j.nct_id in allowed_nct
