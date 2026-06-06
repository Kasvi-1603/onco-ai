"use client";

import { useParams } from "next/navigation";
import { useSession } from "@/lib/api";
import { DoctorTopBar, EmptyPatientState } from "@/components/doctor/DoctorShell";
import { outcomeOS, outcomePFS, outcomeResponse } from "@/lib/match-utils";

export default function SummaryPage() {
  const { sessionId } = useParams() as { sessionId: string };
  const { data: session, isLoading } = useSession(sessionId);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0EA5A0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!session?.match_results?.length) return <EmptyPatientState />;

  const p = session.patient as Record<string, Record<string, unknown>>;
  const c = session.match_results[session.selected_case_index ?? 0];

  const soap = `SUBJECTIVE: ${p.clinical?.age}-year-old ${String(p.clinical?.sex).toLowerCase()} presents for oncology evaluation. Stage ${p.clinical?.stage}. ECOG ${p.clinical?.ecog_status}.

OBJECTIVE: ${p.imaging?.lobe} nodule ${p.pathology?.tumor_size_mm}mm. NGS: ${p.genomics?.driver_mutation}. Best match ${c.patient_id} at ${c.similarity_score}%.

ASSESSMENT: ${p.clinical?.stage} ${p.genomics?.driver_mutation}-driven disease. Matched outcome ${outcomeResponse(c.outcome)} (OS ${outcomeOS(c.outcome)} mo, PFS ${outcomePFS(c.outcome)} mo).

PLAN: ${c.treatment_history} per ${c.guideline_citation}. Restaging CT at 8 weeks.`;

  const copy = () => navigator.clipboard.writeText(soap);

  return (
    <>
      <DoctorTopBar title="Clinical Chart Documentation" />
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-3xl rounded-xl border border-zinc-200 bg-white shadow-sm flex flex-col min-h-[480px] animate-in">
          <div className="px-4 py-3 border-b border-zinc-200 text-[10px] uppercase tracking-wider text-zinc-400">
            Generated SOAP Note Template
          </div>
          <textarea
            readOnly
            value={soap}
            className="flex-1 p-5 text-sm text-zinc-700 leading-relaxed resize-none focus:outline-none bg-zinc-50/50 font-mono"
          />
          <div className="p-4 border-t border-zinc-200 flex justify-end">
            <button
              onClick={copy}
              className="rounded-lg bg-[#0EA5A0] text-white px-4 py-2 text-sm font-medium hover:bg-[#0d9488]"
            >
              Copy to Clipboard
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
