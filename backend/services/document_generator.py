"""Phase 2 output generator — all 7 document types from RAGContext."""

from __future__ import annotations

from models.schemas import Agent2Output, RAGContext, SessionDocuments
from services.llm import complete

DOC_SYSTEM = """You draft clinical documents for oncologist review ONLY.
Use ONLY retrieved context. Cite NCCN snippet IDs and cohort IDs.
Never prescribe — label as draft for review. Be concise and clinically precise."""


async def generate_documents(
    ctx: RAGContext, agent2: Agent2Output
) -> tuple[SessionDocuments, str]:
    context = _context_block(ctx, agent2)
    model = "fallback"
    docs = SessionDocuments()

    prompts = {
        "treatment_plan": (
            "Draft a treatment plan: drug, dose, route, schedule, monitoring, NCCN citation. "
            "Header: DRAFT — NOT A PRESCRIPTION."
        ),
        "mdt_brief": (
            "Draft a 1-page MDT/tumor board brief: timeline, molecular snapshot, "
            "similar case outcomes, trial options, clinical question."
        ),
        "trial_report": (
            "Draft trial eligibility summary with NCT IDs, matched criteria, conflicts. "
            "Use 'eligible for review' never 'recommended'."
        ),
        "referral_letter": (
            "Draft a brief referral letter to GP/specialist: diagnosis, stage, plan, next steps."
        ),
        "toxicity_check": (
            "Draft toxicity/contraindication check vs patient labs and FDA snippets. Flag only from context."
        ),
        "prognosis": (
            "Format prognosis stats from context — median OS/PFS, uncertainty band. No new numbers."
        ),
        "patient_summary_clinical": (
            "Draft clinical patient summary for oncologist review before sharing with patient."
        ),
    }

    fallbacks = {
        "treatment_plan": lambda: _fallback_treatment(ctx, agent2),
        "mdt_brief": lambda: _fallback_mdt(ctx, agent2),
        "trial_report": lambda: _fallback_trial_report(ctx),
        "referral_letter": lambda: _fallback_referral(ctx),
        "toxicity_check": lambda: _fallback_toxicity(ctx, agent2),
        "prognosis": lambda: _fallback_prognosis(ctx),
        "patient_summary_clinical": lambda: _fallback_patient_summary(ctx, agent2),
    }

    for field, prompt in prompts.items():
        text, used_model = await complete(
            DOC_SYSTEM, f"{context}\n\n{prompt}", temperature=0.1
        )
        if used_model != "fallback":
            model = used_model
        setattr(docs, field, text or fallbacks[field]())

    return docs, model


def _context_block(ctx: RAGContext, agent2: Agent2Output) -> str:
    p = ctx.patient_profile
    lines = [
        f"Patient: {p.clinical.age}{p.clinical.sex}, stage {p.clinical.stage}, "
        f"EGFR {p.genomic.egfr}, PD-L1 {p.genomic.pd_l1_percent}%",
        agent2.cohort_comparison,
        agent2.clinical_question_suggestion,
    ]
    if ctx.prognosis_stats:
        lines.append(ctx.prognosis_stats.summary)
    for k in ctx.knowledge_snippets[:3]:
        lines.append(f"[{k.snippet_id}] {k.content}")
    return "\n".join(lines)


def _fallback_treatment(ctx: RAGContext, agent2: Agent2Output) -> str:
    p, top = ctx.patient_profile, ctx.top_cohorts[0] if ctx.top_cohorts else None
    snippet = next((k for k in ctx.knowledge_snippets if "osimertinib" in k.content.lower()), None)
    cite = f"[{snippet.snippet_id}]" if snippet else "[NCCN-NSCLC-EGFR-001]"
    return f"""DRAFT TREATMENT PLAN — FOR ONCOLOGIST REVIEW ONLY (NOT A PRESCRIPTION)

Diagnosis: {p.pathology.histological_type or 'NSCLC'} ({p.pathology.subtype}), Stage {p.clinical.stage}
Molecular: EGFR {p.genomic.egfr}, PD-L1 {p.genomic.pd_l1_percent}%

Proposed regimen (draft):
- Osimertinib 80 mg PO once daily continuous
- Monitoring: CBC/CMP q4-6 weeks, CT chest q8-12 weeks per {cite}

Rationale: Similar case {top.cohort_id if top else 'N/A'} — {top.clinical_outcome if top else 'N/A'}.

{agent2.clinical_question_suggestion}
"""


def _fallback_mdt(ctx: RAGContext, agent2: Agent2Output) -> str:
    p = ctx.patient_profile
    lines = [
        "MDT BRIEF — DRAFT",
        f"{p.clinical.age}yo {p.clinical.sex}, ECOG {p.clinical.ecog}, Stage {p.clinical.stage}",
        f"EGFR {p.genomic.egfr}, PD-L1 {p.genomic.pd_l1_percent}%",
        "",
        "Similar cases:",
    ]
    for c in ctx.top_cohorts[:3]:
        lines.append(f"  • {c.cohort_id} ({c.overall_score:.0%}): {c.treatment_given}")
    lines.append(f"\nClinical question: {agent2.clinical_question_suggestion}")
    return "\n".join(lines)


def _fallback_trial_report(ctx: RAGContext) -> str:
    lines = ["TRIAL ELIGIBILITY REPORT — DRAFT", ""]
    for t in ctx.top_trials:
        lines.append(f"{t.nct_id} — eligible for review")
        if t.matched_on:
            lines.append(f"  Matched: {', '.join(t.matched_on)}")
        if t.conflicts:
            lines.append(f"  Conflicts: {', '.join(t.conflicts)}")
        lines.append("")
    return "\n".join(lines)


def _fallback_referral(ctx: RAGContext) -> str:
    p = ctx.patient_profile
    return f"""REFERRAL LETTER — DRAFT

Re: {p.clinical.age}yo {p.clinical.sex} — {p.pathology.histological_type}, Stage {p.clinical.stage}
Molecular profile: EGFR {p.genomic.egfr}

Plan under tumor board review. Please coordinate follow-up imaging and supportive care.
"""


def _fallback_toxicity(ctx: RAGContext, agent2: Agent2Output) -> str:
    lines = ["TOXICITY CHECK — DRAFT", ""]
    for w in agent2.toxicity_warnings:
        lines.append(f"• {w}")
    labs = ctx.patient_profile.clinical.labs
    if labs and hasattr(labs, "egfr_ml_min") and labs.egfr_ml_min:
        if labs.egfr_ml_min < 30:
            lines.append(f"• Renal: eGFR {labs.egfr_ml_min} — review TKI dosing per label")
    return "\n".join(lines) if len(lines) > 2 else "TOXICITY CHECK — DRAFT\nNo contraindications flagged from retrieved context."


def _fallback_prognosis(ctx: RAGContext) -> str:
    if ctx.prognosis_stats:
        return f"PROGNOSIS ESTIMATE — DRAFT\n\n{ctx.prognosis_stats.summary}\n\n{ctx.prognosis_stats.disclaimer}"
    return "PROGNOSIS ESTIMATE — DRAFT\nInsufficient similar cases."


def _fallback_patient_summary(ctx: RAGContext, agent2: Agent2Output) -> str:
    p = ctx.patient_profile
    return f"""PATIENT SUMMARY (CLINICAL DRAFT)

Diagnosis: {p.pathology.histological_type}, Stage {p.clinical.stage}
Key finding: EGFR {p.genomic.egfr}
Plan: Under oncologist review — see treatment plan draft.

Questions for next visit: {agent2.clinical_question_suggestion}
"""
