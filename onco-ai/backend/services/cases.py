"""Preset demo cases + parsing uploaded .txt/.json case packs."""

from __future__ import annotations

import json
from typing import Any

from db.database import load_json_file
from models.schemas import CaseSummary, PatientProfile

# case_id -> JSON file under db/mock_data/
CASE_REGISTRY: dict[str, str] = {
    "egfr-exon19": "demo_patient.json",
    "kras-g12c": "cases/case_kras_g12c.json",
}


def list_cases() -> list[CaseSummary]:
    out: list[CaseSummary] = []
    for case_id, path in CASE_REGISTRY.items():
        pack = load_json_file(path)
        out.append(
            CaseSummary(
                case_id=case_id,
                label=pack.get("label") or case_id,
                description=pack.get("description"),
                target_cohort=pack.get("target_cohort_match"),
            )
        )
    return out


def load_case_pack(case_id: str) -> dict[str, Any]:
    path = CASE_REGISTRY.get(case_id)
    if not path:
        raise KeyError(case_id)
    pack = load_json_file(path)
    pack.setdefault("case_id", case_id)
    return pack


def parse_upload_content(content: str) -> tuple[PatientProfile | None, str]:
    """
    Parse .txt / .md / .json upload body.
    Returns (optional pre-built profile, raw text for Agent 1 or display).
    """
    text = content.strip()
    if not text:
        return None, ""

    if text.startswith("{"):
        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            return None, content

        profile: PatientProfile | None = None
        profile_data = _find_profile_payload(data)
        if profile_data:
            profile = PatientProfile.model_validate(profile_data)
        raw = data.get("raw_ocr_text") or data.get("raw_text") or ""
        if not raw and not profile:
            raw = content
        return profile, raw or content

    return None, content


def _find_profile_payload(data: dict[str, Any]) -> dict[str, Any] | None:
    """Accept common JSON upload shapes, not only the demo case-pack wrapper."""
    if isinstance(data.get("patient_profile"), dict):
        return data["patient_profile"]
    if isinstance(data.get("profile"), dict):
        return data["profile"]
    if all(isinstance(data.get(k), dict) for k in ("pathology", "genomic", "imaging", "clinical")):
        return data
    return None


def profile_is_ready(profile: PatientProfile) -> bool:
    """True when ingest can skip Agent 1 and run similarity directly."""
    if not profile.clinical.stage:
        return False
    g = profile.genomic
    return any(_is_actionable_mutation(v) for v in (g.egfr, g.kras, g.alk, g.ros1))


def _is_actionable_mutation(value: str | None) -> bool:
    if not value:
        return False
    lower = value.lower().strip()
    if lower in ("wild-type", "wild type", "negative", "none", "wt", "normal"):
        return False
    return True
