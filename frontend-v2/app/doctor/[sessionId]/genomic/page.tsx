"use client";

import { useParams } from "next/navigation";
import { useSession } from "@/lib/api";
import { DoctorTopBar, EmptyPatientState } from "@/components/doctor/DoctorShell";
import DNAHelixModel from "@/components/doctor/DNAHelixModel";

export default function GenomicPage() {
  const { sessionId } = useParams() as { sessionId: string };
  const { data: session, isLoading } = useSession(sessionId);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0EA5A0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!session) return <EmptyPatientState />;

  const g = (session.patient as { genomics?: Record<string, unknown> }).genomics ?? {};
  const driver = String(g.driver_mutation ?? "—");
  const tmb = g.tmb ?? "—";
  const tmbNum = Number(g.tmb ?? 0);
  const tmbLabel = tmbNum >= 10 ? "TMB-High" : tmbNum >= 6 ? "Intermediate" : "TMB-Low";

  return (
    <>
      <DoctorTopBar title="Next-Gen Sequencing Variant Registry" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid lg:grid-cols-2 gap-6 max-w-6xl animate-in">
          <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-200 text-xs font-semibold text-zinc-600">
              Somatic Variant Calls (OncoKB Grounded)
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] text-zinc-400 uppercase">
                  <th className="text-left p-3">Gene</th>
                  <th className="text-left p-3">Alteration</th>
                  <th className="text-left p-3">Classification</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-zinc-100">
                  <td className="p-3 font-medium">{driver.split(" ")[0]}</td>
                  <td className="p-3 text-zinc-600">{driver}</td>
                  <td className="p-3"><span className="text-xs bg-[#ecfdf9] text-[#0d9488] px-2 py-0.5 rounded">Oncogenic</span></td>
                </tr>
                {g.secondary_mutation != null && String(g.secondary_mutation) !== "None" ? (
                  <tr className="border-t border-zinc-100">
                    <td className="p-3 font-medium">{String(g.secondary_mutation)}</td>
                    <td className="p-3 text-zinc-600">Secondary</td>
                    <td className="p-3 text-zinc-500 text-xs">VUS / Pathogenic</td>
                  </tr>
                ) : null}
                <tr className="border-t border-zinc-100">
                  <td className="p-3 font-medium">PD-L1</td>
                  <td className="p-3 text-zinc-600">{String(g.pdl1_percent ?? "—")}%</td>
                  <td className="p-3 text-zinc-500 text-xs">IHC</td>
                </tr>
                <tr className="border-t border-zinc-100">
                  <td className="p-3 font-medium">CNV</td>
                  <td className="p-3 text-zinc-600">{String(g.cnv ?? "—")}</td>
                  <td className="p-3 text-zinc-500 text-xs">Copy number</td>
                </tr>
              </tbody>
            </table>
          </div>

          <DNAHelixModel />

          <div className="rounded-xl border border-zinc-200 p-6 text-center">
            <p className="text-xs uppercase tracking-wider text-zinc-400 mb-2">Tumor Mutational Burden</p>
            <p className="text-4xl font-semibold text-[#0EA5A0]">
              {String(tmb)} <span className="text-sm text-zinc-400">mut/Mb</span>
            </p>
            <span className="inline-block mt-3 text-xs bg-zinc-100 text-zinc-600 px-3 py-1 rounded">{tmbLabel}</span>
          </div>

          <div className="lg:col-span-2 rounded-xl border border-zinc-200 p-5">
            <p className="text-xs uppercase tracking-wider text-zinc-400 mb-3">
              Locus Variant Visual Mapping · {driver}
            </p>
            <div className="h-10 bg-zinc-50 rounded-lg border border-zinc-200 relative flex items-center px-4">
              <div className="flex-1 h-1 bg-zinc-200 rounded relative">
                <div className="absolute w-3 h-3 bg-[#0EA5A0] rounded-full -top-1 left-[35%]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
