"""Phase 2 document generator — MVP: treatment_plan + mdt_brief + trial_report."""

from __future__ import annotations

from models.schemas import Agent2Output, RAGContext, SessionDocuments
from services.llm import complete

DOC_SYSTEM = """You draft clinical documents for oncologist review ONLY.
Use ONLY retrieved context. Cite NCCN snippet IDs and cohort IDs.
Never prescribe — label as draft for review.
Be concise and clinically precise."""


async def generate_documents(
    ctx: RAGContext, agent2: Agent2Output
) -> tuple[SessionDocuments, str]:
    context = _context_block(ctx, agent2)
    model = "fallback"
    docs = SessionDocuments()

    treatment_prompt = (
        f"{context}\n\nDraft a treatment plan including drug, dose, route, schedule, "
        "monitoring, and NCCN citation. Header: DRAFT — NOT A PRESCRIPTION."
    )
    t_text, t_model = await complete(DOC_SYSTEM, treatment_prompt, temperature=0.1)
    if t_model != "fallback":
        model = t_model
    docs.treatment_plan = t_text or _fallback_treatment(ctx, agent2)

    mdt_prompt = (
        f"{context}\n\nDraft a 1-page MDT/tumor board brief: timeline, molecular snapshot, "
        "similar case outcomes, trial options, and clinical question."
    )
    m_text, m_model = await complete(DOC_SYSTEM, mdt_prompt, temperature=0.1)
    if m_model != "fallback":
        model = m_model
    docs.mdt_brief = m_text or _fallback_mdt(ctx, agent2)

    trial_prompt = (
        f"{context}\n\nDraft a trial eligibility summary listing NCT IDs with matched criteria "
        "and conflicts. Never say 'recommended' — use 'eligible for review'."
    )
    tr_text, _ = await complete(DOC_SYSTEM, trial_prompt, temperature=0.1)
    docs.trial_report = tr_text or _fallback_trial_report(ctx)

    return docs, model


def _context_block(ctx: RAGContext, agent2: Agent2Output) -> str:
    p = ctx.patient_profile
    egfr = p.genomic.egfr or "unknown"
    stage = p.clinical.stage or "unknown"
    lines = [
        f"Patient: {p.clinical.age}{p.clinical.sex}, stage {stage}, EGFR {egfr}, PD-L1 {p.genomic.pd_l1_percent}%",
        agent2.cohort_comparison,
        agent2.clinical_question_suggestion,
    ]
    for k in ctx.knowledge_snippets[:3]:
        lines.append(f"[{k.snippet_id}] {k.content}")
    return "\n".join(lines)


def _fallback_treatment(ctx: RAGContext, agent2: Agent2Output) -> str:
    p = ctx.patient_profile
    top = ctx.top_cohorts[0] if ctx.top_cohorts else None
    snippet = next((k for k in ctx.knowledge_snippets if "osimertinib" in k.content.lower()), None)
    cite = f"[{snippet.snippet_id}]" if snippet else "[NCCN-NSCLC-EGFR-001]"

    return f"""DRAFT TREATMENT PLAN — FOR ONCOLOGIST REVIEW ONLY (NOT A PRESCRIPTION)

Diagnosis: {p.pathology.histological_type or 'NSCLC'} ({p.pathology.subtype}), Stage {p.clinical.stage}
Molecular: EGFR {p.genomic.egfr}, PD-L1 {p.genomic.pd_l1_percent}%, TMB {p.genomic.tmb}

Proposed regimen (draft):
- Osimertinib 80 mg PO once daily continuous
- Monitoring: CBC/CMP q4-6 weeks, CT chest q8-12 weeks per {cite}
- Toxicity counseling: rash, diarrhea, ILD monitoring per FDA label

Rationale: EGFR sensitizing mutation; similar case {top.cohort_id if top else 'N/A'} received same regimen with {top.clinical_outcome if top else 'N/A'}.

Alternative under discussion: Definitive chemoradiation + durvalumab consolidation if deemed unresectable stage III per tumor board.

{agent2.clinical_question_suggestion}
"""


def _fallback_mdt(ctx: RAGContext, agent2: Agent2Output) -> str:
    p = ctx.patient_profile
    lines = [
        "MDT BRIEF — DRAFT",
        f"Demographics: {p.clinical.age}yo {p.clinical.sex}, ECOG {p.clinical.ecog}, {p.clinical.smoking} smoker",
        f"Diagnosis: {p.pathology.histological_type}, Stage {p.clinical.stage} ({p.clinical.tnm or 'TNM pending'})",
        f"Molecular: EGFR {p.genomic.egfr}, KRAS {p.genomic.kras}, PD-L1 {p.genomic.pd_l1_percent}%",
        "",
        "Similar institutional cases:",
    ]
    for c in ctx.top_cohorts[:3]:
        lines.append(
            f"  • {c.cohort_id} ({c.overall_score:.0%}): {c.treatment_given} → "
            f"{c.clinical_outcome}, OS {c.outcome_os_months}mo"
        )
    lines.extend(["", "Trials eligible for review:"])
    for t in ctx.top_trials[:3]:
        lines.append(f"  • {t.nct_id} — {', '.join(t.matched_on[:2])}")
    if ctx.prognosis_stats:
        lines.extend(["", f"Prognosis (similar cohorts): {ctx.prognosis_stats.summary}"])
    lines.extend(["", f"Clinical question: {agent2.clinical_question_suggestion}"])
    return "\n".join(lines)


def _fallback_trial_report(ctx: RAGContext) -> str:
    lines = ["TRIAL ELIGIBILITY REPORT — DRAFT", ""]
    for t in ctx.top_trials:
        lines.append(f"{t.nct_id} — {t.title[:80]}...")
        lines.append(f"  Status: {t.eligibility.replace('_', ' ').title()}")
        if t.matched_on:
            lines.append(f"  Matched: {', '.join(t.matched_on)}")
        if t.conflicts:
            lines.append(f"  Conflicts: {', '.join(t.conflicts)}")
        lines.append("")
    return "\n".join(lines)
