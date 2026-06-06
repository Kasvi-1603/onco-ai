"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { listDemoUsers } from "@/lib/api";
import type { DemoUser } from "@/lib/types";
import Lungs3DModel from "@/components/view1/Lungs3DModel";
import PatientFileUpload, { runDemoPatientLoad } from "@/components/doctor/PatientFileUpload";
import PipelineProgress, { PipelineStep } from "@/components/shared/PipelineProgress";

export default function DoctorHomePage() {
  const router = useRouter();
  const [users, setUsers] = useState<DemoUser[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [demoPipeline, setDemoPipeline] = useState<PipelineStep | null>(null);

  useEffect(() => {
    listDemoUsers().then(setUsers).catch(() => setUsers([]));
  }, []);

  const openSession = async (sessionId: string) => {
    setLoading(sessionId);
    setError("");
    setDemoPipeline("ingest");
    try {
      await runDemoPatientLoad(sessionId, setDemoPipeline, (id) => {
        router.push(`/doctor/${id}/similarity`);
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load patient");
      setDemoPipeline(null);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-zinc-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900" style={{ fontFamily: "Syne" }}>
            OncoPilot Workstation
          </h1>
          <p className="text-sm text-zinc-500">Upload or select a patient to begin TCGA matching</p>
        </div>
        <button
          onClick={() => router.push("/login")}
          className="text-sm text-zinc-500 hover:text-zinc-800"
        >
          Log out
        </button>
      </header>

      <div className="max-w-6xl mx-auto p-6 grid lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 mb-2" style={{ fontFamily: "Syne" }}>
              Find Similar Cancer Cases
            </h2>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Upload a patient EHR JSON or pick a demo case. The engine matches against 100 real TCGA-LUAD
              cases and surfaces treatment, trial, and prognosis insights.
            </p>
          </div>

          {demoPipeline ? (
            <PipelineProgress step={demoPipeline} />
          ) : (
            <>
              <PatientFileUpload />

              <div className="rounded-xl border border-zinc-200 p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-semibold text-zinc-800">Demo Patients</h3>
                <p className="text-[11px] text-zinc-500">
                  Same IDs as patient portal login (2, 3, 4, 5). After review, use{" "}
                  <strong>Approve &amp; Share</strong> — patient logs in with that ID.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {users.map((u) => (
                    <button
                      key={u.user_id}
                      disabled={!!loading}
                      onClick={() => openSession(u.session_id)}
                      className="rounded-lg border border-zinc-200 px-4 py-3 text-left hover:border-[#0EA5A0] hover:bg-[#ecfdf9] transition-colors disabled:opacity-50"
                    >
                      <span className="text-lg font-bold text-[#0EA5A0]">{u.user_id}</span>
                      <p className="text-xs text-zinc-500 mt-0.5">{u.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {error && (
            <p className="text-sm text-red-600 rounded-lg bg-red-50 p-3 border border-red-100">{error}</p>
          )}
        </div>

        <div>
          <Lungs3DModel />
        </div>
      </div>
    </div>
  );
}
