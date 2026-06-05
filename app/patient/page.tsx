"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { uploadFiles, startAnalyze, approveSession } from "../../lib/api";
import PatientDashboard from "../../components/view2/PatientDashboard";
import { ShieldAlert, Loader2, Key } from "lucide-react";

export default function PatientPortalLanding() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [accessCode, setAccessCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoStatus, setDemoStatus] = useState<string | null>(null);

  // Check query params or local storage for session ID
  useEffect(() => {
    const urlSession = searchParams.get("session");
    const storedSession = localStorage.getItem("active_patient_session_id");

    if (urlSession) {
      localStorage.setItem("active_patient_session_id", urlSession);
      setSessionId(urlSession);
    } else if (storedSession) {
      setSessionId(storedSession);
    }
  }, [searchParams]);

  // Handle manual access code submission
  const handleSubmitCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) return;
    
    setError(null);
    const cleanedCode = accessCode.trim();
    localStorage.setItem("active_patient_session_id", cleanedCode);
    setSessionId(cleanedCode);
  };

  // Launch a fully automated approved demo session for patients
  const handleLoadDemo = async () => {
    setLoading(true);
    setError(null);
    try {
      setDemoStatus("Creating patient medical record shell...");
      const { session_id } = await uploadFiles([], "Demo patient with lung adenocarcinoma and EGFR mutation.", true);
      
      setDemoStatus("Running genomic & clinical trial matching engines...");
      await startAnalyze(session_id);
      
      // Wait a moment for pipeline to finish on mock backend (approx 10-12s)
      // Since it runs in FastAPI background tasks, we'll wait 12 seconds
      setDemoStatus("Securing doctor review & approval release...");
      await new Promise((resolve) => setTimeout(resolve, 12000));
      
      // Approve and share the session so the patient has permission to view it
      await approveSession(session_id);
      
      setDemoStatus("Unlocking patient care portal...");
      localStorage.setItem("active_patient_session_id", session_id);
      setSessionId(session_id);
    } catch (err: any) {
      console.error(err);
      setError("Failed to create demo patient session. Please ensure the backend server is running.");
    } finally {
      setLoading(false);
      setDemoStatus(null);
    }
  };

  // Render the dashboard if session is resolved
  if (sessionId) {
    return <PatientDashboard sessionId={sessionId} />;
  }

  return (
    <div 
      className="min-h-screen flex flex-col justify-between overflow-hidden relative"
      style={{ background: "linear-gradient(145deg, #022c22 0%, #064e3b 40%, #022c22 100%)" }}
    >
      {/* Glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(52,211,153,0.06) 0%, transparent 70%)" }} />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)" }} />

      {styleTag}

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/10 border border-white/20">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2L13 5V11L8 14L3 11V5L8 2Z" fill="white" fillOpacity="0.95" />
              <circle cx="8" cy="8" r="2" fill="white" />
            </svg>
          </div>
          <span className="font-bold text-white text-sm tracking-wide">OncoPilot</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-xs font-semibold text-emerald-400">Patient Gateway</span>
        </div>
      </header>

      {/* Access Form */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 relative z-10">
        <div className="w-full max-w-md bg-emerald-950/80 border border-emerald-800/60 rounded-2xl p-8 backdrop-blur-md shadow-2xl space-y-6">
          
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Key className="w-6 h-6 animate-pulse" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Access Your Patient Portal</h1>
            <p className="text-xs text-emerald-100/60 leading-relaxed max-w-xs mx-auto">
              Please enter the Access Code provided in your medical handout to view your approved care plan summary.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-lg border border-red-900 bg-red-950/40 text-red-300 text-xs font-medium flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!loading ? (
            <form onSubmit={handleSubmitCode} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-100/50">
                  Access Code
                </label>
                <input
                  type="text"
                  required
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="e.g. sess_abc123"
                  className="w-full px-4 py-3 rounded-xl text-sm bg-black/20 border border-emerald-800 text-white placeholder-emerald-100/25 focus:outline-none focus:border-emerald-400 transition-all text-center font-mono uppercase tracking-wider"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-emerald-700 hover:bg-emerald-600 transition-all shadow-sm active:scale-98 cursor-pointer"
              >
                Access My Records
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-emerald-800/40"></div>
                <span className="flex-shrink mx-4 text-[10px] text-emerald-100/30 uppercase tracking-widest font-bold">Or Explore</span>
                <div className="flex-grow border-t border-emerald-800/40"></div>
              </div>

              <button
                type="button"
                onClick={handleLoadDemo}
                className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider border border-emerald-700/60 bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-300 transition-all active:scale-98 cursor-pointer"
              >
                Load Demo Patient Account
              </button>
            </form>
          ) : (
            <div className="py-6 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              <p className="text-xs text-emerald-200/80 font-bold animate-pulse text-center">
                {demoStatus || "Processing Access Code..."}
              </p>
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6">
        <p className="text-emerald-100/20 text-[9px] font-mono uppercase tracking-widest leading-relaxed">
          OncoPilot Clinical AI © 2025 · ISO 27001 Secure Gateway · HIPAA Compliant
        </p>
      </footer>
    </div>
  );
}

// Add keyframe animation for the loader spin
const styleTag = (
  <style>{`
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `}</style>
);
