"""In-memory session store for doctor workflow + patient portal."""

from __future__ import annotations

import json
import os
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

SESSIONS: Dict[str, Dict[str, Any]] = {}

DEFAULT_WEIGHTS = {"pathology": 25.0, "genomics": 25.0, "imaging": 25.0, "clinical": 25.0}

DOC_KEYS = [
    "treatment_plan",
    "mdt_brief",
    "trial_report",
    "referral_letter",
    "toxicity_check",
    "prognosis",
    "patient_summary_clinical",
]


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _patient_file_path(user_id: str) -> str:
    return os.path.join(os.path.dirname(__file__), f"patient_upload copy {user_id}.json")


def _outcome_label(outcome: Any) -> str:
    if isinstance(outcome, dict):
        return str(outcome.get("response", "Unknown"))
    return str(outcome)


def _outcome_os(outcome: Any) -> int:
    if isinstance(outcome, dict):
        return int(outcome.get("OS_months", 0))
    return 0


def _outcome_pfs(outcome: Any) -> int:
    if isinstance(outcome, dict):
        return int(outcome.get("PFS_months", 0))
    return 0


def _patient_display_name(patient: Dict[str, Any], session_id: str) -> str:
    pid = patient.get("patient_id")
    if pid:
        return str(pid)
    return f"Patient {session_id}"


def _build_documents(patient: Dict[str, Any], top_match: Optional[Dict[str, Any]]) -> Dict[str, str]:
    p = patient
    g = p.get("genomics", {})
    c = p.get("clinical", {})
    path = p.get("pathology", {})
    img = p.get("imaging", {})

    driver = g.get("driver_mutation", "—")
    stage = c.get("stage", "—")
    subtype = path.get("subtype", "lung cancer")
    treatment = top_match.get("treatment_history", "—") if top_match else "—"
    match_id = top_match.get("patient_id", "—") if top_match else "—"
    sim = top_match.get("similarity_score", 0) if top_match else 0
    outcome = _outcome_label(top_match.get("outcome")) if top_match else "—"
    os_mo = _outcome_os(top_match.get("outcome")) if top_match else 0
    pfs_mo = _outcome_pfs(top_match.get("outcome")) if top_match else 0
    guideline = top_match.get("guideline_citation", "NCCN NSCLC") if top_match else "NCCN NSCLC"

    mdt_brief = f"""# Clinical Case Synopsis · Tumor Board

**Patient:** {_patient_display_name(p, "—")} · **Histology:** {subtype}
**Molecular Profile:** {driver} · **Best Match:** {match_id} · {sim}% similarity

**Presentation:** {c.get('age', '—')}-year-old {str(c.get('sex', '—')).lower()} with {img.get('lobe', '—')} lesion ({path.get('tumor_size_mm', '—')}mm), {stage}.

**Molecular:** Driver {driver}; secondary {g.get('secondary_mutation', 'None')}; TMB {g.get('tmb', '—')} mut/Mb; PD-L1 {g.get('pdl1_percent', '—')}%.

**Cohort match:** {match_id} treated with {treatment}, outcome {outcome} (OS {os_mo} mo, PFS {pfs_mo} mo).

**Board question:** Validate first-line selection and trial candidacy."""

    treatment_plan = f"""# Treatment Plan Draft

**Diagnosis:** {stage} {subtype}
**Driver:** {driver}

## Recommended regimen
{treatment} per {guideline}.

## Rationale
Top TCGA match {match_id} ({sim}% similarity) achieved {outcome} with OS {os_mo} months.

## Monitoring
Restaging CT at 8 weeks; track ECOG {c.get('ecog_status', '—')}."""

    trial_report = f"""# Clinical Trial Screening

Based on {driver} and {stage}, consider:
- **LAURA Trial** (NCT03521154) — maintenance vector if eligible
- **MATCH-style** precision enrollment for {driver}

Match confidence derived from TCGA cohort {match_id}."""

    prognosis = f"""# Prognosis Estimate

Reference cohort: **{match_id}**
- Median OS: **{os_mo} months**
- Median PFS: **{pfs_mo} months**
- Historical response: **{outcome}**

*Population-level estimate from matched TCGA case — not individual prediction.*"""

    patient_summary = f"""# Patient Summary (Clinical)

{ c.get('age', '—') }-year-old with {subtype}, stage {stage}.
Key finding: **{driver}** on NGS.
Care team reviewed matched historical outcomes and drafted a plan with {treatment}."""

    return {
        "treatment_plan": treatment_plan,
        "mdt_brief": mdt_brief,
        "trial_report": trial_report,
        "referral_letter": f"Referral for oncology MDT review — {driver}-driven {stage} LUAD.",
        "toxicity_check": "Review class-specific toxicities for selected regimen; counsel on rash, GI, and pulmonary symptoms.",
        "prognosis": prognosis,
        "patient_summary_clinical": patient_summary,
    }


