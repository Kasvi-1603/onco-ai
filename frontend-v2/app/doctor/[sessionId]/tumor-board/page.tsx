"use client";

import { useParams } from "next/navigation";
import { useSession } from "@/lib/api";
import { DoctorTopBar, EmptyPatientState } from "@/components/doctor/DoctorShell";
import { outcomeOS, outcomePFS, outcomeResponse } from "@/lib/match-utils";

export default function TumorBoardPage() {
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
  const top = session.match_results[session.selected_case_index ?? 0];

  return (
    <>
      <DoctorTopBar title="Tumor Board Brief Generator" />
      <div className="flex-1 overflow-y-auto p-6">
        <article className="max-w-3xl rounded-xl border border-zinc-200 bg-white p-8 shadow-sm prose prose-sm prose-zinc animate-in">
          <h2 className="text-xl font-bold text-zinc-900 mb-4" style={{ fontFamily: "Syne" }}>
            Clinical Case Synopsis · Tumor Board
          </h2>
          <div className="flex flex-wrap gap-3 text-xs text-zinc-500 mb-6 pb-4 border-b border-zinc-100">
            <span>Patient: {session.patient_name}</span>
            <span>Histology: {String(p.pathology?.subtype ?? "—")}</span>
            <span>Driver: {String(p.genomics?.driver_mutation ?? "—")}</span>
            <span>Match: {top.patient_id} · {top.similarity_score}%</span>
          </div>
          <p className="text-sm text-zinc-700 leading-relaxed mb-4">
            <strong>Presentation:</strong> {String(p.clinical?.age)}-year-old{" "}
            {String(p.clinical?.sex).toLowerCase()} with {String(p.imaging?.lobe)} lesion (
            {String(p.pathology?.tumor_size_mm)}mm), {String(p.clinical?.stage)}.
          </p>
          <p className="text-sm text-zinc-700 leading-relaxed mb-4">
            <strong>Molecular:</strong> Driver {String(p.genomics?.driver_mutation)}; TMB{" "}
            {String(p.genomics?.tmb)} mut/Mb; PD-L1 {String(p.genomics?.pdl1_percent)}%.
          </p>
          <p className="text-sm text-zinc-700 leading-relaxed mb-4">
            <strong>Cohort match:</strong> {top.patient_id} treated with {top.treatment_history}, outcome{" "}
            {outcomeResponse(top.outcome)} (OS {outcomeOS(top.outcome)} mo, PFS {outcomePFS(top.outcome)} mo).
          </p>
          <p className="text-sm text-zinc-700 leading-relaxed">
            <strong>Board question:</strong> Validate first-line treatment and trial candidacy.
          </p>
          <div className="mt-6 rounded-lg bg-[#ecfdf9] border border-[#99f6e4] p-3 text-xs text-[#0d9488]">
            AI-generated draft — requires clinician review before tumor board submission.
          </div>
        </article>
      </div>
    </>
  );
}
