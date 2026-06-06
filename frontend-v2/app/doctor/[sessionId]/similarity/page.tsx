"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useSession, selectMatchCase, getAIRationale } from "@/lib/api";
import { DoctorTopBar, EmptyPatientState } from "@/components/doctor/DoctorShell";
import Lungs3DModel from "@/components/view1/Lungs3DModel";
import CohortFeatureSpiderMap from "@/components/doctor/CohortFeatureSpiderMap";
import { outcomeOS, outcomePFS, outcomeResponse, dotColor, scoreColor } from "@/lib/match-utils";

type SubTab = "similarity" | "treatment" | "trials" | "prognosis";

export default function SimilarityPage() {
  const { sessionId } = useParams() as { sessionId: string };
  const { data: session, isLoading, refetch } = useSession(sessionId);
  const [subTab, setSubTab] = useState<SubTab>("similarity");
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0EA5A0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session?.match_results?.length) return <EmptyPatientState />;

  const idx = session.selected_case_index ?? 0;
  const active = session.match_results[idx];
  const patient = session.patient as Record<string, Record<string, unknown>>;

  const pickCase = async (i: number) => {
    await selectMatchCase(sessionId, i);
    refetch();
  };

  const runAI = async () => {
    setAiLoading(true);
    const p = patient;
    const prompt = `You are Oncopilot AI. Provide 3-4 short clinical paragraphs on why ${active.patient_id} (${active.similarity_score}% match) is relevant for this patient with ${p.genomics?.driver_mutation}, stage ${p.clinical?.stage}. Treatment: ${active.treatment_history}. Outcome: ${outcomeResponse(active.outcome)}.`;
    try {
      setAiText(await getAIRationale(prompt));
    } catch {
      setAiText("AI rationale unavailable — set ANTHROPIC_API_KEY on the backend.");
    } finally {
      setAiLoading(false);
    }
  };

  const os = outcomeOS(active.outcome);
  const pfs = outcomePFS(active.outcome);
  const resp = outcomeResponse(active.outcome);

  return (
    <>
      <DoctorTopBar title="Case Similarity Engine">
        <span className="text-xs text-zinc-500">100 TCGA-LUAD cases indexed</span>
      </DoctorTopBar>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-72 shrink-0 border-r border-zinc-200 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-200 flex justify-between items-center">
            <span className="text-xs font-semibold text-zinc-600">Matched Cohorts</span>
            <span className="text-[10px] text-zinc-400">{session.match_results.length} matches</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {session.match_results.map((c, i) => (
              <button
                key={c.patient_id}
                onClick={() => pickCase(i)}
                className={`w-full text-left rounded-lg border p-3 transition-colors ${
                  i === idx ? "border-[#0EA5A0] bg-[#ecfdf9]" : "border-zinc-200 hover:bg-zinc-50"
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[11px] font-mono text-zinc-700">{c.patient_id}</span>
                  <span className={`text-sm font-bold ${scoreColor(c.similarity_score)}`}>
                    {c.similarity_score}%
                  </span>
                </div>
                <div className="h-1 bg-zinc-100 rounded mt-2 overflow-hidden">
                  <div className="h-full bg-[#0EA5A0]" style={{ width: `${c.similarity_score}%` }} />
                </div>
                <div className="flex gap-0.5 mt-2 flex-wrap">
                  {c.parameters?.slice(0, 10).map((p, j) => (
                    <span key={j} className={`w-1.5 h-1.5 rounded-full ${dotColor(p.score)}`} />
                  ))}
                </div>
                <p className="text-[10px] text-zinc-500 mt-1.5">{resp} · OS {os} mo</p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex border-b border-zinc-200 px-4 gap-1">
            {(
              [
                ["similarity", "Similarity breakdown"],
                ["treatment", "Treatment plan"],
                ["trials", "Trial matcher"],
                ["prognosis", "Prognosis"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() => {
                  setSubTab(id);
                  if (id === "treatment" && !aiText) runAI();
                }}
                className={`px-4 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors ${
                  subTab === id
                    ? "border-[#0EA5A0] text-[#0EA5A0]"
                    : "border-transparent text-zinc-500 hover:text-zinc-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {subTab === "similarity" && (
              <div className="grid lg:grid-cols-2 gap-6 animate-in">
                <div className="space-y-6">
                  <CohortFeatureSpiderMap activeCase={active} />
                  <Lungs3DModel />
                </div>
                <div className="rounded-xl border border-zinc-200 overflow-hidden">
                  <div className="px-4 py-2 border-b border-zinc-200 text-[10px] uppercase tracking-wider text-zinc-400 grid grid-cols-[1fr_80px_80px_32px] gap-2">
                    <span>Parameter</span>
                    <span>Patient</span>
                    <span className="text-right">{active.patient_id}</span>
                    <span className="text-right">Match</span>
                  </div>
                  {active.parameters.map((p, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-[1fr_80px_80px_32px] gap-2 items-center px-4 py-2 text-xs border-b border-zinc-50"
                    >
                      <span className="flex items-center gap-2 text-zinc-800">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor(p.score)}`} />
                        {p.name}
                      </span>
                      <span className="text-zinc-500 truncate">{p.patient}</span>
                      <span className="text-zinc-500 text-right truncate">{p.match}</span>
                      <span className="text-right">{p.score === "green" ? "✓" : p.score === "amber" ? "~" : "✗"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {subTab === "treatment" && (
              <div className="space-y-4 animate-in max-w-2xl">
                <div className="rounded-xl border border-zinc-200 p-4">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Recommended Protocol</p>
                  <p className="font-medium text-zinc-900">{active.treatment_history}</p>
                  <p className="text-xs text-[#0EA5A0] mt-2">{active.guideline_citation}</p>
                </div>
                {(aiText || aiLoading) && (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                    <p className="text-[10px] uppercase tracking-wider text-[#0EA5A0] mb-2">Oncopilot AI Rationale</p>
                    <p className="text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">
                      {aiLoading ? "Generating…" : aiText}
                    </p>
                  </div>
                )}
              </div>
            )}

            {subTab === "trials" && (
              <div className="animate-in space-y-3 max-w-xl">
                <div className="rounded-xl border border-zinc-200 p-4 flex gap-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm text-zinc-900">LAURA Trial Maintenance Vector</p>
                    <p className="text-xs text-zinc-500 mt-1">NCT03521154 · Eligibility thresholds met for {patient.genomics?.driver_mutation as string}</p>
                  </div>
                </div>
              </div>
            )}

            {subTab === "prognosis" && (
              <div className="animate-in space-y-6 max-w-2xl">
                <div className="rounded-xl border border-zinc-200 p-5">
                  <div className="flex justify-between text-sm mb-3">
                    <span className="text-zinc-600">Survival spectrum (matched cohort)</span>
                    <span className="font-semibold text-[#0EA5A0]">Median OS: {os} mo</span>
                  </div>
                  <div className="h-2 bg-zinc-100 rounded-full relative overflow-hidden">
                    <div
                      className="absolute h-full bg-[#0EA5A0]/60 rounded-full"
                      style={{ left: "20%", width: "55%" }}
                    />
                    <div className="absolute w-0.5 h-4 bg-[#0EA5A0] top-1/2 -translate-y-1/2" style={{ left: "45%" }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-400 mt-2">
                    <span>0</span><span>6 mo</span><span>12 mo</span><span>18 mo</span><span>24 mo</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-4">
                    Reference case <strong>{active.patient_id}</strong>: PFS <strong>{pfs} mo</strong>, response{" "}
                    <strong>{resp}</strong>.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["Target Median OS", `${os} mo`],
                    ["PFS Benchmark", `${pfs} mo`],
                    ["Historical Response", resp],
                    ["Match Score", `${active.similarity_score}%`],
                  ].map(([l, v]) => (
                    <div key={l} className="rounded-lg border border-zinc-200 p-3">
                      <p className="text-[10px] text-zinc-400 uppercase">{l}</p>
                      <p className="text-lg font-semibold text-zinc-900 mt-1">{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
