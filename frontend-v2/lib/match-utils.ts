import { MatchColor, MatchResult, SimilarCohort } from "./types";

export function outcomeResponse(outcome: MatchResult["outcome"]): string {
  if (typeof outcome === "object" && outcome !== null && "response" in outcome) {
    return String(outcome.response);
  }
  return String(outcome ?? "Unknown");
}

export function outcomeOS(outcome: MatchResult["outcome"]): number {
  if (typeof outcome === "object" && outcome !== null && "OS_months" in outcome) {
    return Number(outcome.OS_months) || 0;
  }
  return 0;
}

export function outcomePFS(outcome: MatchResult["outcome"]): number {
  if (typeof outcome === "object" && outcome !== null && "PFS_months" in outcome) {
    return Number(outcome.PFS_months) || 0;
  }
  return 0;
}

export function scoreColor(sim: number): string {
  if (sim >= 75) return "text-emerald-600";
  if (sim >= 50) return "text-amber-600";
  return "text-red-600";
}

export function dotColor(score: string): string {
  if (score === "green") return "bg-emerald-500";
  if (score === "amber") return "bg-amber-500";
  return "bg-red-500";
}

export function scoreToNormalized(score: MatchColor): number {
  if (score === "green") return 1;
  if (score === "amber") return 0.55;
  return 0.15;
}

const DOMAIN_SLICES = [
  { param: "Pathology", start: 0, end: 5 },
  { param: "Genomics", start: 5, end: 10 },
  { param: "Imaging", start: 10, end: 15 },
  { param: "Clinical", start: 15, end: 20 },
] as const;

function domainBreakdown(parameters: MatchResult["parameters"]) {
  return DOMAIN_SLICES.map(({ param, start, end }) => {
    const slice = parameters.slice(start, end);
    const score =
      slice.length > 0
        ? slice.reduce((sum, p) => sum + scoreToNormalized(p.score), 0) / slice.length
        : 0;
    const greens = slice.filter((p) => p.score === "green").length;
    return {
      param,
      score,
      color: (score >= 0.85 ? "green" : score >= 0.55 ? "amber" : "red") as MatchColor,
      patient_value: `${greens}/${slice.length} aligned`,
      cohort_value: `${Math.round(score * 100)}%`,
    };
  });
}

/** Convert /api/match results into cohort spider-map shape (4 domain axes). */
export function matchResultsToCohorts(results: MatchResult[]): SimilarCohort[] {
  return results.map((r) => {
    const raw = r.raw_case_data as Record<string, Record<string, unknown>> | undefined;
    return {
      cohort_id: r.patient_id,
      overall_score: r.similarity_score / 100,
      param_breakdown: domainBreakdown(r.parameters),
      cancer_subtype: String(raw?.pathology?.subtype ?? ""),
      primary_mutation: String(raw?.genomics?.driver_mutation ?? ""),
      stage: r.stage,
      treatment_given: r.treatment_history,
      outcome_os_months: outcomeOS(r.outcome),
      outcome_pfs_months: outcomePFS(r.outcome),
      clinical_outcome: outcomeResponse(r.outcome),
    };
  });
}
