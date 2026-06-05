import type { TrialMatch } from "@/lib/types";

export function TrialMatchTable({ trials }: { trials: TrialMatch[] }) {
  if (!trials.length) {
    return <p className="text-sm text-slate-500">No trial matches.</p>;
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Trial Eligibility Matrix
      </h2>
      <p className="text-xs text-slate-500">Eligible for review — not a recommendation</p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b text-xs text-slate-500">
              <th className="py-2 pr-2">NCT ID</th>
              <th className="py-2 pr-2">Phase</th>
              <th className="py-2 pr-2">Status</th>
              <th className="py-2 pr-2">Matched</th>
              <th className="py-2">Conflicts</th>
            </tr>
          </thead>
          <tbody>
            {trials.map((t) => (
              <tr key={t.nct_id} className="border-b border-slate-50 align-top">
                <td className="py-3 pr-2">
                  <div className="font-mono text-xs font-semibold">{t.nct_id}</div>
                  <div className="mt-1 max-w-xs text-xs text-slate-600">{t.title}</div>
                </td>
                <td className="py-3 pr-2 text-xs">{t.phase}</td>
                <td className="py-3 pr-2">
                  <span
                    className={`rounded px-2 py-0.5 text-xs ${
                      t.eligibility === "eligible_for_review"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {t.eligibility.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="py-3 pr-2 text-xs text-emerald-700">
                  {t.matched_on.join("; ") || "—"}
                </td>
                <td className="py-3 text-xs text-amber-700">
                  {t.conflicts.join("; ") || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
