"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { uploadFiles, startAnalyze, getPipelineStatus, listCases, createDemoSession } from "../lib/api";
import { LogOut } from "lucide-react";
import { CaseSummary, PipelineStatus } from "../lib/types";
import PipelineProgress from "../components/shared/PipelineProgress";
import ErrorState from "../components/shared/ErrorState";

export default function LandingPage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [symptoms, setSymptoms] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState("egfr-exon19");

  useEffect(() => {
    listCases()
      .then(setCases)
      .catch((err) => console.error("Failed to load preset cases", err));
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    let intervalId: NodeJS.Timeout;
    const poll = async () => {
      try {
        const status = await getPipelineStatus(sessionId);
        setPipelineStatus(status);
        if (status.status === "ready" || status.status === "shared" || status.status === "reviewed") {
          clearInterval(intervalId);
          router.push(`/dashboard/${sessionId}`);
        } else if (status.status === "failed") {
          clearInterval(intervalId);
          setError(status.error || "Clinical analysis pipeline failed. Please try again.");
          setIsUploading(false);
        }
      } catch (err) {
        console.error("Polling status error", err);
      }
    };
    poll();
    intervalId = setInterval(poll, 2000);
    return () => clearInterval(intervalId);
  }, [sessionId, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(Array.from(e.target.files));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter((f) =>
      /\.(txt|md|json)$/i.test(f.name)
    );
    if (dropped.length > 0) setFiles((prev) => [...prev, ...dropped]);
  };

  const handleUploadAndAnalyze = async (e: React.FormEvent, useDemo = false) => {
    e.preventDefault();
    if (!useDemo && files.length === 0) return;
    setIsUploading(true);
    setError(null);
    try {
      const upload = useDemo
        ? await createDemoSession(selectedCaseId)
        : await uploadFiles(files);
      setSessionId(upload.session_id);
      await startAnalyze(upload.session_id);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to initiate clinical processing. Make sure the backend server is running.");
      setIsUploading(false);
    }
  };

  const resetState = () => {
    setFiles([]);
    setSymptoms("");
    setIsUploading(false);
    setSessionId(null);
    setPipelineStatus(null);
    setError(null);
  };

  return (
    <div className="flex-grow flex flex-col min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left panel — branding */}
        <div className="lg:w-2/5 flex flex-col justify-between p-12 text-white" style={{ background: 'linear-gradient(145deg, #091e3a 0%, #102a43 50%, #243b53 100%)' }}>
          <div>
            <div className="flex items-center gap-3 mb-12">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/10 border border-white/20 shadow-sm">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2L16 5.5V12.5L10 16L4 12.5V5.5L10 2Z" fill="white" fillOpacity="0.9" />
                  <circle cx="10" cy="9" r="2.5" fill="white" />
                </svg>
              </div>
              <div>
                <div className="font-extrabold text-white text-lg leading-none tracking-wider">ONCOPILOT</div>
                <div className="text-[10px] text-white/60 font-mono tracking-widest mt-0.5">PRECISION WORKSTATION</div>
              </div>
            </div>

            <h1 className="text-3xl font-bold text-white leading-tight mb-4">
              Precision Oncology<br />Mission Control
            </h1>
            <p className="text-white/70 text-sm leading-relaxed max-w-sm">
              An institutional-grade RAG platform mapping pathology documents, sequencing assays, and clinical reports to active matches and outcome intelligence.
            </p>

            <div className="mt-10 space-y-5">
              {[
                { icon: "🧬", label: "Automated NGS Extraction", desc: "Extract assays, histology subtypes, tumor size, and margins from documents", color: "#38bdf8" },
                { icon: "🔬", label: "Clinical Trial Matching Engine", desc: "Compare extraction profiles with recruitment cohorts & eligibility criteria", color: "#34d399" },
                { icon: "📊", label: "Cohort Outcome Intelligence", desc: "Render progression statistics based on historical treatment matches", color: "#a78bfa" },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-4">
                  <span className="text-xl shrink-0 p-2.5 rounded-lg bg-white/5 border border-white/10 shadow-sm" style={{ color: item.color }}>{item.icon}</span>
                  <div>
                    <div className="text-sm font-bold text-white/90">{item.label}</div>
                    <div className="text-xs text-white/60 mt-0.5 leading-relaxed">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Visual */}
          <div className="mt-8 rounded-xl overflow-hidden border border-white/10 shadow-xl relative" style={{ height: '220px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/hero-visual.png"
              alt="AI Oncology visualization — DNA, lungs and genomic data"
              className="w-full h-full object-cover object-center"
              style={{ filter: 'brightness(0.9) saturate(1.2)' }}
            />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(9,30,58,0.85) 0%, transparent 60%)' }} />
            <div className="absolute bottom-3 left-4 right-4">
              <p className="text-[9px] font-mono font-bold uppercase tracking-widest text-white/60">
                🔬 Genomic · Anatomical · Clinical Intelligence
              </p>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 mt-8">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span className="text-[10px] font-extrabold tracking-wider text-amber-300 font-mono uppercase">CLINICIAN DIAGNOSTIC USE ONLY</span>
            </div>
            <p className="text-white/50 text-[11px] leading-relaxed">
              For physician decision support. All AI evaluations must be validated against official lab records.
            </p>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="flex-grow flex flex-col justify-center p-8 lg:p-16 relative">
          <div className="absolute top-6 right-8">
            <button
              onClick={() => {
                localStorage.removeItem("role");
                router.push("/login");
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 transition-all cursor-pointer active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
          <div className="w-full max-w-md mx-auto space-y-6">
            <div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--navy)' }}>Create New Clinical Session</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Upload primary clinical reports to begin processing</p>
            </div>

            {error && (
              <ErrorState title="Analysis Failure" message={error} onRetry={resetState} />
            )}

            {!isUploading && !error && (
              <form onSubmit={(e) => handleUploadAndAnalyze(e, false)} className="space-y-5">
                {/* File upload */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Primary Medical Records
                  </label>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className="relative rounded-lg p-8 text-center transition-all cursor-pointer shadow-sm"
                    style={{
                      border: `2px dashed ${isDragging ? 'var(--navy-light)' : 'var(--border)'}`,
                      background: isDragging ? 'var(--navy-muted)' : 'var(--surface)',
                    }}
                  >
                    <input
                      type="file"
                      multiple
                      accept=".txt,.md,.json"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="space-y-2">
                      <div className="mx-auto w-11 h-11 rounded-lg flex items-center justify-center" style={{ background: 'var(--navy-muted)' }}>
                        <svg className="w-6 h-6" style={{ color: 'var(--navy-light)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>
                          {files.length > 0 ? `${files.length} file${files.length > 1 ? 's' : ''} selected` : 'Drag & drop reports, or click to browse'}
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          Supports pathology reports (.txt), markdown notes (.md), or structured case JSON
                        </p>
                      </div>
                    </div>
                  </div>

                  {files.length > 0 && (
                    <div className="rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                      {files.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between px-3.5 py-2.5 border-b last:border-b-0" style={{ borderColor: 'var(--border-subtle)' }}>
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" style={{ color: 'var(--navy-light)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-xs font-semibold truncate max-w-[210px]" style={{ color: 'var(--text-secondary)' }}>{file.name}</span>
                          </div>
                          <span className="text-xs font-mono font-bold" style={{ color: 'var(--text-subtle)' }}>{Math.round(file.size / 1024)} KB</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Symptoms */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Secondary Context / Notes <span className="normal-case font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg px-3.5 py-2.5 text-sm resize-none focus:outline-none transition-all shadow-3xs"
                    style={{
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                      color: 'var(--text-secondary)',
                    }}
                    placeholder="Enter self-reported symptoms, prior treatments, or clinical history..."
                    onFocus={(e) => (e.target.style.borderColor = 'var(--navy-light)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                  />
                </div>

                {/* Preset demo cases */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Safe Demo Case
                  </label>
                  <select
                    value={selectedCaseId}
                    onChange={(e) => setSelectedCaseId(e.target.value)}
                    className="w-full rounded-lg px-3.5 py-2.5 text-sm focus:outline-none transition-all shadow-3xs"
                    style={{
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {(cases.length ? cases : [{ case_id: "egfr-exon19", label: "Case 1: EGFR Exon 19" }]).map((c) => (
                      <option key={c.case_id} value={c.case_id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={files.length === 0}
                    className="flex-grow py-3 rounded-lg text-xs font-bold tracking-wider uppercase transition-all shadow-sm active:scale-[0.98]"
                    style={{
                      background: files.length > 0 ? 'var(--navy)' : 'var(--border)',
                      color: files.length > 0 ? 'white' : 'var(--text-muted)',
                      cursor: files.length > 0 ? 'pointer' : 'not-allowed',
                    }}
                  >
                    Initiate Pipeline
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleUploadAndAnalyze(e, true)}
                    className="px-4 py-3 rounded-lg text-xs font-bold tracking-wider uppercase border transition-all cursor-pointer active:scale-[0.98]"
                    style={{
                      borderColor: 'var(--border)',
                      background: 'var(--surface)',
                      color: 'var(--navy-light)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--navy-muted)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface)')}
                  >
                    Run Demo Case
                  </button>
                </div>

                <div className="flex items-start gap-2.5 p-3.5 rounded-lg border" style={{ background: 'var(--clinical-amber-bg)', borderColor: 'var(--clinical-amber-border)' }}>
                  <svg className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--clinical-amber)' }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-xs font-medium" style={{ color: 'var(--clinical-amber)' }}>
                    Regulatory Notice: All extracted metrics require clinician validation before therapy recommendation.
                  </p>
                </div>
              </form>
            )}

            {isUploading && !error && pipelineStatus && (
              <div className="space-y-4">
                <PipelineProgress status={pipelineStatus} />
                <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                  Running medical record extraction engine. This process takes 10–15 seconds...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
