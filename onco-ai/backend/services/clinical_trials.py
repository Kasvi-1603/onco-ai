"""ClinicalTrials.gov v2 ingestion for NSCLC trial cache."""

from __future__ import annotations

import re
from typing import Any

import httpx

from config import settings
from db.database import replace_trials


QUERY = (
    "non-small cell lung cancer OR NSCLC OR lung adenocarcinoma "
    "EGFR OR ALK OR KRAS G12C OR ROS1 OR PD-L1"
)


async def refresh_trials_cache(limit: int = 50) -> int:
    """Fetch active NSCLC studies from ClinicalTrials.gov and replace local cache.

    The app keeps the packaged mock cache if this fetch fails, so demos still run
    offline. ClinicalTrials.gov v2 exposes full study records under /api/v2/studies.
    """
    trials = await fetch_clinicaltrials_nsclc(limit=limit)
    return replace_trials(trials)


async def fetch_clinicaltrials_nsclc(limit: int = 50) -> list[dict[str, Any]]:
    params = {
        "format": "json",
        "pageSize": str(min(limit, 100)),
        "query.term": QUERY,
        "filter.overallStatus": "RECRUITING,ACTIVE_NOT_RECRUITING,NOT_YET_RECRUITING",
    }
    url = f"{settings.clinicaltrials_api_base.rstrip('/')}/studies"
    async with httpx.AsyncClient(timeout=8.0) as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
    data = resp.json()
    studies = data.get("studies") or []
    normalized = [_normalize_study(study) for study in studies]
    return [t for t in normalized if t]


def _normalize_study(study: dict[str, Any]) -> dict[str, Any] | None:
    protocol = study.get("protocolSection") or {}
    identification = protocol.get("identificationModule") or {}
    status = protocol.get("statusModule") or {}
    design = protocol.get("designModule") or {}
    eligibility = protocol.get("eligibilityModule") or {}
    arms = protocol.get("armsInterventionsModule") or {}

    nct_id = identification.get("nctId")
    if not nct_id:
        return None

    title = (
        identification.get("briefTitle")
        or identification.get("officialTitle")
        or f"Clinical trial {nct_id}"
    )
    criteria = eligibility.get("eligibilityCriteria") or ""
    search_text = f"{title}\n{criteria}".lower()

    required = _required_biomarkers(search_text)
    excluded = _excluded_biomarkers(search_text)
    phases = design.get("phases") or []
    interventions = arms.get("interventions") or []

    return {
        "nct_id": nct_id,
        "title": title,
        "phase": _format_phase(phases),
        "status": _format_status(status.get("overallStatus")),
        "cancer_types": ["NSCLC"],
        "biomarkers_required": required,
        "biomarkers_excluded": excluded,
        "egfr_subtypes": _egfr_subtypes(search_text),
        "stage_eligible": _stage_eligible(search_text),
        "max_prior_tki_lines": _max_prior_tki_lines(search_text),
        "min_pd_l1_percent": _min_pd_l1(search_text),
        "max_pd_l1_percent": None,
        "min_ecog": 0 if "ecog" in search_text else None,
        "max_ecog": _max_ecog(search_text),
        "min_egfr_ml_min": _min_renal_function(search_text),
        "inclusion_summary": criteria[:1800],
        "exclusion_summary": "",
        "intervention": ", ".join(
            i.get("name", "") for i in interventions if i.get("name")
        )[:500]
        or None,
        "locations": [],
        "source": "clinicaltrials.gov",
    }


def _required_biomarkers(text: str) -> list[str]:
    out: list[str] = []
    if "egfr" in text and not _near_negative(text, "egfr"):
        out.append("EGFR")
    if "t790m" in text:
        out.append("T790M")
    if "alk" in text and not _near_negative(text, "alk"):
        out.append("ALK")
    if "kras g12c" in text or ("kras" in text and "g12c" in text):
        out.append("KRAS G12C")
    if "ros1" in text and not _near_negative(text, "ros1"):
        out.append("ROS1")
    return _dedupe(out)


def _excluded_biomarkers(text: str) -> list[str]:
    out: list[str] = []
    for marker in ("EGFR", "ALK", "ROS1"):
        if _near_negative(text, marker.lower()):
            out.append(marker)
    return _dedupe(out)


def _near_negative(text: str, marker: str) -> bool:
    return bool(
        re.search(rf"(no|without|negative for|absence of).{{0,80}}{re.escape(marker)}", text)
        or re.search(rf"{re.escape(marker)}.{{0,80}}(negative|wild[- ]type|excluded)", text)
    )


def _egfr_subtypes(text: str) -> list[str]:
    subtypes: list[str] = []
    if "exon 19" in text or "ex19" in text:
        subtypes.append("Exon 19 deletion")
    if "l858r" in text:
        subtypes.append("L858R")
    if "exon 20" in text or "ex20" in text:
        subtypes.append("Exon 20 insertion")
    if "t790m" in text:
        subtypes.append("T790M")
    return _dedupe(subtypes)


def _stage_eligible(text: str) -> list[str]:
    stages: list[str] = []
    for token in ("IB", "II", "IIIA", "IIIB", "IIIC", "IV"):
        if re.search(rf"\bstage\s+{token.lower()}\b", text):
            stages.append(token)
    if "metastatic" in text or "advanced" in text:
        stages.extend(["IIIB", "IV"])
    if "locally advanced" in text:
        stages.extend(["IIIA", "IIIB", "IIIC"])
    return _dedupe(stages)


def _max_prior_tki_lines(text: str) -> int | None:
    if "prior egfr" in text and "not allowed" in text:
        return 0
    if "treatment-naive" in text or "treatment naive" in text or "first-line" in text:
        return 0
    if "after egfr" in text or "prior egfr-tki" in text or "prior egfr tki" in text:
        return 1
    return None


def _min_pd_l1(text: str) -> int | None:
    match = re.search(r"pd-?l1.{0,40}(?:>=|≥|at least)\s*(\d{1,3})\s*%", text)
    if match:
        return int(match.group(1))
    return None


def _max_ecog(text: str) -> int | None:
    match = re.search(r"ecog.{0,20}(?:0\s*[-–]\s*(\d)|[≤<=]\s*(\d))", text)
    if match:
        return int(match.group(1) or match.group(2))
    return None


def _min_renal_function(text: str) -> int | None:
    match = re.search(r"(?:egfr|creatinine clearance|crcl).{0,60}(?:>=|≥|at least)\s*(\d{2,3})", text)
    if match:
        return int(match.group(1))
    return None


def _format_phase(phases: list[str]) -> str | None:
    if not phases:
        return None
    return ", ".join(p.replace("_", " ").title() for p in phases)


def _format_status(status: str | None) -> str | None:
    return status.replace("_", " ").title() if status else None


def _dedupe(items: list[str]) -> list[str]:
    return list(dict.fromkeys(items))
