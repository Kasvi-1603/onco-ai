"""Weighted JSON field similarity engine."""

from __future__ import annotations

import re
from typing import Any

from db.database import get_all_cohorts
from models.schemas import MatchColor, ParamScore, PatientProfile, SimilarCohort

WEIGHTS = {
    "genomic": 0.35,
    "pathology": 0.25,
    "clinical": 0.25,
    "imaging": 0.15,
}

GENOMIC_FIELDS = [
    ("egfr", "egfr"),
    ("kras", "kras"),
    ("alk", "alk"),
    ("ros1", "ros1"),
    ("tp53", "tp53"),
    ("stk11", "stk11"),
    ("keap1", "keap1"),
    ("tmb", "tmb"),
    ("pd_l1_percent", "pd_l1_percent"),
]

PATHOLOGY_FIELDS = [
    ("subtype", "cancer_subtype"),
    ("grade", "grade"),
    ("mitotic_index", "mitotic_index"),
    ("tumor_size_mm", "tumor_size_mm"),
]

IMAGING_FIELDS = [
    ("tumor_lobe", "tumor_lobe"),
    ("n_stage", "n_stage"),
    ("pleural_invasion", "pleural_invasion"),
]

CLINICAL_FIELDS = [
    ("age", "age"),
    ("sex", "sex"),
    ("smoking", "smoking"),
    ("ecog", "ecog"),
    ("stage", "stage"),
]


def _color(score: float) -> MatchColor:
    if score >= 0.85:
        return "green"
    if score >= 0.50:
        return "amber"
    return "red"


def _norm_str(val: Any) -> str:
    if val is None:
        return ""
    s = str(val).lower().strip()
    s = re.sub(r"\s+", " ", s)
    return s


def _categorical_score(a: Any, b: Any) -> float:
    na, nb = _norm_str(a), _norm_str(b)
    if not na or not nb:
        return 0.5
    if na == nb:
        return 1.0
    # EGFR partial match
    if "exon 19" in na and "exon 19" in nb:
        return 0.95
    if "l858r" in na and "l858r" in nb:
        return 0.95
    if na in nb or nb in na:
        return 0.75
    # wild-type synonyms
    wt = {"wild-type", "wt", "negative", "no mutation detected"}
    if na in wt and nb in wt:
        return 1.0
    return 0.0


def _numeric_score(a: Any, b: Any, max_delta: float) -> float:
    try:
        fa, fb = float(a), float(b)
    except (TypeError, ValueError):
        return _categorical_score(a, b)
    if max_delta <= 0:
        return 1.0 if fa == fb else 0.0
    delta = abs(fa - fb)
    return max(0.0, 1.0 - delta / max_delta)


def _bool_score(a: Any, b: Any) -> float:
    if a is None or b is None:
        return 0.5
    return 1.0 if bool(a) == bool(b) else 0.0


def _score_field(param: str, patient_val: Any, cohort_val: Any) -> float:
    if param in ("age",):
        return _numeric_score(patient_val, cohort_val, 30)
    if param in ("mitotic_index",):
        return _numeric_score(patient_val, cohort_val, 20)
    if param in ("tumor_size_mm", "max_tumor_size_mm"):
        return _numeric_score(patient_val, cohort_val, 40)
    if param in ("tmb",):
        return _numeric_score(patient_val, cohort_val, 15)
    if param in ("pd_l1_percent",):
        return _numeric_score(patient_val, cohort_val, 50)
    if param in ("ecog",):
        return _numeric_score(patient_val, cohort_val, 2)
    if param in ("pleural_invasion",):
        return _bool_score(patient_val, cohort_val)
    return _categorical_score(patient_val, cohort_val)


def _get_patient_val(profile: PatientProfile, field: str) -> Any:
    if hasattr(profile.pathology, field):
        return getattr(profile.pathology, field)
    if hasattr(profile.genomic, field):
        return getattr(profile.genomic, field)
    if hasattr(profile.imaging, field):
        v = getattr(profile.imaging, field)
        if field == "max_tumor_size_mm" and v is None:
            return profile.pathology.tumor_size_mm
        return v
    if hasattr(profile.clinical, field):
        return getattr(profile.clinical, field)
    return None


def rank_similar_cohorts(profile: PatientProfile, top_k: int = 10) -> list[SimilarCohort]:
    cohorts = get_all_cohorts()
    results: list[SimilarCohort] = []

    for c in cohorts:
        breakdown: list[ParamScore] = []
        group_scores: dict[str, list[float]] = {
            "genomic": [],
            "pathology": [],
            "clinical": [],
            "imaging": [],
        }

        for pf, cf in GENOMIC_FIELDS:
            pv = _get_patient_val(profile, pf)
            cv = c.get(cf)
            sc = _score_field(pf, pv, cv)
            group_scores["genomic"].append(sc)
            breakdown.append(
                ParamScore(
                    param=f"genomic.{pf}",
                    score=round(sc, 3),
                    color=_color(sc),
                    patient_value=str(pv) if pv is not None else None,
                    cohort_value=str(cv) if cv is not None else None,
                )
            )

        for pf, cf in PATHOLOGY_FIELDS:
            pv = _get_patient_val(profile, pf)
            cv = c.get(cf)
            sc = _score_field(pf, pv, cv)
            group_scores["pathology"].append(sc)
            breakdown.append(
                ParamScore(
                    param=f"pathology.{pf}",
                    score=round(sc, 3),
                    color=_color(sc),
                    patient_value=str(pv) if pv is not None else None,
                    cohort_value=str(cv) if cv is not None else None,
                )
            )

        for pf, cf in IMAGING_FIELDS:
            pv = _get_patient_val(profile, pf)
            cv = c.get(cf)
            sc = _score_field(pf, pv, cv)
            group_scores["imaging"].append(sc)
            breakdown.append(
                ParamScore(
                    param=f"imaging.{pf}",
                    score=round(sc, 3),
                    color=_color(sc),
                    patient_value=str(pv) if pv is not None else None,
                    cohort_value=str(cv) if cv is not None else None,
                )
            )

        for pf, cf in CLINICAL_FIELDS:
            pv = _get_patient_val(profile, pf)
            cv = c.get(cf)
            sc = _score_field(pf, pv, cv)
            group_scores["clinical"].append(sc)
            breakdown.append(
                ParamScore(
                    param=f"clinical.{pf}",
                    score=round(sc, 3),
                    color=_color(sc),
                    patient_value=str(pv) if pv is not None else None,
                    cohort_value=str(cv) if cv is not None else None,
                )
            )

        overall = sum(
            (sum(scores) / len(scores) if scores else 0.0) * WEIGHTS[group]
            for group, scores in group_scores.items()
        )

        results.append(
            SimilarCohort(
                cohort_id=c["cohort_id"],
                overall_score=round(overall, 3),
                param_breakdown=breakdown,
                cancer_subtype=c.get("cancer_subtype"),
                primary_mutation=c.get("primary_mutation"),
                stage=c.get("stage"),
                treatment_given=c.get("treatment_given"),
                outcome_os_months=c.get("outcome_os_months"),
                outcome_pfs_months=c.get("outcome_pfs_months"),
                clinical_outcome=c.get("clinical_outcome"),
                toxicity_profile=c.get("toxicity_profile"),
                pathology_summary=c.get("pathology_summary"),
            )
        )

    results.sort(key=lambda x: x.overall_score, reverse=True)
    return results[:top_k]
