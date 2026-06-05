import statistics
from typing import List
from backend.models.schemas import CohortScore, PrognosisStats

def calculate_prognosis_stats(top_cohorts: List[CohortScore]) -> PrognosisStats:
    """
    Calculates deterministic prognosis statistics (median OS/PFS) based on top matching cohorts.
    Assumes top_cohorts is already sorted by similarity score.
    """
    if not top_cohorts:
        return PrognosisStats(cohort_size=0)
        
    os_values = []
    pfs_values = []
    
    # We take up to the top 8 cohorts for statistics
    subset = top_cohorts[:8]
    
    for cohort in subset:
        data = cohort.cohort_data
        os = data.get("outcome_os_months")
        pfs = data.get("outcome_pfs_months")
        
        if os is not None:
            try:
                os_values.append(float(os))
            except ValueError:
                pass
                
        if pfs is not None:
            try:
                pfs_values.append(float(pfs))
            except ValueError:
                pass

    median_os = statistics.median(os_values) if os_values else None
    median_pfs = statistics.median(pfs_values) if pfs_values else None
    
    range_os = [min(os_values), max(os_values)] if os_values else None
    range_pfs = [min(pfs_values), max(pfs_values)] if pfs_values else None

    return PrognosisStats(
        median_os_months=median_os,
        median_pfs_months=median_pfs,
        range_os_months=range_os,
        range_pfs_months=range_pfs,
        cohort_size=len(subset)
    )
