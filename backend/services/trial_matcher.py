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


def _prior_tki_count(profile: PatientProfile) -> int:
    count = 0
    for t in profile.clinical.prior_therapies:
        tl = t.lower()
        if any(x in tl for x in ("osimertinib", "erlotinib", "gefitinib", "afatinib", "tki", "egfr")):
            count += 1
    return count


def match_trials(profile: PatientProfile) -> list[TrialMatch]:
    trials = get_all_trials()
    matches: list[TrialMatch] = []

    egfr_mut = _has_egfr_mutation(profile)
    egfr_sub = _egfr_subtype(profile)
    alk_pos = "positive" in _norm(profile.genomic.alk) or "eml4" in _norm(profile.genomic.alk)
    kras_g12c = "g12c" in _norm(profile.genomic.kras)
    prior_tki = _prior_tki_count(profile)
    ecog = profile.clinical.ecog if profile.clinical.ecog is not None else 1
    pd_l1 = profile.genomic.pd_l1_percent
    stage = _norm(profile.clinical.stage)
    egfr_ml = (
        profile.clinical.labs.egfr_ml_min
        if profile.clinical.labs and profile.clinical.labs.egfr_ml_min
        else 999
    )

    for t in trials:
        matched_on: list[str] = []
        conflicts: list[str] = []
        excluded = False

        required = t.get("biomarkers_required") or []
        excluded_bio = t.get("biomarkers_excluded") or []

        if "EGFR" in required and not egfr_mut:
            excluded = True
            conflicts.append("EGFR mutation required — not detected")
        elif "EGFR" in required and egfr_mut:
            matched_on.append(f"EGFR ({profile.genomic.egfr})")

        if "ALK" in required and not alk_pos:
            excluded = True
            conflicts.append("ALK rearrangement required")
        elif "ALK" in required and alk_pos:
            matched_on.append("ALK positive")

        if "KRAS G12C" in required and not kras_g12c:
            excluded = True
            conflicts.append("KRAS G12C required")
        elif "KRAS G12C" in required and kras_g12c:
            matched_on.append("KRAS G12C")

        for ex in excluded_bio:
            if ex == "EGFR" and egfr_mut:
                excluded = True
                conflicts.append("Trial excludes EGFR-mutated NSCLC")
            if ex == "ALK" and alk_pos:
                excluded = True
                conflicts.append("Trial excludes ALK-positive NSCLC")

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
            stage_match = any(s.lower() in stage or stage in s.lower() for s in stages)
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
                )
            )

    order = {"eligible_for_review": 0, "conflicts": 1, "excluded": 2}
    matches.sort(key=lambda m: order.get(m.eligibility, 9))
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

    egfr_ml = profile.clinical.labs.egfr_ml_min if profile.clinical.labs else None
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
