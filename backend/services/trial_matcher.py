from typing import List, Dict, Any, Tuple
from backend.models.schemas import PatientProfile, TrialMatch

def check_risk_flags(patient: PatientProfile) -> List[str]:
    """
    Checks for clinical risk flags deterministically based on patient profile.
    """
    flags = []
    
    # 1. Renal exclusion check (eGFR < 30)
    # Assuming eGFR is stored in labs dict
    egfr = patient.clinical.labs.get("eGFR")
    if egfr is not None:
        try:
            if float(egfr) < 30:
                flags.append("Renal exclusion risk: eGFR < 30")
        except ValueError:
            pass
            
    # 2. Prior therapy conflict
    # E.g., if patient had prior TKI and current profile suggests TKI resistance
    prior_therapies = [t.lower() for t in patient.clinical.prior_therapies]
    if "osimertinib" in prior_therapies and patient.genomic.egfr == "T790M":
        flags.append("Potential therapy conflict: Prior Osimertinib with T790M resistance mutation.")
        
    # 3. Biomarker discordance
    # e.g. EGFR positive but KRAS positive (usually mutually exclusive in NSCLC)
    if patient.genomic.egfr and patient.genomic.kras:
        if str(patient.genomic.egfr).lower() != "negative" and str(patient.genomic.kras).lower() != "negative":
            flags.append("Biomarker discordance: Co-occurring EGFR and KRAS mutations detected.")

    return flags

def match_trials(patient: PatientProfile, cached_trials: List[Dict[str, Any]]) -> List[TrialMatch]:
    """
    Matches patient against cached trials based on inclusion/exclusion criteria.
    """
    matches = []
    for trial in cached_trials:
        nct_id = trial.get("nct_id", "UNKNOWN")
        title = trial.get("title", "Unknown Trial")
        phase = trial.get("phase", "Unknown")
        inclusion = trial.get("inclusion_criteria", {})
        exclusion = trial.get("exclusion_criteria", {})
        raw_eligibility = trial.get("raw_eligibility", "")
        
        matched_criteria = []
        conflicts = []
        
        # Check inclusions (e.g. requires EGFR Exon 19)
        req_egfr = inclusion.get("egfr")
        if req_egfr:
            if patient.genomic.egfr and req_egfr.lower() in str(patient.genomic.egfr).lower():
                matched_criteria.append(f"EGFR match: {patient.genomic.egfr}")
            else:
                conflicts.append(f"Requires EGFR {req_egfr}")
                
        req_stage = inclusion.get("stage")
        if req_stage:
            if patient.clinical.stage and req_stage.lower() in str(patient.clinical.stage).lower():
                matched_criteria.append(f"Stage match: {patient.clinical.stage}")
            else:
                conflicts.append(f"Requires Stage {req_stage}")

        # Check exclusions
        excl_egfr = exclusion.get("egfr_below")
        egfr_val = patient.clinical.labs.get("eGFR")
        if excl_egfr and egfr_val:
            try:
                if float(egfr_val) < float(excl_egfr):
                    conflicts.append(f"Excluded: eGFR < {excl_egfr}")
            except ValueError:
                pass
                
        excl_prior = exclusion.get("prior_therapy")
        if excl_prior:
            if any(excl_prior.lower() in pt.lower() for pt in patient.clinical.prior_therapies):
                conflicts.append(f"Excluded: Prior therapy with {excl_prior}")

        # If we have matches and not outright disqualified, add it
        # Or even add it with conflicts for the UI to display warning
        matches.append(TrialMatch(
            nct_id=nct_id,
            title=title,
            phase=phase,
            matched_criteria=matched_criteria,
            conflicts=conflicts,
            raw_eligibility=raw_eligibility
        ))
        
    # Sort so trials with least conflicts and most matched criteria are on top
    matches.sort(key=lambda x: (len(x.conflicts), -len(x.matched_criteria)))
    return matches