def _adapt_patient_profile(patient: Dict[str, Any]) -> Dict[str, Any]:
    """Shape for DocumentEditor compatibility."""
    g = patient.get("genomics", {})
    return {
        "pathology": {
            "subtype": patient.get("pathology", {}).get("subtype", ""),
            "grade": patient.get("pathology", {}).get("tumor_grade"),
            "mitotic_index": patient.get("pathology", {}).get("mitotic_index"),
            "margins": patient.get("pathology", {}).get("surgical_margin"),
            "size_mm": patient.get("pathology", {}).get("tumor_size_mm"),
        },
        "genomic": {
            "egfr": g.get("driver_mutation") if "EGFR" in str(g.get("driver_mutation", "")).upper() else None,
            "kras": g.get("driver_mutation") if "KRAS" in str(g.get("driver_mutation", "")).upper() else None,
            "tp53": g.get("secondary_mutation"),
            "tmb": g.get("tmb"),
            "pd_l1": g.get("pdl1_percent"),
        },
        "imaging": patient.get("imaging", {}),
        "clinical": {
            "age": patient.get("clinical", {}).get("age"),
            "sex": patient.get("clinical", {}).get("sex"),
            "smoking": patient.get("clinical", {}).get("smoking_history"),
            "ecog": patient.get("clinical", {}).get("ecog_status"),
            "stage": patient.get("clinical", {}).get("stage"),
            "comorbidities": patient.get("clinical", {}).get("co_morbidities", []),
        },
        "missing_fields": [],
        "source_snippets": {},
        "extraction_confidence": "high",
    }


def create_session_from_patient(
    session_id: str,
    patient: Dict[str, Any],
    match_results: List[Dict[str, Any]],
) -> Dict[str, Any]:
    top = match_results[0] if match_results else None
    documents = _build_documents(patient, top)
    session = {
        "session_id": session_id,
        "status": "ready",
        "patient": patient,
        "patient_name": _patient_display_name(patient, session_id),
        "match_results": match_results,
        "selected_case_index": 0,
        "weights": dict(DEFAULT_WEIGHTS),
        "documents": documents,
        "approved_at": None,
        "approved_documents": None,
        "created_at": _now_iso(),
    }
    SESSIONS[session_id] = session
    return session


def get_session(session_id: str) -> Optional[Dict[str, Any]]:
    return SESSIONS.get(session_id)


def load_demo_user(user_id: str, run_match_fn) -> Dict[str, Any]:
    path = _patient_file_path(user_id)
    if not os.path.exists(path):
        raise FileNotFoundError(f"No patient file for user {user_id}")
    with open(path, "r", encoding="utf-8") as f:
        patient = json.load(f)
    match_results = run_match_fn(patient, DEFAULT_WEIGHTS)
    return create_session_from_patient(user_id, patient, match_results)


def seed_demo_sessions(run_match_fn) -> None:
    for uid in ("2", "3", "4", "5"):
        try:
            load_demo_user(uid, run_match_fn)
        except FileNotFoundError:
            pass


def session_to_doctor_payload(session: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "session_id": session["session_id"],
        "status": session["status"],
        "patient": session["patient"],
        "patient_name": session["patient_name"],
        "match_results": session["match_results"],
        "selected_case_index": session["selected_case_index"],
        "weights": session["weights"],
        "approved_at": session.get("approved_at"),
    }


def session_to_dashboard_payload(session: Dict[str, Any]) -> Dict[str, Any]:
    patient = session["patient"]
    top = session["match_results"][0] if session.get("match_results") else None
    os_mo = _outcome_os(top.get("outcome")) if top else 12
    return {
        "session_id": session["session_id"],
        "status": session["status"],
        "patient_profile": _adapt_patient_profile(patient),
        "similar_cohorts": [],
        "trial_matches": [],
        "risk_flags": [],
        "prognosis_stats": {
            "cohort_count": len(session.get("match_results", [])),
            "median_os_months": os_mo,
            "os_range": [max(0, os_mo - 6), os_mo + 6],
            "disclaimer": "TCGA matched-case estimate",
        },
        "agent2_insights": {
            "trial_justifications": [],
            "cohort_comparison": "",
            "toxicity_warnings": [],
            "clinical_question_suggestion": "",
        },
        "documents": session["documents"],
        "retrieval_ids": [],
        "approved_at": session.get("approved_at"),
        "approved_documents": session.get("approved_documents"),
    }


