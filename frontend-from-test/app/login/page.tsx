"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Role = "doctor" | "patient" | null;

// Animated floating particle for the background
function Particle({ style }: { style: React.CSSProperties }) {
  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={style}
    />
  );
}

const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  size: Math.random() * 4 + 1,
  x: Math.random() * 100,
  y: Math.random() * 100,
  duration: Math.random() * 12 + 8,
  delay: Math.random() * 6,
  opacity: Math.random() * 0.25 + 0.05,
  color: i % 3 === 0 ? "#38bdf8" : i % 3 === 1 ? "#a78bfa" : "#34d399",
}));

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>(null);
  const [step, setStep] = useState<"select" | "form">("select");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRoleSelect = (r: Role) => {
    setRole(r);
    setStep("form");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate auth delay then navigate
    await new Promise((res) => setTimeout(res, 1400));
    if (role) {
      localStorage.setItem("role", role);
    }
    if (role === "doctor") {
      router.push("/");
    } else {
      router.push("/patient");
    }
  };

  const doctorConfig = {
    label: "Physician Portal",
    sublabel: "Oncologist / Clinician",
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
        <circle cx="20" cy="12" r="7" stroke="#38bdf8" strokeWidth="2" fill="none" />
        <path d="M6 36c0-7.732 6.268-14 14-14s14 6.268 14 14" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M24 26v5M21.5 28.5h5" stroke="#34d399" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    gradient: "linear-gradient(135deg, #0f2d56 0%, #1a4480 50%, #0e3a6e 100%)",
    accent: "#38bdf8",
    accentBg: "rgba(56,189,248,0.12)",
    accentBorder: "rgba(56,189,248,0.3)",
    glow: "rgba(56,189,248,0.25)",
    tag: "MDT Workstation",
    tagColor: "#38bdf8",
    features: ["NGS Report Analysis", "Trial Matching Engine", "MDT Briefing Generation"],
  };

  const patientConfig = {
    label: "Patient Portal",
    sublabel: "Personal Health Dashboard",
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
        <path d="M20 6C13.373 6 8 11.373 8 18c0 9 12 20 12 20s12-11 12-20c0-6.627-5.373-12-12-12z" stroke="#34d399" strokeWidth="2" fill="none" />
        <path d="M16 18h8M20 14v8" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    gradient: "linear-gradient(135deg, #0d2f23 0%, #0f3d2e 50%, #082b1f 100%)",
    accent: "#34d399",
    accentBg: "rgba(52,211,153,0.12)",
    accentBorder: "rgba(52,211,153,0.3)",
    glow: "rgba(52,211,153,0.25)",
    tag: "Personal Health",
    tagColor: "#34d399",
    features: ["Treatment Plan Summary", "Clinical Report Access", "Appointment Timeline"],
  };

  const config = role === "doctor" ? doctorConfig : patientConfig;

  return (
    <div
      className="min-h-screen flex flex-col overflow-hidden relative"
      style={{ background: "linear-gradient(145deg, #060e1c 0%, #091225 40%, #0a1a2e 100%)" }}
    >
      {/* Animated CSS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        @keyframes floatUp {
          0% { transform: translateY(0px) scale(1); opacity: var(--op); }
          50% { transform: translateY(-30px) scale(1.1); opacity: calc(var(--op) * 1.5); }
          100% { transform: translateY(0px) scale(1); opacity: var(--op); }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 40px 8px var(--glow); }
          50% { box-shadow: 0 0 80px 20px var(--glow); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.93); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideLeft {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .fade-up { animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) forwards; }
        .scale-in { animation: scaleIn 0.4s cubic-bezier(0.16,1,0.3,1) forwards; }
        .slide-left { animation: slideLeft 0.45s cubic-bezier(0.16,1,0.3,1) forwards; }
        .role-card {
          transition: transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s ease;
        }
        .role-card:hover {
          transform: translateY(-6px) scale(1.02);
        }
        .shimmer-text {
          background: linear-gradient(90deg, #38bdf8 0%, #a78bfa 40%, #34d399 70%, #38bdf8 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }
        .input-field:focus {
          outline: none;
          border-color: var(--accent-color) !important;
          box-shadow: 0 0 0 3px var(--accent-glow) !important;
        }
        .login-btn {
          transition: all 0.25s ease;
          position: relative;
          overflow: hidden;
        }
        .login-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(255,255,255,0.1);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .login-btn:hover::after { opacity: 1; }
        .login-btn:active { transform: scale(0.98); }
      `}</style>

      {/* Background particles */}
      {mounted && PARTICLES.map((p) => (
        <Particle
          key={p.id}
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            background: p.color,
            opacity: p.opacity,
            ["--op" as string]: p.opacity,
            animation: `floatUp ${p.duration}s ${p.delay}s ease-in-out infinite`,
          }}
        />
      ))}

      {/* Ambient glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(56,189,248,0.06) 0%, transparent 70%)" }} />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(167,139,250,0.07) 0%, transparent 70%)" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(52,211,153,0.04) 0%, transparent 70%)" }} />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1a4480, #2563a8)" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2L13 5V11L8 14L3 11V5L8 2Z" fill="white" fillOpacity="0.95" />
              <circle cx="8" cy="8" r="2" fill="white" />
            </svg>
          </div>
          <span className="font-bold text-white text-sm tracking-wide">OncoPilot</span>
          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded border" style={{ color: "#38bdf8", borderColor: "rgba(56,189,248,0.3)", background: "rgba(56,189,248,0.08)" }}>
            CLINICAL AI
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-xs font-semibold text-emerald-400">Secure Gateway</span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 relative z-10">

        {step === "select" && (
          <div className="w-full max-w-3xl fade-up">
            {/* Hero text */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-6" style={{ background: "rgba(56,189,248,0.08)", borderColor: "rgba(56,189,248,0.2)" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">Precision Oncology Platform</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-3">
                Welcome to{" "}
                <span className="shimmer-text">OncoPilot</span>
              </h1>
              <p className="text-white/50 text-sm max-w-md mx-auto leading-relaxed">
                Select your role to access your personalized clinical intelligence workspace
              </p>
            </div>

            {/* Role Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Doctor Card */}
              <button
                onClick={() => handleRoleSelect("doctor")}
                className="role-card text-left rounded-2xl p-7 border cursor-pointer group relative overflow-hidden"
                style={{
                  background: "linear-gradient(145deg, rgba(15,45,86,0.7) 0%, rgba(26,68,128,0.5) 100%)",
                  borderColor: "rgba(56,189,248,0.2)",
                  backdropFilter: "blur(20px)",
                  boxShadow: "0 8px 32px rgba(56,189,248,0.1), inset 0 1px 0 rgba(255,255,255,0.05)",
                }}
              >
                {/* Corner accent */}
                <div className="absolute top-0 right-0 w-24 h-24 opacity-10" style={{ background: "radial-gradient(circle at top right, #38bdf8, transparent)" }} />

                <div className="flex items-start justify-between mb-5">
                  <div className="p-3 rounded-xl border" style={{ background: "rgba(56,189,248,0.1)", borderColor: "rgba(56,189,248,0.25)" }}>
                    {doctorConfig.icon}
                  </div>
                  <span className="text-[9px] font-bold font-mono px-2.5 py-1 rounded-full border" style={{ color: "#38bdf8", borderColor: "rgba(56,189,248,0.3)", background: "rgba(56,189,248,0.1)" }}>
                    MDT WORKSTATION
                  </span>
                </div>

                <h2 className="text-xl font-black text-white mb-1">{doctorConfig.label}</h2>
                <p className="text-xs text-white/50 font-medium mb-5">{doctorConfig.sublabel}</p>

                <div className="space-y-2">
                  {doctorConfig.features.map((f) => (
                    <div key={f} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#38bdf8" }}></span>
                      <span className="text-[11px] text-white/60 font-medium">{f}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex items-center gap-2 text-sky-400 font-bold text-xs group-hover:gap-3 transition-all">
                  <span>Access Physician Portal</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </button>

              {/* Patient Card */}
              <button
                onClick={() => handleRoleSelect("patient")}
                className="role-card text-left rounded-2xl p-7 border cursor-pointer group relative overflow-hidden"
                style={{
                  background: "linear-gradient(145deg, rgba(13,47,35,0.7) 0%, rgba(15,61,46,0.5) 100%)",
                  borderColor: "rgba(52,211,153,0.2)",
                  backdropFilter: "blur(20px)",
                  boxShadow: "0 8px 32px rgba(52,211,153,0.1), inset 0 1px 0 rgba(255,255,255,0.05)",
                }}
              >
                {/* Corner accent */}
                <div className="absolute top-0 right-0 w-24 h-24 opacity-10" style={{ background: "radial-gradient(circle at top right, #34d399, transparent)" }} />

                <div className="flex items-start justify-between mb-5">
                  <div className="p-3 rounded-xl border" style={{ background: "rgba(52,211,153,0.1)", borderColor: "rgba(52,211,153,0.25)" }}>
                    {patientConfig.icon}
                  </div>
                  <span className="text-[9px] font-bold font-mono px-2.5 py-1 rounded-full border" style={{ color: "#34d399", borderColor: "rgba(52,211,153,0.3)", background: "rgba(52,211,153,0.1)" }}>
                    PERSONAL HEALTH
                  </span>
                </div>

                <h2 className="text-xl font-black text-white mb-1">{patientConfig.label}</h2>
                <p className="text-xs text-white/50 font-medium mb-5">{patientConfig.sublabel}</p>

                <div className="space-y-2">
                  {patientConfig.features.map((f) => (
                    <div key={f} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#34d399" }}></span>
                      <span className="text-[11px] text-white/60 font-medium">{f}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex items-center gap-2 text-emerald-400 font-bold text-xs group-hover:gap-3 transition-all">
                  <span>Access Patient Portal</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </button>
            </div>

            {/* Footer note */}
            <p className="text-center text-white/25 text-[10px] mt-8 font-mono">
              HIPAA COMPLIANT · ISO 27001 · END-TO-END ENCRYPTED · FOR CLINICAL USE ONLY
            </p>
          </div>
        )}

        {step === "form" && role && (
          <div className="w-full max-w-md slide-left">
            {/* Back button */}
            <button
              onClick={() => { setStep("select"); setRole(null); setEmail(""); setPassword(""); }}
              className="flex items-center gap-2 text-white/40 hover:text-white/80 text-xs font-bold mb-8 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Role Selection
            </button>

            {/* Card */}
            <div
              className="rounded-2xl border p-8 relative overflow-hidden"
              style={{
                background: role === "doctor"
                  ? "linear-gradient(145deg, rgba(15,45,86,0.85) 0%, rgba(26,68,128,0.6) 100%)"
                  : "linear-gradient(145deg, rgba(13,47,35,0.85) 0%, rgba(15,61,46,0.6) 100%)",
                borderColor: role === "doctor" ? "rgba(56,189,248,0.25)" : "rgba(52,211,153,0.25)",
                backdropFilter: "blur(24px)",
                boxShadow: role === "doctor"
                  ? "0 24px 64px rgba(56,189,248,0.12), inset 0 1px 0 rgba(255,255,255,0.06)"
                  : "0 24px 64px rgba(52,211,153,0.12), inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
            >
              {/* Top glow bar */}
              <div
                className="absolute top-0 left-0 right-0 h-0.5"
                style={{ background: role === "doctor" ? "linear-gradient(90deg, transparent, #38bdf8, transparent)" : "linear-gradient(90deg, transparent, #34d399, transparent)" }}
              />

              {/* Header */}
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 rounded-xl border" style={{
                  background: role === "doctor" ? "rgba(56,189,248,0.12)" : "rgba(52,211,153,0.12)",
                  borderColor: role === "doctor" ? "rgba(56,189,248,0.25)" : "rgba(52,211,153,0.25)",
                }}>
                  {config.icon}
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">{config.label}</h2>
                  <p className="text-xs text-white/45 font-medium">{config.sublabel}</p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                    {role === "doctor" ? "Clinician ID / Email" : "Patient Email"}
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={role === "doctor" ? "dr.name@hospital.org" : "patient@email.com"}
                    className="input-field w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 transition-all"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      ["--accent-color" as string]: role === "doctor" ? "#38bdf8" : "#34d399",
                      ["--accent-glow" as string]: role === "doctor" ? "rgba(56,189,248,0.15)" : "rgba(52,211,153,0.15)",
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="input-field w-full px-4 py-3 pr-11 rounded-xl text-sm text-white placeholder-white/25 transition-all"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        ["--accent-color" as string]: role === "doctor" ? "#38bdf8" : "#34d399",
                        ["--accent-glow" as string]: role === "doctor" ? "rgba(56,189,248,0.15)" : "rgba(52,211,153,0.15)",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    >
                      {showPass ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-3.5 h-3.5 rounded accent-sky-400" />
                    <span className="text-[11px] text-white/40">Remember this device</span>
                  </label>
                  <button type="button" className="text-[11px] font-semibold hover:underline" style={{ color: role === "doctor" ? "#38bdf8" : "#34d399" }}>
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="login-btn w-full py-3.5 rounded-xl text-sm font-bold text-white mt-2 flex items-center justify-center gap-2"
                  style={{
                    background: role === "doctor"
                      ? "linear-gradient(90deg, #1a4480 0%, #2563a8 50%, #1d4ed8 100%)"
                      : "linear-gradient(90deg, #065f46 0%, #059669 50%, #047857 100%)",
                    boxShadow: role === "doctor" ? "0 4px 20px rgba(37,99,168,0.4)" : "0 4px 20px rgba(5,150,105,0.4)",
                  }}
                >
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Authenticating...
                    </>
                  ) : (
                    <>
                      {role === "doctor" ? "Enter Physician Workstation" : "Access Patient Portal"}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>
              </form>

              {/* Security badge */}
              <div className="mt-6 flex items-center justify-center gap-2 text-white/25 text-[10px] font-mono">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                AES-256 · TLS 1.3 · HIPAA Compliant
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom footer */}
      <footer className="relative z-10 text-center py-4">
        <p className="text-white/15 text-[10px] font-mono uppercase tracking-widest">
          OncoPilot Clinical AI © 2025 · For Authorized Use Only
        </p>
      </footer>
    </div>
  );
}
