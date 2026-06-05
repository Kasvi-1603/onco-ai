"""Agent 2 — RAG-grounded synthesizer."""

from __future__ import annotations

from models.schemas import Agent2Output, RAGContext, TrialJustification
from services.llm import complete, parse_json_response

SYNTH_SYSTEM = """You are an oncology clinical decision support synthesizer.
Use ONLY the retrieved context provided. Do not invent patients, trials, doses, or outcomes.
Cite cohort_id, nct_id, and snippet_id when referencing facts.
Return JSON:
{
  "trial_justifications": [{"nct_id", "rationale", "matched_criteria": []}],
  "cohort_comparison": "string",
  "toxicity_warnings": ["string"],
  "clinical_question_suggestion": "string"
}
All outputs are DRAFT for oncologist review."""


def _build_context_prompt(ctx: RAGContext) -> str:
    lines = ["=== PATIENT PROFILE ===", ctx.patient_profile.model_dump_json(indent=2)]
    lines.append("\n=== TOP SIMILAR COHORTS ===")
    for c in ctx.top_cohorts[:5]:
        lines.append(
            f"- {c.cohort_id}: {c.overall_score:.0%} match, treatment={c.treatment_given}, "
            f"OS={c.outcome_os_months}mo, toxicity={c.toxicity_profile}"
        )
    lines.append("\n=== TRIAL MATCHES ===")
    for t in ctx.top_trials[:5]:
        lines.append(f"- {t.nct_id}: {t.eligibility}, matched={t.matched_on}, conflicts={t.conflicts}")
    lines.append("\n=== KNOWLEDGE SNIPPETS ===")
    for k in ctx.knowledge_snippets:
        lines.append(f"- [{k.snippet_id}] {k.content[:200]}")
    if ctx.prognosis_stats:
        lines.append(f"\n=== PROGNOSIS (computed) ===\n{ctx.prognosis_stats.summary}")
    return "\n".join(lines)


async def synthesize(ctx: RAGContext) -> tuple[Agent2Output, str]:
    user = _build_context_prompt(ctx)
    text, model = await complete(SYNTH_SYSTEM, user, json_mode=True)

    if text:
        try:
            data = parse_json_response(text)
            return Agent2Output.model_validate(data), model
        except Exception:
            pass

    return _fallback_synthesize(ctx), "fallback"


def _fallback_synthesize(ctx: RAGContext) -> Agent2Output:
    top = ctx.top_cohorts[0] if ctx.top_cohorts else None
    justifications: list[TrialJustification] = []
    for t in ctx.top_trials[:3]:
        if t.eligibility == "eligible_for_review":
            justifications.append(
                TrialJustification(
                    nct_id=t.nct_id,
                    rationale=f"Eligible for review based on: {', '.join(t.matched_on[:3]) or 'profile match'}.",
                    matched_criteria=t.matched_on,
                )
            )

    comparison = "No similar cohorts retrieved."
    if top:
        comparison = (
            f"Patient aligns most closely with {top.cohort_id} ({top.overall_score:.0%} weighted match). "
            f"That cohort received {top.treatment_given} with outcome {top.clinical_outcome} "
            f"(OS {top.outcome_os_months} mo, PFS {top.outcome_pfs_months} mo)."
        )

    tox: list[str] = []
    if top and top.toxicity_profile:
        tox.append(f"{top.cohort_id}: {top.toxicity_profile}")
    for c in ctx.top_cohorts[1:3]:
        if c.toxicity_profile:
            tox.append(f"{c.cohort_id}: {c.toxicity_profile}")

    question = "Review first-line EGFR-TKI vs chemoradiation strategy for stage III EGFR-mutated NSCLC."
    if ctx.patient_profile.clinical.stage and "III" in ctx.patient_profile.clinical.stage:
        question = (
            "Candidate for definitive chemoradiation with durvalumab consolidation "
            "vs upfront osimertinib in stage III EGFR-mutated disease?"
        )

    return Agent2Output(
        trial_justifications=justifications,
        cohort_comparison=comparison,
        toxicity_warnings=tox,
        clinical_question_suggestion=question,
    )
