"""Verbose terminal demo - Safe Demo Track + Live Ingest Track against running backend."""
from __future__ import annotations

import asyncio
import json
import sys
import uuid
from pathlib import Path

import httpx

# Allow importing backend modules when run as script
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

BASE = "http://127.0.0.1:8000"


def section(title: str) -> None:
    print("\n" + "=" * 60)
    print(title)
    print("=" * 60)


def pp(obj: object) -> None:
    print(json.dumps(obj, indent=2, default=str))


async def poll_status(c: httpx.AsyncClient, sid: str) -> dict:
    r = await c.get(f"{BASE}/api/analyze/{sid}/status")
    return r.json()


async def run_safe_demo_track(c: httpx.AsyncClient) -> str | None:
    section("TRACK 1 - Safe Demo Track (preset TCGA-LUAD / EGFR Exon 19)")
    print("API: POST /api/demo -> uses demo_patient.json (SYN-001 ~87% match)")
    r = await c.post(f"{BASE}/api/demo")
    print(f"POST /api/demo -> {r.status_code}")
    if r.status_code not in (200, 201):
        print(r.text)
        return None

    demo = r.json()
    sid = demo["session_id"]
    print(f"session_id: {sid}")
    print(f"demo={demo.get('demo')} status={demo.get('status')}")
    preview = demo.get("ocr_preview") or ""
    print(f"\nOCR preview ({len(preview)} chars shown):")
    print(preview[:500])

    section("Run RAG pipeline - POST /api/analyze/{session_id}")
    r = await c.post(f"{BASE}/api/analyze/{sid}")
    print(f"POST /api/analyze/{sid} -> {r.status_code}")
    if r.status_code != 200:
        print(r.text)
        return None

    payload = r.json()
    await print_pipeline_output(payload, sid, c)
    return sid


async def run_live_ingest_track(c: httpx.AsyncClient) -> str | None:
    section("TRACK 2 - Live Ingest Track (paste clinical text)")
    print("Simulates the paste box: create session with raw text, then analyze.")

    # Load demo OCR text - same as preset but via extract path (non-demo session id)
    from db.database import create_upload_session, init_db, seed_if_empty

    init_db()
    seed_if_empty()
    from db.database import load_json_file

    demo = load_json_file("demo_patient.json")
    raw_text = demo["raw_ocr_text"]
    sid = f"live-{uuid.uuid4().hex[:8]}"
    create_upload_session(sid, raw_text, file_count=0)
    print(f"Created live session: {sid}")
    print(f"Pasted text length: {len(raw_text)} chars")
    print(f"First 300 chars:\n{raw_text[:300]}...\n")

    section("Run RAG pipeline with Agent 1 extraction - POST /api/analyze/{session_id}")
    r = await c.post(f"{BASE}/api/analyze/{sid}")
    print(f"POST /api/analyze/{sid} -> {r.status_code}")
    if r.status_code != 200:
        print(r.text)
        return None

    payload = r.json()
    await print_pipeline_output(payload, sid, c)
    return sid


async def print_pipeline_output(payload: dict, sid: str, c: httpx.AsyncClient) -> None:
    section("Agent 1 - Extracted PatientProfile")
    prof = payload.get("patient_profile") or {}
    path = prof.get("pathology") or {}
    gen = prof.get("genomic") or {}
    clin = prof.get("clinical") or {}
    print(f"  Subtype: {path.get('subtype')}")
    print(f"  EGFR: {gen.get('egfr')}")
    print(f"  PD-L1: {gen.get('pd_l1_percent')}%")
    print(f"  Stage: {clin.get('stage')} ({clin.get('tnm')})")
    print(f"  Demographics: {clin.get('age')}yo {clin.get('sex')}, ECOG {clin.get('ecog')}, {clin.get('smoking')}")
    print(f"  Extraction confidence: {prof.get('extraction_confidence')}")
    print(f"  Missing fields: {prof.get('missing_fields')}")

    section("Retrieval Layer (Python - similarity, trials, knowledge)")
    cohorts = payload.get("similar_cohorts") or []
    print(f"Top similar cohorts ({len(cohorts)} total):")
    for row in cohorts[:5]:
        score = row.get("overall_score", 0) * 100
        print(
            f"  {row['cohort_id']}: {score:.0f}% | "
            f"{row.get('treatment_given')} | OS {row.get('outcome_os_months')}mo | "
            f"{row.get('clinical_outcome')}"
        )

    trials = payload.get("trial_matches") or []
    print(f"\nTrial matches ({len(trials)} total):")
    for t in trials[:5]:
        matched = ", ".join((t.get("matched_on") or [])[:4])
        print(f"  {t['nct_id']}: {t.get('eligibility')} | matched: {matched}")

    knowledge = payload.get("knowledge_snippets") or []
    print(f"\nKnowledge snippets ({len(knowledge)}):")
    for k in knowledge[:4]:
        content = (k.get("content") or "")[:140]
        print(f"  [{k.get('snippet_id')}] {content}...")

    prog = payload.get("prognosis_stats")
    if prog:
        print(f"\nPrognosis: {prog.get('summary')}")

    flags = payload.get("risk_flags") or []
    if flags:
        print(f"Risk flags: {flags}")

    print(f"\nRetrieval IDs ({len(payload.get('retrieval_ids') or [])}): {payload.get('retrieval_ids')}")

    section("Agent 2 - RAG Synthesizer (summary for View 1)")
    a2 = payload.get("agent2_insights") or {}
    print("Cohort comparison:")
    print(f"  {a2.get('cohort_comparison')}")
    print("\nClinical question for tumor board:")
    print(f"  {a2.get('clinical_question_suggestion')}")
    print("\nToxicity warnings:")
    for w in a2.get("toxicity_warnings") or []:
        print(f"  - {w}")
    print("\nTrial justifications:")
    for j in a2.get("trial_justifications") or []:
        rat = (j.get("rationale") or "")[:120]
        print(f"  {j.get('nct_id')}: {rat}")

    section("Generated Documents (what oncologist sees in View 1)")
    docs = payload.get("documents") or {}
    for key in [
        "treatment_plan",
        "mdt_brief",
        "trial_report",
        "prognosis",
        "patient_summary_clinical",
        "referral_letter",
        "toxicity_check",
    ]:
        text = docs.get(key) or ""
        print(f"\n--- {key.upper()} ({len(text)} chars) ---")
        print(text[:700] + ("..." if len(text) > 700 else ""))

    section("Audit trail")
    r = await c.get(f"{BASE}/api/audit/{sid}")
    audit = r.json()
    for e in audit.get("entries") or []:
        ids = e.get("retrieved_ids") or []
        id_preview = ids[:4]
        extra = f" +{len(ids)-4} more" if len(ids) > 4 else ""
        print(f"  step={e.get('step')} model={e.get('model')} ids={id_preview}{extra}")


async def main() -> int:
    track = sys.argv[1] if len(sys.argv) > 1 else "both"

    async with httpx.AsyncClient(timeout=180.0) as c:
        section("STEP 0 - Health check")
        r = await c.get(f"{BASE}/health")
        print(f"GET /health -> {r.status_code}")
        pp(r.json())

        if track in ("demo", "both"):
            sid = await run_safe_demo_track(c)
            if not sid:
                return 1

        if track in ("live", "both"):
            sid = await run_live_ingest_track(c)
            if not sid:
                return 1

    section("RESULT - Pipeline completed successfully")
    print("Backend is working with simulated data.")
    print("View 1 frontend should GET /api/dashboard/{session_id} after analyze.")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
