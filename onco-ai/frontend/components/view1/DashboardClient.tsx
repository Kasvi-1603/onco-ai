"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { approveSession, getDashboard } from "@/lib/api";
import type { SessionPayload } from "@/lib/types";
import { DashboardHeader } from "@/components/view1/DashboardHeader";
import { MolecularProfileGrid } from "@/components/view1/MolecularProfileGrid";
import { CaseComparisonTable } from "@/components/view1/CaseComparisonTable";
import { TrialMatchTable } from "@/components/view1/TrialMatchTable";
import { RiskFlagBanner } from "@/components/view1/RiskFlagBanner";
import { PrognosisBand } from "@/components/view1/PrognosisBand";
import { DocumentEditor } from "@/components/view1/DocumentEditor";
import { MDTBriefPanel } from "@/components/view1/MDTBriefPanel";

export default function DashboardClient({ sessionId }: { sessionId: string }) {
  const [data, setData] = useState<SessionPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"overview" | "cases" | "trials" | "documents">("overview");
  const [approving, setApproving] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await getDashboard(sessionId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard");
    }
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleApprove = async () => {
    setApproving(true);
    try {
      await approveSession(sessionId);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Approve failed");
    } finally {
      setApproving(false);
    }
  };

  if (error) {
    return (
      <main className="p-8">
        <p className="text-red-600">{error}</p>
        <Link href="/" className="mt-4 inline-block text-sm text-blue-600">
          ← Back to upload
        </Link>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center text-slate-500">
        Loading dashboard…
      </main>
    );
  }

  const tabs = [
    ["overview", "Overview"],
    ["cases", "Similar Cases"],
    ["trials", "Trials"],
    ["documents", "Documents"],
  ] as const;

  return (
    <main className="min-h-screen bg-slate-50">
      <DashboardHeader
        data={data}
        onApprove={handleApprove}
        approving={approving}
      />

      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="mb-4 flex gap-2 border-b border-slate-200">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`border-b-2 px-3 py-2 text-sm font-medium ${
                tab === id
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {label}
            </button>
          ))}
          <Link
            href={`/audit/${sessionId}`}
            className="ml-auto self-center text-xs text-slate-500 hover:text-slate-700"
          >
            Audit trail →
          </Link>
        </div>

        {tab === "overview" && (
          <div className="grid gap-4 lg:grid-cols-2">
            <MolecularProfileGrid profile={data.patient_profile} />
            <div className="space-y-4">
              <RiskFlagBanner flags={data.risk_flags} insights={data.agent2_insights} />
              <PrognosisBand stats={data.prognosis_stats} />
              <CaseComparisonTable cohorts={data.similar_cohorts.slice(0, 3)} compact />
            </div>
          </div>
        )}

        {tab === "cases" && (
          <CaseComparisonTable cohorts={data.similar_cohorts} />
        )}

        {tab === "trials" && (
          <TrialMatchTable trials={data.trial_matches} />
        )}

        {tab === "documents" && (
          <div className="grid gap-4 lg:grid-cols-2">
            <DocumentEditor title="Treatment Plan Draft" content={data.documents.treatment_plan} />
            <MDTBriefPanel content={data.documents.mdt_brief} />
            <div className="lg:col-span-2">
              <DocumentEditor title="Trial Eligibility Report" content={data.documents.trial_report} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
