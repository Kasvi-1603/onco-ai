"""Show exactly what ran: demo skip vs same text vs new patient text."""
from __future__ import annotations

import asyncio
import sys
import uuid
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from agents.extractor import extract_patient_profile
from db.database import create_upload_session, init_db, load_json_file, seed_if_empty
from models.schemas import PatientProfile
from services.similarity import rank_similar_cohorts

BASE = "http://127.0.0.1:8000"

KRAS_TEXT = """PATHOLOGY REPORT
68-year-old male, former smoker, ECOG 1.
DIAGNOSIS: Poorly differentiated adenocarcinoma, solid pattern.
MOLECULAR: KRAS G12C mutation detected. EGFR wild-type. PD-L1 TPS 45%.
STAGE: IIIA (T2bN1M0). Right lower lobe mass 55mm. Pleural invasion present.
PRIOR: Carboplatin/Pemetrexed x4 cycles.
PLAN: Consider sotorasib per KRAS G12C pathway.
"""


def show_profile(label: str, p: PatientProfile, model: str | None = None) -> None:
    print(f"\n--- {label} ---")
    if model:
        print(f"  extract_model: {model}")
    print(f"  EGFR: {p.genomic.egfr} | KRAS: {p.genomic.kras} | PD-L1: {p.genomic.pd_l1_percent}")
    print(f"  Stage: {p.clinical.stage} | Age/Sex: {p.clinical.age}/{p.clinical.sex} | Smoking: {p.clinical.smoking}")
    print(f"  Missing fields: {p.missing_fields}")


def show_similarity(label: str, profile: PatientProfile) -> None:
    cohorts = rank_similar_cohorts(profile, top_k=5)
    print(f"\n--- Similarity after {label} ---")
    for c in cohorts[:5]:
        mut = getattr(c, "primary_mutation", None) or "?"
        tx = (c.treatment_given or "")[:45]
        print(f"  {c.cohort_id}: {c.overall_score * 100:.0f}% | {mut} | {tx}")


async def main() -> None:
    init_db()
    seed_if_empty()
    demo = load_json_file("demo_patient.json")
    raw_demo = demo["raw_ocr_text"]

    print("=" * 60)
    print("CASE A: Safe Demo (session_id demo-patient-001)")
    print("=" * 60)
    print("Code: analyze.py -> run_demo_pipeline() — Agent 1 SKIPPED")
    print("Profile: loaded directly from demo_patient.json (no parsing)")
    profile_a = PatientProfile.model_validate(demo["patient_profile"])
    show_profile("Injected profile", profile_a, model="simulated (not Agent 1)")
    show_similarity("Case A", profile_a)

    print("\n" + "=" * 60)
    print("CASE B: New session + SAME text as demo (live-f047cd4c style)")
    print("=" * 60)
    print("Code: run_pipeline() -> extract_patient_profile(raw_text)")
    p_b, model_b = await extract_patient_profile(raw_demo)
    show_profile("Agent 1 output", p_b, model_b)
    if demo["raw_ocr_text"][:200] in raw_demo[:500]:
        print("  -> fallback shortcut: first 200 chars match demo JSON -> same profile as Case A")
    show_similarity("Case B", p_b)

    print("\n" + "=" * 60)
    print("CASE C: New session + DIFFERENT text (KRAS G12C patient)")
    print("=" * 60)
    print("This is genuinely new user data — not demo_patient.json")
    p_c, model_c = await extract_patient_profile(KRAS_TEXT)
    show_profile("Agent 1 output", p_c, model_c)
    show_similarity("Case C", p_c)

    sid = f"live-kras-{uuid.uuid4().hex[:6]}"
    create_upload_session(sid, KRAS_TEXT, file_count=0)
    async with httpx.AsyncClient(timeout=120.0) as c:
        r = await c.post(f"{BASE}/api/analyze/{sid}")
        print(f"\n--- Full API run POST /api/analyze/{sid} -> {r.status_code} ---")
        if r.status_code == 200:
            payload = r.json()
            print("Top cohorts from API:")
            for row in payload["similar_cohorts"][:5]:
                print(f"  {row['cohort_id']}: {row['overall_score'] * 100:.0f}%")
            kids = [k["snippet_id"] for k in payload["knowledge_snippets"][:3]]
            print(f"Knowledge retrieved: {kids}")
            comp = payload["agent2_insights"]["cohort_comparison"]
            print(f"Agent2 summary: {comp[:150]}...")


if __name__ == "__main__":
    asyncio.run(main())
