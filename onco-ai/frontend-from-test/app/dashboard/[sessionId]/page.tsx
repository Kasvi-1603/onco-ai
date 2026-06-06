"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Activity, Users, BarChart3, FileEdit, ChevronRight, AlertTriangle, LogOut } from "lucide-react";
import { useDashboard, usePipelineStatus } from "../../../lib/api";
import DashboardHeader from "../../../components/view1/DashboardHeader";
import RiskFlagBanner from "../../../components/view1/RiskFlagBanner";
import MolecularProfileGrid from "../../../components/view1/MolecularProfileGrid";
import CaseComparisonTable from "../../../components/view1/CaseComparisonTable";
import TrialMatchTable from "../../../components/view1/TrialMatchTable";
import PrognosisBand from "../../../components/view1/PrognosisBand";
import DocumentEditor from "../../../components/view1/DocumentEditor";
import ApproveShareButton from "../../../components/view1/ApproveShareButton";
import Lungs3DModel from "../../../components/view1/Lungs3DModel";
import KaplanMeierCurve from "../../../components/view1/KaplanMeierCurve";
import OutcomesChart from "../../../components/view1/OutcomesChart";
import DraftBanner from "../../../components/shared/DraftBanner";
import PipelineProgress from "../../../components/shared/PipelineProgress";
import ErrorState from "../../../components/shared/ErrorState";

type TabId = "profile" | "cohorts" | "trials" | "editor";

