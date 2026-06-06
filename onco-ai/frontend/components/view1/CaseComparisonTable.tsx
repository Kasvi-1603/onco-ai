"use client";

import { useState } from "react";
import type { SimilarCohort } from "@/lib/types";

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

function colorClass(c: string) {
  if (c === "green") return "bg-emerald-100 text-emerald-800";
  if (c === "amber") return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-red-800";
}

export function CaseComparisonTable({
  cohorts,
  compact,
}: {
  cohorts: SimilarCohort[];
  compact?: boolean;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!cohorts.length) {
    return <p className="text-sm text-slate-500">No similar cases retrieved.</p>;
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Similar Cases {compact ? "(top 3)" : ""}
      </h2>
      <div className="mt-3 space-y-3">
        {cohorts.map((c) => (
          <div key={c.cohort_id} className="rounded-lg border border-slate-100 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-mono text-sm font-semibold">{c.cohort_id}</span>
                <span className="ml-2 text-lg font-bold text-emerald-700">{pct(c.overall_score)}</span>
                <span className="ml-2 text-xs text-slate-500">{c.primary_mutation}</span>
              </div>
              <button
                type="button"
                className="text-xs text-blue-600"
                onClick={() => setExpanded(expanded === c.cohort_id ? null : c.cohort_id)}
              >
                {expanded === c.cohort_id ? "Hide breakdown" : "Param breakdown"}
              </button>
            </div>
            <p className="mt-1 text-sm text-slate-700">
              {c.treatment_given} → {c.clinical_outcome} (OS {c.outcome_os_months} mo / PFS{" "}
              {c.outcome_pfs_months} mo)
            </p>
            {c.toxicity_profile && (
              <p className="text-xs text-amber-700">Toxicity: {c.toxicity_profile}</p>
            )}
            {expanded === c.cohort_id && (
              <div className="mt-2 flex flex-wrap gap-1">
                {c.param_breakdown.slice(0, compact ? 8 : 20).map((p) => (
                  <span
                    key={p.param}
                    className={`rounded px-1.5 py-0.5 text-[10px] ${colorClass(p.color)}`}
                    title={`${p.patient_value} vs ${p.cohort_value}`}
                  >
                    {p.param.split(".").pop()} {pct(p.score)}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
