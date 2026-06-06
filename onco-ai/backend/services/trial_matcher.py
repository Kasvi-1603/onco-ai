"""Deterministic trial matcher + risk flags."""

from __future__ import annotations

from db.database import get_all_trials
from models.schemas import PatientProfile, RiskFlag, TrialMatch


def _norm(s: str | None) -> str:
    return (s or "").lower().strip()


def _has_egfr_mutation(profile: PatientProfile) -> bool:
    egfr = _norm(profile.genomic.egfr)
    return bool(egfr) and egfr not in ("wild-type", "wt", "negative")


def _egfr_subtype(profile: PatientProfile) -> str:
    egfr = _norm(profile.genomic.egfr)
    if "exon 19" in egfr:
        return "Exon 19 deletion"
    if "l858r" in egfr:
        return "L858R"
    if "exon 20" in egfr:
        return "Exon 20 insertion"
    if "t790m" in egfr:
        return "T790M"
    return egfr


def _has_ros1(profile: PatientProfile) -> bool:
    ros1 = _norm(profile.genomic.ros1)
    return bool(ros1) and ros1 not in ("wild-type", "wild type", "wt", "negative", "none")


def _has_t790m(profile: PatientProfile) -> bool:
    return "t790m" in _norm(profile.genomic.egfr)


def _prior_tki_count(profile: PatientProfile) -> int:
    count = 0
    for t in profile.clinical.prior_therapies:
        tl = t.lower()
        if any(x in tl for x in ("osimertinib", "erlotinib", "gefitinib", "afatinib", "tki", "egfr")):
            count += 1
    return count


def _lab_value(profile: PatientProfile, key: str) -> float | None:
    labs = profile.clinical.labs
    if not labs:
        return None
    if isinstance(labs, dict):
        value = labs.get(key)
    else:
        value = getattr(labs, key, None)
    return float(value) if value is not None else None


def _stage_token(stage: str | None) -> str:
    cleaned = _norm(stage).replace("stage", "").strip().upper()
    return cleaned.split()[0] if cleaned else ""


def _stage_matches(patient_stage: str, trial_stage: str) -> bool:
    patient = _stage_token(patient_stage)
    trial = _stage_token(trial_stage)
    if not patient or not trial:
        return False
    if trial == "II" and patient.startswith("II") and not patient.startswith("III"):
        return True
    return patient == trial


def _active_status_bonus(status: str | None) -> float:
    s = _norm(status)
    if "recruiting" in s and "not recruiting" not in s:
        return 0.08
    if "not yet recruiting" in s:
        return 0.06
    if "active" in s:
        return 0.04
    return 0.0


def _score_match(
    *,
    matched_count: int,
    conflict_count: int,
    excluded: bool,
    required_count: int,
    status: str | None,
) -> float:
    if excluded:
        return 0.0
    required_weight = 0.45 if required_count else 0.15
    required_score = 1.0 if required_count == 0 else min(matched_count / max(required_count, 1), 1.0)
    criteria_score = min(matched_count / 6, 1.0)
    score = 0.25 + (required_weight * required_score) + (0.25 * criteria_score)
    score += _active_status_bonus(status)
    score -= min(conflict_count * 0.18, 0.45)
    return round(max(0.05, min(score, 0.98)), 2)


