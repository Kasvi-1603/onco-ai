"""Prognosis stats from top-k similar cohorts — Python only."""

from __future__ import annotations

import statistics

from models.schemas import PrognosisStats, SimilarCohort


def compute_prognosis(cohorts: list[SimilarCohort], top_k: int = 8) -> PrognosisStats:
    top = cohorts[:top_k]
    if not top:
        return PrognosisStats(cohort_count=0, summary="Insufficient similar cases for prognosis estimate.")

    os_vals = [c.outcome_os_months for c in top if c.outcome_os_months is not None]
    pfs_vals = [c.outcome_pfs_months for c in top if c.outcome_pfs_months is not None]

    median_os = statistics.median(os_vals) if os_vals else None
    median_pfs = statistics.median(pfs_vals) if pfs_vals else None
    os_range = (min(os_vals), max(os_vals)) if os_vals else None
    pfs_range = (min(pfs_vals), max(pfs_vals)) if pfs_vals else None

    summary_parts = []
    if median_os is not None and os_range:
        summary_parts.append(
            f"Median OS {median_os:.1f} mo (range {os_range[0]:.0f}–{os_range[1]:.0f}) "
            f"in {len(os_vals)} similar institutional cases"
        )
    if median_pfs is not None and pfs_range:
        summary_parts.append(
            f"Median PFS {median_pfs:.1f} mo (range {pfs_range[0]:.0f}–{pfs_range[1]:.0f})"
        )

    return PrognosisStats(
        cohort_count=len(top),
        median_os_months=round(median_os, 1) if median_os else None,
        os_range=os_range,
        median_pfs_months=round(median_pfs, 1) if median_pfs else None,
        pfs_range=pfs_range,
        summary=". ".join(summary_parts) + ". Uncertainty bands apply — not a individual prediction.",
    )
