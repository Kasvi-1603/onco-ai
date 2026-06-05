import json
import uuid
from datetime import datetime
from backend.models.schemas import (
    PatientProfile, RAGContext, SessionPayload,
    Agent2Output, PrognosisStats
)
from backend.services.audit import log_step
from backend.db.database import save_session
from backend.config import settings

async def run_pipeline(session_id: str, raw_text: str) -> SessionPayload:
    """
    Full pipeline:
    1. Agent 1 → PatientProfile         (BE Dev 2)
    2. Retrieval → RAGContext            (BE Dev 2)
    3. Agent 2 → Agent2Output           (BE Dev 3)
    4. Output Generator → documents     (BE Dev 3)
    5. Assemble + save SessionPayload
    """

    # ── DEMO PATIENT bypass ─────────────────────────────────
    if settings.demo_patient:
        return await _demo_payload(session_id)

    # ── STEP 1: Agent 1 — extract PatientProfile ────────────
    await log_step(session_id, "ocr_complete", input_text=raw_text)

    try:
        from backend.agents.extractor import extract_patient_profile
        profile: PatientProfile = await extract_patient_profile(raw_text, session_id)
    except Exception as e:
        print(f"Agent 1 failed: {e} — using empty profile")
        profile = PatientProfile()

    await log_step(session_id, "extract_complete", model_name=settings.groq_model)

    # ── STEP 2: Retrieval — similarity, trials, knowledge, prognosis ──
    rag_context = RAGContext(session_id=session_id, patient_profile=profile)

    try:
        from backend.services.similarity import get_similar_cohorts
        from backend.services.trial_matcher import match_trials
        from backend.services.knowledge_retriever import get_knowledge_snippets
        from backend.services.prognosis import compute_prognosis

        rag_context.top_cohorts = await get_similar_cohorts(profile)
        rag_context.top_trials = await match_trials(profile)
        rag_context.knowledge_snippets = await get_knowledge_snippets(profile)
        rag_context.prognosis_stats = await compute_prognosis(rag_context.top_cohorts)
        rag_context.retrieval_ids = (
            [c.cohort_id for c in rag_context.top_cohorts] +
            [t.nct_id for t in rag_context.top_trials]
        )
    except Exception as e:
        print(f"Retrieval failed: {e} — continuing with empty context")

    await log_step(session_id, "retrieval_complete",
                   retrieved_ids=rag_context.retrieval_ids)

    # ── STEP 3: Agent 2 — synthesize insights ───────────────
    agent2_output = Agent2Output()
    try:
        from backend.agents.synthesizer import synthesize
        agent2_output = await synthesize(rag_context, session_id)
    except Exception as e:
        print(f"Agent 2 failed: {e}")

    await log_step(session_id, "synthesis_complete", model_name=settings.groq_model)

    # ── STEP 4: Output Generator — 7 documents ──────────────
    documents = {}
    try:
        from backend.services.document_generator import generate_all_documents
        documents = await generate_all_documents(rag_context, agent2_output)
    except Exception as e:
        print(f"Doc generation failed: {e}")

    await log_step(session_id, "documents_complete")

    # ── STEP 5: Assemble SessionPayload ─────────────────────
    payload = SessionPayload(
        session_id=session_id,
        status="pending",
        patient_profile=profile,
        similar_cohorts=rag_context.top_cohorts,
        trial_matches=rag_context.top_trials,
        risk_flags=rag_context.risk_flags,
        prognosis_stats=rag_context.prognosis_stats,
        agent2_insights=agent2_output,
        documents=documents,
        retrieval_ids=rag_context.retrieval_ids,
    )

    # Save to SQLite
    await save_session(session_id, payload.model_dump_json())
    await log_step(session_id, "session_saved")

    return payload


