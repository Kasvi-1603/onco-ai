"""Pipeline orchestrator — simulated data only (no OCR)."""

from __future__ import annotations

import hashlib

from agents.extractor import extract_patient_profile
from agents.synthesizer import synthesize
from db.database import (
    insert_audit,
    load_json_file,
    save_session,
    update_pipeline_status,
)
from models.schemas import PatientProfile, RAGContext, SessionPayload
from services.document_generator import generate_documents
from services.knowledge_retriever import retrieve_knowledge
from services.prognosis import compute_prognosis
from services.similarity import rank_similar_cohorts
from services.trial_matcher import compute_risk_flags, match_trials


def _step(session_id: str, step: str, completed: list[str]) -> None:
    update_pipeline_status(
        session_id,
        pipeline_status="processing",
        current_step=step,
        steps_completed=completed,
    )


async def run_pipeline(session_id: str, raw_text: str) -> SessionPayload:
    completed: list[str] = ["ocr"]
    _step(session_id, "extract", completed)

    text_hash = hashlib.sha256(raw_text.encode()).hexdigest()[:16]
    profile, extract_model = await extract_patient_profile(raw_text)
    profile.extraction_confidence = "high"
    completed.append("extract")
    insert_audit(
        session_id,
        "extract",
        model=extract_model,
        input_hash=text_hash,
        details={"missing_fields": profile.missing_fields},
    )

    return await _build_payload(session_id, profile, completed)


async def run_pipeline_from_profile(session_id: str, profile: PatientProfile) -> SessionPayload:
    completed = ["ocr", "extract"]
    _step(session_id, "similarity", completed)
    return await _build_payload(session_id, profile, completed)


async def run_demo_pipeline(session_id: str) -> SessionPayload:
    demo = load_json_file("demo_patient.json")
    profile = PatientProfile.model_validate(demo["patient_profile"])
    profile.extraction_confidence = "high"
    raw_text = demo.get("raw_ocr_text", "")

    update_pipeline_status(
        session_id,
        pipeline_status="processing",
        current_step="extract",
        steps_completed=["ocr"],
    )
    insert_audit(session_id, "extract", model="simulated", input_hash="demo")

    payload = await _build_payload(session_id, profile, ["ocr", "extract"])
    save_session(session_id, payload, raw_text=raw_text, pipeline_status="ready")
    return payload


async def _build_payload(
    session_id: str,
    profile: PatientProfile,
    completed: list[str],
) -> SessionPayload:
    _step(session_id, "similarity", completed)
    cohorts = rank_similar_cohorts(profile, top_k=10)
    completed = completed + ["similarity"]
    insert_audit(session_id, "similarity", retrieved_ids=[c.cohort_id for c in cohorts[:5]])

    _step(session_id, "trial_match", completed)
    trials = match_trials(profile)
    completed = completed + ["trial_match"]
    insert_audit(session_id, "trial_match", retrieved_ids=[t.nct_id for t in trials[:5]])

    _step(session_id, "knowledge_retrieve", completed)
    knowledge = retrieve_knowledge(profile, limit=5)
    completed = completed + ["knowledge_retrieve"]
    insert_audit(session_id, "knowledge_retrieve", retrieved_ids=[k.snippet_id for k in knowledge])

    prognosis = compute_prognosis(cohorts, top_k=8)
    risk_flags = compute_risk_flags(profile)
    retrieval_ids = (
        [c.cohort_id for c in cohorts[:5]]
        + [t.nct_id for t in trials[:5]]
        + [k.snippet_id for k in knowledge]
    )

    ctx = RAGContext(
        session_id=session_id,
        patient_profile=profile,
        top_cohorts=cohorts,
        top_trials=trials,
        knowledge_snippets=knowledge,
        risk_flags=risk_flags,
        prognosis_stats=prognosis,
        retrieval_ids=retrieval_ids,
    )

    _step(session_id, "agent2", completed)
    agent2, synth_model = await synthesize(ctx)
    completed = completed + ["agent2"]
    insert_audit(session_id, "agent2", model=synth_model, retrieved_ids=retrieval_ids)

    _step(session_id, "documents", completed)
    documents, doc_model = await generate_documents(ctx, agent2)
    completed = completed + ["documents"]
    insert_audit(session_id, "doc_treatment", model=doc_model)
    insert_audit(session_id, "doc_mdt", model=doc_model)

    payload = SessionPayload(
        session_id=session_id,
        status="pending",
        patient_profile=profile,
        similar_cohorts=cohorts,
        trial_matches=trials,
        knowledge_snippets=knowledge,
        risk_flags=risk_flags,
        prognosis_stats=prognosis,
        agent2_insights=agent2,
        documents=documents,
        retrieval_ids=retrieval_ids,
    )

    update_pipeline_status(
        session_id,
        pipeline_status="ready",
        current_step="ready",
        steps_completed=completed + ["ready"],
    )
    save_session(session_id, payload, pipeline_status="ready")
    return payload
