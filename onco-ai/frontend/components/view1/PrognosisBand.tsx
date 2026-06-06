import type { PrognosisStats } from "@/lib/types";

export function PrognosisBand({ stats }: { stats?: PrognosisStats | null }) {
  if (!stats?.summary) return null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Prognosis (similar cohorts)
      </h2>
      <p className="mt-2 text-sm font-medium text-slate-900">{stats.summary}</p>
      <div className="mt-2 flex gap-4 text-xs text-slate-600">
        {stats.median_os_months != null && (
          <span>Median OS: {stats.median_os_months} mo</span>
        )}
        {stats.median_pfs_months != null && (
          <span>Median PFS: {stats.median_pfs_months} mo</span>
        )}
        <span>n={stats.cohort_count}</span>
      </div>
    </section>
  );
}