async def _demo_payload(session_id: str) -> SessionPayload:
    """Returns a hardcoded SessionPayload for reliable demos."""
    from backend.models.schemas import (
        SimilarCohort, TrialMatch, RiskFlag
    )

    profile = PatientProfile()
    profile.genomic.egfr = "Exon 19 deletion"
    profile.genomic.pd_l1 = 10.0
    profile.clinical.age = 52
    profile.clinical.sex = "F"
    profile.clinical.smoking = "never"
    profile.clinical.ecog = 1
    profile.clinical.stage = "IIIB"
    profile.pathology.subtype = "LUAD"
    profile.source_snippets = {
        "egfr": "EGFR exon 19 deletion identified by NGS (Foundation Medicine report, p.3)"
    }

    cohorts = [
        SimilarCohort(
            cohort_id="SYN-001",
            overall_score=0.87,
            param_breakdown={
                "genomic": {"score": 0.95, "color": "green"},
                "pathology": {"score": 0.88, "color": "green"},
                "clinical": {"score": 0.80, "color": "green"},
                "imaging": {"score": 0.72, "color": "amber"},
            },
            treatment_given="Osimertinib 80mg PO daily",
            outcome_os_months=28,
            outcome_pfs_months=18,
            clinical_outcome="Partial response",
            toxicity_profile="Grade 2 acneiform rash"
        ),
        SimilarCohort(
            cohort_id="SYN-008",
            overall_score=0.82,
            param_breakdown={
                "genomic": {"score": 0.92, "color": "green"},
                "pathology": {"score": 0.80, "color": "green"},
                "clinical": {"score": 0.75, "color": "amber"},
                "imaging": {"score": 0.60, "color": "amber"},
            },
            treatment_given="Osimertinib 80mg PO daily",
            outcome_os_months=24,
            outcome_pfs_months=16,
            clinical_outcome="Partial response",
            toxicity_profile="Grade 1 paronychia"
        ),
    ]

    trials = [
        TrialMatch(
            nct_id="NCT04267848",
            title="FLAURA — Osimertinib in EGFR-mutated NSCLC",
            phase="Phase 3",
            matched_on=["EGFR Exon 19 deletion", "Stage IIIB"],
            conflicts=[],
            eligibility_excerpt="Inclusion: EGFR exon 19 del, stage IIIB/IV, no prior TKI."
        )
    ]

    risks = [
        RiskFlag(
            flag_type="toxicity_warning",
            message="SYN-001 experienced Grade 2 acneiform rash on Osimertinib — monitor skin.",
            severity="medium"
        )
    ]

    payload = SessionPayload(
        session_id=session_id,
        status="pending",
        patient_profile=profile,
        similar_cohorts=cohorts,
        trial_matches=trials,
        risk_flags=risks,
        prognosis_stats=PrognosisStats(
            median_os_months=26.0,
            median_pfs_months=17.0,
            os_range=(18.0, 34.0),
            cohort_count=2,
            note="Based on 2 similar institutional cases"
        ),
        agent2_insights=Agent2Output(
            cohort_comparison="Patient aligns most closely with SYN-001 (87% match) — EGFR Exon 19, never-smoker, ECOG 1, Stage IIIB.",
            toxicity_warnings=["Grade 2 acneiform rash reported in closest matching case."],
            clinical_question_suggestion="Candidate for adjuvant osimertinib post-resection discussion?"
        ),
        documents={
            "treatment_plan": "DRAFT — for oncologist review.\n\nRecommended regimen: Osimertinib 80mg PO once daily.\nBasis: EGFR Exon 19 deletion (NCCN Category 1).\nSource: NCCN-NSCLC-EGFR-001, SYN-001.",
            "mdt_brief": "DRAFT — for oncologist review.\n\nPatient: Female, 52, never-smoker, ECOG 1.\nMolecular: EGFR Exon 19 deletion (NGS confirmed).\nStage: IIIB. PD-L1: 10%.\nSimilar cases: SYN-001 (87%), SYN-008 (82%) — both achieved PR on Osimertinib.\nClinical question: Candidate for secondary resection?",
        },
        retrieval_ids=["SYN-001", "SYN-008", "NCT04267848", "NCCN-NSCLC-EGFR-001"],
    )

    await save_session(session_id, payload.model_dump_json())
    return payload