def update_documents(session_id: str, patch: Dict[str, str]) -> Optional[Dict[str, Any]]:
    session = SESSIONS.get(session_id)
    if not session:
        return None
    for key, val in patch.items():
        if key in DOC_KEYS and val is not None:
            session["documents"][key] = val
    return session


def approve_session(
    session_id: str,
    approved_documents: Optional[Dict[str, str]] = None,
) -> Optional[Dict[str, Any]]:
    session = SESSIONS.get(session_id)
    if not session:
        return None
    session["status"] = "shared"
    session["approved_at"] = _now_iso()
    session["approved_documents"] = approved_documents or deepcopy(session["documents"])
    return session


def localize_patient_view(session: Dict[str, Any], lang: str = "en") -> Dict[str, Any]:
    docs = session.get("approved_documents") or session.get("documents", {})
    p = session["patient"]
    g = p.get("genomics", {})
    c = p.get("clinical", {})
    path = p.get("pathology", {})
    driver = g.get("driver_mutation", "a gene change")
    stage = c.get("stage", "advanced")
    subtype = path.get("subtype", "lung cancer")

    headlines = {
        "en": "Your care team has reviewed your results",
        "hi": "आपकी देखभाल टीम ने आपके परिणामों की समीक्षा की है",
        "ta": "உங்கள் care team உங்கள் முடிவுகளை மதிப்பாய்வு செய்துள்ளது",
        "kn": "ನಿಮ್ಮ ಆರೈಕೆ ತಂಡವು ನಿಮ್ಮ ಫಲಿತಾಂಶಗಳನ್ನು ಪರಿಶೀಲಿಸಿದೆ",
    }

    if lang == "hi":
        found = f"आपको {subtype} है, stage {stage}. परीक्षण में {driver} में परिवर्तन मिला।"
        means = "आपकी देखभाल टीम ने उपचार योजना की समीक्षा की है।"
        side = "दुष्प्रभावों के बारे में अपनी देखभाल टीम से बात करें।"
        questions = ["मेरा इलाज कब शुरू होगा?", "मुझे किन दुष्प्रभावों की उम्मीद करनी चाहिए?"]
    elif lang == "ta":
        found = f"உங்களுக்கு {subtype}, stage {stage}. {driver} மாற்றம் கண்டறியப்பட்டது."
        means = "சிகிச்சை திட்டத்தை உங்கள் மருத்துவருடன் விவாதிக்கவும்."
        side = "பக்க விளைவுகள் குறித்து care team விளக்கும்."
        questions = ["என் சிகிச்சை எப்போது தொடங்கும்?", "என்ன பக்க விளைவுகள் எதிர்பார்க்கலாம்?"]
    elif lang == "kn":
        found = f"ನಿಮಗೆ {subtype}, stage {stage}. {driver} ಬದಲಾವಣೆ ಕಂಡುಬಂದಿದೆ."
        means = "ಚಿಕಿತ್ಸಾ ಯೋಜನೆಯನ್ನು ನಿಮ್ಮ ವೈದ್ಯರೊಂದಿಗೆ ಚರ್ಚಿಸಿ."
        side = "ಪಾರ್ಶ್ವ ಪರಿಣಾಮಗಳ ಬಗ್ಗೆ care team ವಿವರಿಸುತ್ತಾರೆ."
        questions = ["ಚಿಕಿತ್ಸೆ ಯಾವಾಗ ಪ್ರಾರಂಭ?", "ಯಾವ ಪಾರ್ಶ್ವ ಪರಿಣಾಮಗಳನ್ನು ನಿರೀಕ್ಷಿಸಬಹುದು?"]
    else:
        found = (
            f"You have {subtype} at {stage}. "
            f"Tests found a change involving **{driver}** — this helps guide treatment options."
        )
        means = docs.get("patient_summary_clinical", "")[:400] or (
            "Your care team reviewed a treatment plan based on your test results. "
            "The details below come from your doctor's approved summary."
        )
        side = (
            "Your care team will explain possible side effects before treatment starts. "
            "Report new symptoms promptly."
        )
        questions = [
            "When will my treatment start?",
            "What side effects should I watch for?",
            "Are there clinical trials I should discuss?",
        ]

    trials = docs.get("trial_report", "")[:300] if docs.get("trial_report") else None

    return {
        "session_id": session["session_id"],
        "lang": lang,
        "status": "shared",
        "headline": headlines.get(lang, headlines["en"]),
        "sections": {
            "what_we_found": found,
            "what_this_means": means,
            "side_effects": side,
            "trials": trials,
            "questions_for_doctor": questions,
        },
        "footer_disclaimer": (
            "This information was prepared by your care team. "
            "It is not a diagnosis or prescription from an AI."
        ),
    }
