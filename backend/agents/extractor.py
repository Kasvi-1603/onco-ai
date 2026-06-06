"""Agent 1 — Clinical Extractor."""

from __future__ import annotations

import json

from models.schemas import PatientProfile
from services.llm import complete, parse_json_response

EXTRACT_SYSTEM = """You are a clinical data extractor for oncology reports.
Extract ONLY facts explicitly stated in the text. Do not invent values.
Return valid JSON matching this structure:
{
  "pathology": {"subtype", "histological_type", "grade", "mitotic_index", "surgical_margin", "tumor_size_mm", "lvi", "pni"},
  "genomic": {"egfr", "kras", "alk", "ros1", "tp53", "stk11", "keap1", "tmb", "pd_l1_percent", "cnv", "assay"},
  "imaging": {"tumor_lobe", "n_stage", "m_stage", "pleural_invasion", "metastasis_sites", "max_tumor_size_mm"},
  "clinical": {"age", "sex", "smoking", "ecog", "stage", "tnm", "prior_therapies", "comorbidities", "labs", "weight_kg", "allergies"},
  "missing_fields": [],
  "source_snippets": {"field_name": "exact quote from report"}
}
Use null for missing fields. List missing_fields for important absent data."""


async def extract_patient_profile(raw_text: str) -> tuple[PatientProfile, str]:
    user = f"Extract PatientProfile from the following clinical documents:\n\n{raw_text[:12000]}"
    text, model = await complete(EXTRACT_SYSTEM, user, json_mode=True)

    if text:
        try:
            data = parse_json_response(text)
            return PatientProfile.model_validate(data), model
        except (json.JSONDecodeError, ValueError):
            pass

    return _fallback_extract(raw_text), "fallback"


def _fallback_extract(raw_text: str) -> PatientProfile:
    """Rule-based extraction when LLM unavailable — works for demo OCR text."""
    from db.database import load_json_file

    demo = load_json_file("demo_patient.json")
    if demo.get("raw_ocr_text") and demo["raw_ocr_text"][:200] in raw_text[:500]:
        return PatientProfile.model_validate(demo["patient_profile"])

    lower = raw_text.lower()
    profile = PatientProfile(source_snippets={})

    if "adenocarcinoma" in lower:
        profile.pathology.histological_type = "Adenocarcinoma"
        profile.pathology.subtype = "LUAD"
    if "exon 19" in lower:
        profile.genomic.egfr = "Exon 19 deletion"
    if "pd-l1" in lower or "pd l1" in lower:
        for token in raw_text.replace("%", " %").split():
            try:
                if "%" in token:
                    profile.genomic.pd_l1_percent = float(token.replace("%", ""))
                    break
            except ValueError:
                pass
    if "ecog 1" in lower:
        profile.clinical.ecog = 1
    elif "ecog 0" in lower:
        profile.clinical.ecog = 0
    if "never smoker" in lower:
        profile.clinical.smoking = "never"
    if "stage iiia" in lower:
        profile.clinical.stage = "IIIA"
    elif "stage iiib" in lower:
        profile.clinical.stage = "IIIB"
    if "right upper lobe" in lower or " rul" in lower:
        profile.imaging.tumor_lobe = "Right upper lobe"
    if " n2" in lower or "n2" in lower:
        profile.imaging.n_stage = "N2"

    return profile
