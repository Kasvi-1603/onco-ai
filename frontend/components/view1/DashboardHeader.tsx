import Link from "next/link";
import type { SessionPayload } from "@/lib/types";
import { BiomarkerBadge } from "@/components/shared/BiomarkerBadge";

export function DashboardHeader({
  data,
  onApprove,
  approving,
}: {
  data: SessionPayload;
  onApprove: () => void;
  approving: boolean;
}) {
  const g = data.patient_profile.genomic;
  const c = data.patient_profile.clinical;

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <div>
          <Link href="/" className="text-xs text-slate-500 hover:text-slate-700">
            ← Upload
          </Link>
          <h1 className="text-xl font-semibold text-slate-900">Oncologist Dashboard</h1>
          <p className="text-xs text-slate-500">
            Session {data.session_id} · Stage {c.stage ?? "—"} · {data.draft_label}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {g.egfr && <BiomarkerBadge label="EGFR" value={g.egfr} highlight />}
            {g.pd_l1_percent != null && (
              <BiomarkerBadge label="PD-L1" value={`${g.pd_l1_percent}%`} />
            )}
            {g.alk && <BiomarkerBadge label="ALK" value={g.alk} />}
            {g.kras && <BiomarkerBadge label="KRAS" value={g.kras} />}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              data.status === "shared"
                ? "bg-emerald-100 text-emerald-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {data.status}
          </span>
          {data.status !== "shared" && (
            <button
              type="button"
              disabled={approving}
              onClick={onApprove}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {approving ? "Approving…" : "Approve & Share"}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