const LoadingSpinner = ({ message }: { message: string }) => (
  <div className="flex-1 flex items-center justify-center p-6" style={{ background: 'var(--background)' }}>
    <div className="text-center space-y-3">
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mx-auto" style={{ borderColor: 'var(--navy)', borderTopColor: 'transparent' }}></div>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{message}</p>
    </div>
  </div>
);

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  const { data: payload, isLoading, isError, refetch } = useDashboard(sessionId);
  const statusStr = payload?.status;
  const isRunning = statusStr === "uploaded" || statusStr === "processing";
  const { data: pollData } = usePipelineStatus(sessionId, isRunning);

  useEffect(() => {
    if (pollData?.status === "ready" || pollData?.status === "shared" || pollData?.status === "reviewed") {
      refetch();
    }
  }, [pollData, refetch]);

  if (isLoading) return <LoadingSpinner message="Loading clinical session..." />;

  if (isError || !payload) {
    if (isRunning && pollData) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8" style={{ background: 'var(--background)' }}>
          <div className="w-full max-w-md space-y-4">
            <PipelineProgress status={pollData} />
            <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
              Dashboard will load automatically once extraction completes.
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className="flex-1 flex items-center justify-center p-6" style={{ background: 'var(--background)' }}>
        <ErrorState
          title="Session Not Found"
          message={`Session "${sessionId}" does not exist or extraction failed.`}
          onRetry={() => router.push("/")}
        />
      </div>
    );
  }

  if (isRunning) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8" style={{ background: 'var(--background)' }}>
        <div className="w-full max-w-md space-y-4">
          {pollData ? (
            <PipelineProgress status={pollData} />
          ) : (
            <LoadingSpinner message="Connecting to analysis pipeline..." />
          )}
        </div>
      </div>
    );
  }

  const navItems = [
    { id: "profile", label: "Clinical Profile", icon: Activity },
    { id: "cohorts", label: "Cohort Comparison", icon: Users },
    { id: "trials", label: "Trials & Prognosis", icon: BarChart3 },
    { id: "editor", label: "Document Editor", icon: FileEdit },
  ] as const;

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden" style={{ background: 'var(--background)' }}>
      {/* Draft safety banner */}
      {payload.status !== "shared" && <DraftBanner />}

      {/* Top application bar */}
      <header className="shrink-0 flex items-center gap-4 px-4 h-12" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-sm font-semibold hover:opacity-70 transition-opacity"
          style={{ color: 'var(--navy)' }}
        >
          <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: 'var(--navy)' }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M8 2L13 5V11L8 14L3 11V5L8 2Z" fill="white" fillOpacity="0.9" />
              <circle cx="8" cy="8" r="2" fill="white" />
            </svg>
          </div>
          OncoPilot
        </button>
        <ChevronRight className="w-3.5 h-3.5" style={{ color: 'var(--text-subtle)' }} />
        <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Oncologist Workstation</span>
        <ChevronRight className="w-3.5 h-3.5" style={{ color: 'var(--text-subtle)' }} />
        <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: 'var(--navy-muted)', color: 'var(--navy-light)' }}>
          #{sessionId.slice(0, 12)}
        </span>
        <div className="ml-auto flex items-center gap-3">
          {payload.status === "shared" ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--clinical-green)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              Approved & Shared
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--clinical-amber)' }}>
              <AlertTriangle className="w-3.5 h-3.5" />
              Draft — Pending Review
            </span>
          )}
          
          <div className="h-4 w-[1px] bg-gray-200 mx-1"></div>

          <button
            onClick={() => {
              localStorage.removeItem("role");
              router.push("/login");
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold text-red-600 border border-red-100 bg-red-50 hover:bg-red-100 transition-all cursor-pointer active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 hidden md:flex flex-col" style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}>
          <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-subtle)' }}>
              Workstation Modules
            </div>
          </div>
          <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-bold transition-all text-left cursor-pointer border-l-4"
                  style={{
                    background: isActive ? 'linear-gradient(90deg, var(--navy-muted) 0%, transparent 100%)' : 'transparent',
                    borderColor: isActive ? 'var(--navy-light)' : 'transparent',
                    color: isActive ? 'var(--navy)' : 'var(--text-muted)',
                  }}
                >
                  <Icon className="w-4 h-4 shrink-0" style={{ color: isActive ? 'var(--navy-light)' : 'var(--text-subtle)' }} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Session info */}
          <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="text-[9px] uppercase tracking-widest font-semibold mb-2" style={{ color: 'var(--text-subtle)' }}>Session Info</div>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Status</span>
                <span className="text-[10px] font-semibold capitalize" style={{ color: payload.status === 'shared' ? 'var(--clinical-green)' : 'var(--clinical-amber)' }}>
                  {payload.status}
                </span>
              </div>
              {payload.patient_profile?.clinical?.stage && (
                <div className="flex justify-between items-center">
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Stage</span>
                  <span className="text-[10px] font-semibold" style={{ color: 'var(--text-secondary)' }}>{payload.patient_profile.clinical.stage}</span>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Mobile nav */}
        <div className="md:hidden flex overflow-x-auto border-b shrink-0 px-2 py-1.5 gap-1" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded text-xs font-medium transition-all"
                style={{
                  background: isActive ? 'var(--navy-muted)' : 'transparent',
                  color: isActive ? 'var(--navy)' : 'var(--text-muted)',
                }}
              >
                <Icon className="w-3 h-3" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto" style={{ background: 'var(--background)' }}>
          <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-5">

            {/* TAB 1: Clinical Profile */}
            {activeTab === "profile" && (
              <div className="space-y-5 animate-in">
                <DashboardHeader payload={payload} />
                <RiskFlagBanner flags={payload.risk_flags} />

                {/* Approval gate */}
                <div className="flex items-center justify-between px-5 py-4 rounded-lg" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div>
                    <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Oncologist Approval Gate
                    </h4>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Review all sections, then release to the patient portal.
                    </p>
                  </div>
                  <ApproveShareButton
                    sessionId={sessionId}
                    initialStatus={payload.status}
                    approvedAt={payload.approved_at}
                    onApproveSuccess={() => refetch()}
                  />
                </div>

                {/* Visualizations + Profile grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  <div className="lg:col-span-5 flex flex-col gap-5 w-full">
                    <Lungs3DModel />
                    <div className="rounded-xl overflow-hidden shadow-sm flex flex-col" style={{ background: 'var(--surface)', border: '1px solid var(--border)', minHeight: '420px' }}>
                      {/* Header */}
                      <div className="p-4 z-10 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--navy)' }}>
                              <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse"></span>
                              Interactive DNA Helix
                            </h3>
                            <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>EGFR Exon 19 · Genomic Sequence Visualizer</p>
                          </div>
                        </div>
                      </div>
                      {/* Sketchfab iframe */}
                      <div className="flex-1 relative" style={{ background: '#090d16', minHeight: '360px' }}>
                        <iframe
                          title="DNA Double Helix"
                          className="absolute inset-0 w-full h-full border-none"
                          src="https://sketchfab.com/models/a908bbcd3eb04372b83b352e71b55836/embed?autostart=1&ui_theme=dark&transparent=1&preload=1"
                          loading="lazy"
                          allowFullScreen
                          allow="autoplay; fullscreen; xr-spatial-tracking; gyroscope; accelerometer"
                          sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
                        ></iframe>
                      </div>
                    </div>
                  </div>
                  <div className="lg:col-span-7">
                    <MolecularProfileGrid profile={payload.patient_profile} />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Cohort Comparison */}
            {activeTab === "cohorts" && (
              <div className="space-y-5 animate-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Historical Cohort Matching</h3>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Comparing patient profile against historical outcome datasets.</p>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-1 rounded" style={{ background: 'var(--navy-muted)', color: 'var(--navy-light)' }}>
                    {payload.similar_cohorts?.length ?? 0} matches
                  </span>
                </div>
                <KaplanMeierCurve />
                <CaseComparisonTable cohorts={payload.similar_cohorts} />
              </div>
            )}

            {/* TAB 3: Trials & Prognosis */}
            {activeTab === "trials" && (
              <div className="space-y-5 animate-in">
                <div>
                  <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Trials & Prognosis</h3>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Active matched trials and prognostic outcome estimates.</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                  <PrognosisBand stats={payload.prognosis_stats} />
                  <OutcomesChart />
                </div>
                <TrialMatchTable trials={payload.trial_matches} />
              </div>
            )}

            {/* TAB 4: Document Editor */}
            {activeTab === "editor" && (
              <div className="space-y-5 animate-in">
                <div>
                  <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Clinical Documentation</h3>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Review and modify AI-drafted clinical reports before release.</p>
                </div>
                <DocumentEditor
                  sessionId={sessionId}
                  initialDocuments={payload.documents}
                  sourceSnippets={payload.patient_profile.source_snippets}
                />
              </div>
            )}
          </div>

          <footer className="mt-8 py-4 text-center text-[10px] uppercase tracking-widest font-semibold" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-subtle)' }}>
            Draft Clinical Regimen — For Physician Review Only — Not an Active Prescription
          </footer>
        </main>
      </div>
    </div>
  );
}