def match_trials(profile: PatientProfile) -> list[TrialMatch]:
    trials = get_all_trials()
    matches: list[TrialMatch] = []

    egfr_mut = _has_egfr_mutation(profile)
    egfr_sub = _egfr_subtype(profile)
    alk_pos = "positive" in _norm(profile.genomic.alk) or "eml4" in _norm(profile.genomic.alk)
    kras_g12c = "g12c" in _norm(profile.genomic.kras)
    ros1_pos = _has_ros1(profile)
    t790m_pos = _has_t790m(profile)
    prior_tki = _prior_tki_count(profile)
    ecog = profile.clinical.ecog if profile.clinical.ecog is not None else 1
    pd_l1 = profile.genomic.pd_l1_percent
    if pd_l1 is None:
        pd_l1 = profile.genomic.pd_l1
    stage = profile.clinical.stage
    egfr_ml = _lab_value(profile, "egfr_ml_min") or 999

    for t in trials:
        matched_on: list[str] = []
        conflicts: list[str] = []
        excluded = False

        required = t.get("biomarkers_required") or []
        excluded_bio = t.get("biomarkers_excluded") or []

        for req in required:
            req_norm = _norm(req)
            if req_norm == "egfr":
                if egfr_mut:
                    matched_on.append(f"EGFR ({profile.genomic.egfr})")
                else:
                    excluded = True
                    conflicts.append("EGFR mutation required — not detected")
            elif req_norm == "t790m":
                if t790m_pos:
                    matched_on.append("EGFR T790M")
                else:
                    excluded = True
                    conflicts.append("EGFR T790M required")
            elif req_norm == "alk":
                if alk_pos:
                    matched_on.append("ALK positive")
                else:
                    excluded = True
                    conflicts.append("ALK rearrangement required")
            elif req_norm == "kras g12c":
                if kras_g12c:
                    matched_on.append("KRAS G12C")
                else:
                    excluded = True
                    conflicts.append("KRAS G12C required")
            elif req_norm == "ros1":
                if ros1_pos:
                    matched_on.append("ROS1 positive")
                else:
                    excluded = True
                    conflicts.append("ROS1 rearrangement required")
            else:
                excluded = True
                conflicts.append(f"{req} required — not available in patient profile")

        for ex in excluded_bio:
            ex_norm = _norm(ex)
            if "egfr" in ex_norm and egfr_mut:
                excluded = True
                conflicts.append("Trial excludes EGFR-mutated NSCLC")
            if "alk" in ex_norm and alk_pos:
                excluded = True
                conflicts.append("Trial excludes ALK-positive NSCLC")
            if "ros1" in ex_norm and ros1_pos:
                excluded = True
                conflicts.append("Trial excludes ROS1-positive NSCLC")

        egfr_subtypes = t.get("egfr_subtypes") or []
        if egfr_subtypes and egfr_mut:
            if any(_norm(s) in _norm(egfr_sub) or _norm(egfr_sub) in _norm(s) for s in egfr_subtypes):
                matched_on.append(f"EGFR subtype: {egfr_sub}")
            elif egfr_subtypes:
                conflicts.append(f"EGFR subtype mismatch (patient: {egfr_sub})")

        max_tki = t.get("max_prior_tki_lines")
        if max_tki is not None and prior_tki > max_tki:
            excluded = True
            conflicts.append(f"Prior EGFR-TKI lines ({prior_tki}) exceed trial limit ({max_tki})")
        elif max_tki is not None and prior_tki <= max_tki:
            matched_on.append("Prior TKI line count acceptable")

        min_ecog = t.get("min_ecog")
        max_ecog = t.get("max_ecog")
        if max_ecog is not None and ecog > max_ecog:
            excluded = True
            conflicts.append(f"ECOG {ecog} exceeds trial max {max_ecog}")
        elif min_ecog is not None:
            matched_on.append(f"ECOG {ecog}")

        min_pd = t.get("min_pd_l1_percent")
        if min_pd is not None and (pd_l1 is None or pd_l1 < min_pd):
            excluded = True
            conflicts.append(f"PD-L1 below minimum {min_pd}%")
        elif min_pd is not None and pd_l1 is not None:
            matched_on.append(f"PD-L1 {pd_l1}%")

        min_egfr = t.get("min_egfr_ml_min")
        if min_egfr is not None and egfr_ml < min_egfr:
            excluded = True
            conflicts.append(f"Renal function eGFR {egfr_ml} below trial minimum")

        stages = t.get("stage_eligible") or []
        if stages and stage:
            stage_match = any(_stage_matches(stage, s) for s in stages)
            if stage_match:
                matched_on.append(f"Stage {profile.clinical.stage}")
            else:
                conflicts.append(f"Stage {profile.clinical.stage} may not align with eligible stages")

        if excluded:
            eligibility = "excluded"
        elif conflicts:
            eligibility = "conflicts"
        else:
            eligibility = "eligible_for_review"

        if not excluded:
            match_score = _score_match(
                matched_count=len(matched_on),
                conflict_count=len(conflicts),
                excluded=excluded,
                required_count=len(required),
                status=t.get("status"),
            )
            matches.append(
                TrialMatch(
                    nct_id=t["nct_id"],
                    title=t["title"],
                    phase=t.get("phase"),
                    status=t.get("status"),
                    eligibility=eligibility,
                    matched_on=matched_on,
                    conflicts=conflicts,
                    inclusion_summary=t.get("inclusion_summary"),
                    intervention=t.get("intervention"),
                    match_score=match_score,
                )
            )

    order = {"eligible_for_review": 0, "conflicts": 1, "excluded": 2}
    matches.sort(key=lambda m: (order.get(m.eligibility, 9), -(m.match_score or 0)))
    return matches[:8]


def compute_risk_flags(profile: PatientProfile) -> list[RiskFlag]:
    flags: list[RiskFlag] = []

    egfr = _norm(profile.genomic.egfr)
    pd_l1 = profile.genomic.pd_l1_percent
    if "exon 19" in egfr and pd_l1 is not None and pd_l1 >= 50:
        flags.append(
            RiskFlag(
                code="biomarker_discordance",
                severity="info",
                message="EGFR-mutated with PD-L1 ≥50% — consider sequencing of TKI vs immunotherapy per NCCN.",
            )
        )

    egfr_ml = _lab_value(profile, "egfr_ml_min")
    if egfr_ml is not None and egfr_ml < 30:
        flags.append(
            RiskFlag(
                code="renal_exclusion",
                severity="critical",
                message=f"eGFR {egfr_ml} mL/min — many trials and TKIs require caution below 30.",
            )
        )

    if _prior_tki_count(profile) > 0 and _has_egfr_mutation(profile):
        flags.append(
            RiskFlag(
                code="prior_tki",
                severity="warning",
                message="Prior EGFR-TKI therapy — resistance profiling and trial eligibility differ from first-line.",
            )
        )

    if profile.clinical.allergies:
        flags.append(
            RiskFlag(
                code="allergy",
                severity="warning",
                message=f"Documented allergies: {', '.join(profile.clinical.allergies)}",
            )
        )

    return flags
