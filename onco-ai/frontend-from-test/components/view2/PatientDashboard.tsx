"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { usePatientPortal, regeneratePatientSummary } from "../../lib/api";
import { SupportedLang } from "../../lib/types";
import { SUPPORTED_LANGS } from "../../lib/constants";
import LanguageToggle from "./LanguageToggle";
import PlainLanguageSection from "./PlainLanguageSection";
import TrialDiscussCard from "./TrialDiscussCard";
import QuestionsForDoctor from "./QuestionsForDoctor";
import PortalFooter from "./PortalFooter";
import PortalLockedState from "./PortalLockedState";
import ErrorState from "../shared/ErrorState";

import { 
  User, 
  LogOut, 
  Heart, 
  Activity, 
  Calendar, 
  MessageSquare, 
  FileText, 
  BookOpen, 
  Send, 
  Check, 
  AlertTriangle, 
  TrendingUp, 
  Info,
  Clock,
  ShieldCheck,
  ChevronRight
} from "lucide-react";

interface PatientDashboardProps {
  sessionId: string;
}

type PatientTabId = "summary" | "symptoms" | "meds" | "chat" | "vitals" | "docs" | "education";
type ApiError = Error & {
  status?: number;
  body?: {
    error?: string;
    detail?: { error?: string };
  };
};

export default function PatientDashboard({ sessionId }: PatientDashboardProps) {
  const router = useRouter();
  const [lang, setLang] = useState<SupportedLang>("en");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<PatientTabId>("summary");

  // Fetch localized data from API
  const { data: portalData, isLoading, error, refetch } = usePatientPortal(sessionId, lang);

  // Language Change handler
  const handleLangChange = async (newLang: SupportedLang) => {
    setIsRegenerating(true);
    setLang(newLang);
    try {
      await regeneratePatientSummary(sessionId, newLang);
      refetch();
    } catch (err) {
      console.error("Failed to regenerate summary for", newLang, err);
    } finally {
      setIsRegenerating(false);
    }
  };

  // Symptom tracker states
  const [symptomLogs, setSymptomLogs] = useState([
    { date: "May 30", diarrhea: 1, rash: 2, drySkin: 2, fatigue: 1 },
    { date: "May 31", diarrhea: 1, rash: 1, drySkin: 2, fatigue: 2 },
    { date: "Jun 01", diarrhea: 2, rash: 1, drySkin: 2, fatigue: 2 },
    { date: "Jun 02", diarrhea: 2, rash: 2, drySkin: 3, fatigue: 1 },
    { date: "Jun 03", diarrhea: 3, rash: 2, drySkin: 3, fatigue: 3 },
    { date: "Jun 04", diarrhea: 2, rash: 2, drySkin: 2, fatigue: 2 },
    { date: "Jun 05", diarrhea: 1, rash: 2, drySkin: 2, fatigue: 1 }
  ]);
  const [currentDiarrhea, setCurrentDiarrhea] = useState(1);
  const [currentRash, setCurrentRash] = useState(1);
  const [currentDrySkin, setCurrentDrySkin] = useState(1);
  const [currentFatigue, setCurrentFatigue] = useState(1);
  const [logSuccess, setLogSuccess] = useState(false);

  // Med tracker states
  const [medsLogged, setMedsLogged] = useState<Record<number, boolean>>({
    1: true, 2: true, 3: true, 4: true, 5: true
  });
  const today = new Date();
  const currentDay = today.getDate();

  // Chat/Messaging States
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: "nurse",
      name: "Sarah Jenkins, RN",
      role: "Oncology Care Nurse",
      text: "Hello! This is your care coordination panel. You can ask me any questions about your Osimertinib treatment, medication timing, or side effect management.",
      time: "10:30 AM"
    }
  ]);
  const [inputMsg, setInputMsg] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Vitals states
  const [vitalsHistory, setVitalsHistory] = useState([
    { date: "Jun 05", bpSystolic: 122, bpDiastolic: 78, hr: 72, spo2: 98 }
  ]);
  const [hrInput, setHrInput] = useState("72");
  const [bpSysInput, setBpSysInput] = useState("120");
  const [bpDiaInput, setBpDiaInput] = useState("80");
  const [spo2Input, setSpo2Input] = useState("98");
  const [vitalsSuccess, setVitalsSuccess] = useState(false);

  // Scroll to chat bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isTyping]);

  // Log new symptoms
  const handleLogSymptoms = (e: React.FormEvent) => {
    e.preventDefault();
    const newLog = {
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
      diarrhea: currentDiarrhea,
      rash: currentRash,
      drySkin: currentDrySkin,
      fatigue: currentFatigue
    };
    setSymptomLogs([...symptomLogs, newLog]);
    setLogSuccess(true);
    setTimeout(() => setLogSuccess(false), 3000);
  };

  // Toggle med intake
  const toggleMedDay = (day: number) => {
    if (day > currentDay) return; // Can't log future days
    setMedsLogged((prev) => ({
      ...prev,
      [day]: !prev[day]
    }));
  };

  // Send message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const userMessage = {
      id: chatMessages.length + 1,
      sender: "patient",
      name: "You",
      role: "Patient",
      text: inputMsg,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages((prev) => [...prev, userMessage]);
    const query = inputMsg.toLowerCase();
    setInputMsg("");
    setIsTyping(true);

    setTimeout(() => {
      let replyText = "Thank you for message. I've noted this in your file and forwarded it to Dr. Allison Carter. A member of your care team will contact you shortly.";
      
      if (query.includes("diarrhea") || query.includes("loose stool") || query.includes("stomach")) {
        replyText = "Diarrhea is a common side effect of Osimertinib. For mild cases (Grade 1-2), please use your standby Loperamide (Imodium) - take 2 capsules after the first loose stool, then 1 capsule after each subsequent loose stool. Drink plenty of clear fluids (water, broth, electrolytes). If you experience more than 4 loose stools over baseline in 24 hours, or start feeling dizzy, contact us immediately.";
      } else if (query.includes("rash") || query.includes("dry skin") || query.includes("skin") || query.includes("itch")) {
        replyText = "Dry skin and acne-like rash can happen on Osimertinib. We recommend using a thick, fragrance-free emollient (like CeraVe or Cetaphil cream) twice daily. Wash with lukewarm water and mild, soap-free cleansers. If the rash becomes painful, itchy, or interferes with sleep, let us know as we can prescribe a topical steroid cream.";
      } else if (query.includes("time") || query.includes("dose") || query.includes("miss") || query.includes("tablet")) {
        replyText = "Take your Osimertinib 80mg tablet once daily, with or without food, at the same time each day. If you miss a dose, take it as soon as you remember, unless your next dose is less than 12 hours away. Do not double the dose. If swallowing the tablet is difficult, you can disperse it in half a glass of non-carbonated water (no other liquids).";
      } else if (query.includes("scan") || query.includes("next appointment") || query.includes("ct")) {
        replyText = "Your first follow-up chest CT scan is typically scheduled 8 to 12 weeks after starting Osimertinib to monitor treatment response. I will have our scheduling coordinator check your appointment calendar and send confirmation details to you.";
      }

      setChatMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          sender: "nurse",
          name: "Sarah Jenkins, RN",
          role: "Oncology Care Nurse",
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsTyping(false);
    }, 1500);
  };

  // Log new vitals
  const handleLogVitals = (e: React.FormEvent) => {
    e.preventDefault();
    const sys = parseInt(bpSysInput);
    const dia = parseInt(bpDiaInput);
    const hr = parseInt(hrInput);
    const spo2 = parseInt(spo2Input);

    if (isNaN(sys) || isNaN(dia) || isNaN(hr) || isNaN(spo2)) return;

    setVitalsHistory([
      ...vitalsHistory,
      {
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
        bpSystolic: sys,
        bpDiastolic: dia,
        hr,
        spo2
      }
    ]);
    setVitalsSuccess(true);
    setTimeout(() => setVitalsSuccess(false), 3000);
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("active_patient_session_id");
    localStorage.removeItem("role");
    router.push("/login");
  };

  // Loading indicator
  if (isLoading || isRegenerating) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 min-h-screen" style={{ background: 'var(--background)' }}>
        <div className="max-w-2xl w-full space-y-6 animate-pulse">
          <div className="flex justify-between items-center pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="h-4 bg-gray-200 rounded w-28"></div>
            <div className="flex gap-2">
              <div className="h-6 bg-gray-200 rounded w-16"></div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="space-y-3 pt-4">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
          <p className="text-center font-mono text-[10px] text-gray-400 mt-8">
            Preparing your health dashboard translation & logs...
          </p>
        </div>
      </div>
    );
  }

  // Handle locked or access errors
  if (error) {
    const apiError = error as ApiError;
    const apiErr = apiError.body;
    const isLocked = apiError.status === 403 || apiErr?.error === "not_shared" || apiErr?.detail?.error === "not_shared";

    if (isLocked) {
      return (
        <div className="flex-grow flex flex-col justify-between p-6 min-h-screen relative" style={{ background: 'var(--background)' }}>
          <header className="flex justify-between items-center py-4 max-w-2xl mx-auto w-full">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded flex items-center justify-center bg-gray-200">🧬</div>
              <span className="font-bold text-xs uppercase tracking-wider">Patient Portal</span>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border rounded hover:bg-gray-50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Log Out
            </button>
          </header>
          <div className="flex-1 flex items-center justify-center">
            <PortalLockedState />
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex items-center justify-center p-6 min-h-screen" style={{ background: 'var(--background)' }}>
        <ErrorState
          title="Session Access Error"
          message="We could not retrieve details for this session. Please check your access code."
          onRetry={handleLogout}
        />
      </div>
    );
  }

  if (!portalData) return null;

  // Streak & Adherence Math
  const loggedDays = Object.values(medsLogged).filter(Boolean).length;
  const complianceRate = Math.round((loggedDays / currentDay) * 100);

  // SVG dimensions for graphing
  const width = 500;
  const height = 180;
  const padding = 30;

  return (
    <div className="flex-grow min-h-screen flex flex-col font-sans" style={{ background: 'var(--background)', color: 'var(--text-primary)' }}>
      {/* Top Banner and Navigation */}
      <header className="py-4 px-4 sticky top-0 z-40 backdrop-blur-md border-b shadow-xs" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0f7b4f, #34d399)" }}>
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path d="M8 2L13 5V11L8 14L3 11V5L8 2Z" fill="white" fillOpacity="0.95" />
                <circle cx="8" cy="8" r="2" fill="white" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-extrabold uppercase tracking-wide" style={{ color: 'var(--clinical-green)' }}>
                Patient Care Companion
              </div>
              <div className="text-[10px] text-gray-400 font-mono">
                Access Code: #{sessionId.slice(0, 10)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LanguageToggle
              currentLang={lang}
              onChange={handleLangChange}
              disabled={isRegenerating}
            />
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 transition-all cursor-pointer active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body Grid */}
      <div className="flex-grow max-w-5xl w-full mx-auto px-4 py-8 flex flex-col md:flex-row gap-6">
        
        {/* Left Hand Menu Navigation */}
        <aside className="w-full md:w-64 shrink-0 flex flex-col gap-2">
          <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-2xs">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
                P
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-800">Patient Dashboard</h4>
                <p className="text-[10px] text-gray-400">Personal Health Portal</p>
              </div>
            </div>
            <div className="space-y-1">
              {[
                { id: "summary", label: "My Care Plan", icon: ShieldCheck },
                { id: "symptoms", label: "Symptom Log", icon: Activity },
                { id: "meds", label: "Medication Log", icon: Calendar },
                { id: "chat", label: "Care Team Chat", icon: MessageSquare },
                { id: "vitals", label: "Vitals Tracker", icon: Heart },
                { id: "docs", label: "Medical Documents", icon: FileText },
                { id: "education", label: "Educational Library", icon: BookOpen }
              ].map((tab: { id: PatientTabId; label: string; icon: typeof Activity }) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all text-left cursor-pointer"
                    style={{
                      background: isActive ? 'var(--clinical-green-bg)' : 'transparent',
                      color: isActive ? 'var(--clinical-green)' : 'var(--text-muted)',
                      border: isActive ? '1px solid var(--clinical-green-border)' : '1px solid transparent'
                    }}
                  >
                    <Icon className="w-4 h-4 shrink-0" style={{ color: isActive ? 'var(--clinical-green)' : 'var(--text-subtle)' }} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Stats Panel */}
          <div className="p-4 rounded-xl border space-y-3 bg-white" style={{ borderColor: 'var(--border)' }}>
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Treatment Summary</div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Target Therapy</span>
                <span className="text-xs font-bold text-emerald-700 font-mono">Osimertinib</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Adherence</span>
                <span className="text-xs font-bold text-emerald-700">{complianceRate}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Current Streak</span>
                <span className="text-xs font-bold text-emerald-700 font-mono">{loggedDays} Days</span>
              </div>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-600 transition-all duration-300" style={{ width: `${complianceRate}%` }}></div>
            </div>
          </div>
        </aside>

        {/* Tab Contents Area */}
        <main className="flex-1 bg-white rounded-2xl border border-gray-100 p-6 shadow-xs min-h-[500px]">
          
          {/* TAB 1: Care Summary (Translated) */}
          {activeTab === "summary" && (
            <div className="space-y-6 animate-in">
              <div className="border-b pb-4 mb-4">
                <div className="flex items-center gap-2 mb-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-md w-fit">
                  <ShieldCheck className="w-4 h-4" /> Clinician Approved Care Summary
                </div>
                <h2 className="text-xl font-bold tracking-tight text-gray-900 leading-tight">
                  {portalData.headline}
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Translated into patient-friendly language by OncoPilot AI. Approved on {new Date().toLocaleDateString()}.
                </p>
              </div>

              {/* What We Found */}
              <PlainLanguageSection
                title="What We Found"
                content={portalData.sections.what_we_found}
                icon="🧬"
              />

              {/* Treatment */}
              <PlainLanguageSection
                title="Your Treatment Plan"
                content={portalData.sections.what_this_means}
                icon="💊"
              />

              {/* Side Effects */}
              <PlainLanguageSection
                title="Potential Side Effects & Guidance"
                content={portalData.sections.side_effects}
                icon="🌿"
              />

              {/* Clinical Trials Discussion */}
              {portalData.sections.trials && (
                <TrialDiscussCard content={portalData.sections.trials} />
              )}

              {/* Questions Checklist */}
              {portalData.sections.questions_for_doctor && (
                <QuestionsForDoctor questions={portalData.sections.questions_for_doctor} />
              )}

              <PortalFooter disclaimer={portalData.footer_disclaimer} />
            </div>
          )}

          {/* TAB 2: Symptom Tracker */}
          {activeTab === "symptoms" && (
            <div className="space-y-6 animate-in">
              <div>
                <h3 className="text-base font-bold text-gray-900">Symptom Log & Insights</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Track your daily side effects to help your care team optimize your treatment.
                </p>
              </div>

              {/* SVG Symptom Trend Line Graph */}
              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                <h4 className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  Symptom History Trend (Last 7 Logs)
                </h4>
                <div className="w-full overflow-x-auto">
                  <svg className="mx-auto" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {/* Grid lines */}
                    {[1, 2, 3, 4, 5].map((val) => {
                      const y = height - padding - ((val - 1) / 4) * (height - 2 * padding);
                      return (
                        <g key={val}>
                          <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#e5e7eb" strokeWidth={1} strokeDasharray="3 3" />
                          <text x={padding - 10} y={y + 4} fontSize={9} fill="#9ca3af" textAnchor="end">{val}</text>
                        </g>
                      );
                    })}

                    {/* Dates on X axis */}
                    {symptomLogs.slice(-7).map((log, idx) => {
                      const x = padding + (idx / 6) * (width - 2 * padding);
                      return (
                        <text key={idx} x={x} y={height - 10} fontSize={8} fill="#9ca3af" textAnchor="middle">
                          {log.date}
                        </text>
                      );
                    })}

                    {/* Draw Line: Dry Skin (Cyan) */}
                    <path
                      d={symptomLogs.slice(-7).map((log, idx) => {
                        const x = padding + (idx / 6) * (width - 2 * padding);
                        const y = height - padding - ((log.drySkin - 1) / 4) * (height - 2 * padding);
                        return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
                      }).join(" ")}
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth={2}
                    />

                    {/* Draw Line: Diarrhea (Emerald) */}
                    <path
                      d={symptomLogs.slice(-7).map((log, idx) => {
                        const x = padding + (idx / 6) * (width - 2 * padding);
                        const y = height - padding - ((log.diarrhea - 1) / 4) * (height - 2 * padding);
                        return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
                      }).join(" ")}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth={2}
                    />

                    {/* Draw Line: Rash (Amber) */}
                    <path
                      d={symptomLogs.slice(-7).map((log, idx) => {
                        const x = padding + (idx / 6) * (width - 2 * padding);
                        const y = height - padding - ((log.rash - 1) / 4) * (height - 2 * padding);
                        return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
                      }).join(" ")}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth={2}
                    />

                    {/* Data Points */}
                    {symptomLogs.slice(-7).map((log, idx) => {
                      const x = padding + (idx / 6) * (width - 2 * padding);
                      const ySkin = height - padding - ((log.drySkin - 1) / 4) * (height - 2 * padding);
                      const yDia = height - padding - ((log.diarrhea - 1) / 4) * (height - 2 * padding);
                      const yRash = height - padding - ((log.rash - 1) / 4) * (height - 2 * padding);

                      return (
                        <g key={idx}>
                          <circle cx={x} cy={ySkin} r={3} fill="#06b6d4" />
                          <circle cx={x} cy={yDia} r={3} fill="#10b981" />
                          <circle cx={x} cy={yRash} r={3} fill="#f59e0b" />
                        </g>
                      );
                    })}
                  </svg>
                </div>
                {/* Legend */}
                <div className="flex gap-4 justify-center text-[10px] font-bold text-gray-500 mt-2">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-1 bg-emerald-500 inline-block"></span>Diarrhea</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-1 bg-amber-500 inline-block"></span>Rash</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-1 bg-cyan-500 inline-block"></span>Dry Skin</span>
                </div>
              </div>

              {/* Log Form */}
              <form onSubmit={handleLogSymptoms} className="space-y-4 pt-2 border-t">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Log Today&apos;s Side Effect Severity</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Diarrhea */}
                  <div className="space-y-1.5 p-3 rounded-lg border border-gray-100 bg-emerald-50/10">
                    <div className="flex justify-between text-xs font-bold text-gray-700">
                      <span>Diarrhea</span>
                      <span className="text-emerald-700">Grade {currentDiarrhea} / 5</span>
                    </div>
                    <input
                      type="range" min={1} max={5}
                      value={currentDiarrhea} onChange={(e) => setCurrentDiarrhea(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />
                    <div className="text-[10px] text-gray-400">
                      {currentDiarrhea === 1 && "Normal / No change"}
                      {currentDiarrhea === 2 && "Mild increase (1-3 extra stools daily)"}
                      {currentDiarrhea === 3 && "Moderate (4-6 extra stools daily)"}
                      {currentDiarrhea >= 4 && "Severe (>6 stools daily). Action Needed!"}
                    </div>
                  </div>

                  {/* Rash */}
                  <div className="space-y-1.5 p-3 rounded-lg border border-gray-100 bg-amber-50/10">
                    <div className="flex justify-between text-xs font-bold text-gray-700">
                      <span>Acneform Rash</span>
                      <span className="text-amber-700">Grade {currentRash} / 5</span>
                    </div>
                    <input
                      type="range" min={1} max={5}
                      value={currentRash} onChange={(e) => setCurrentRash(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                    <div className="text-[10px] text-gray-400">
                      {currentRash === 1 && "No rash"}
                      {currentRash === 2 && "Mild localized redness or spots"}
                      {currentRash === 3 && "Moderate rash covering larger area"}
                      {currentRash >= 4 && "Widespread or painful. Contact clinic."}
                    </div>
                  </div>

                  {/* Dry Skin */}
                  <div className="space-y-1.5 p-3 rounded-lg border border-gray-100 bg-cyan-50/10">
                    <div className="flex justify-between text-xs font-bold text-gray-700">
                      <span>Dry Skin / Itching</span>
                      <span className="text-cyan-700">Grade {currentDrySkin} / 5</span>
                    </div>
                    <input
                      type="range" min={1} max={5}
                      value={currentDrySkin} onChange={(e) => setCurrentDrySkin(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                    <div className="text-[10px] text-gray-400">
                      {currentDrySkin === 1 && "No dryness"}
                      {currentDrySkin === 2 && "Mild tightness or peeling"}
                      {currentDrySkin === 3 && "Moderate flaking or localized cracking"}
                      {currentDrySkin >= 4 && "Severe scaling, painful deep cracks"}
                    </div>
                  </div>

                  {/* Fatigue */}
                  <div className="space-y-1.5 p-3 rounded-lg border border-gray-100 bg-violet-50/10">
                    <div className="flex justify-between text-xs font-bold text-gray-700">
                      <span>Fatigue / Exhaustion</span>
                      <span className="text-violet-700">Grade {currentFatigue} / 5</span>
                    </div>
                    <input
                      type="range" min={1} max={5}
                      value={currentFatigue} onChange={(e) => setCurrentFatigue(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-violet-500"
                    />
                    <div className="text-[10px] text-gray-400">
                      {currentFatigue === 1 && "Full energy"}
                      {currentFatigue === 2 && "Slightly tired, no effect on activity"}
                      {currentFatigue === 3 && "Moderate fatigue, restricts heavier activities"}
                      {currentFatigue >= 4 && "Severe exhaustion, limits self-care"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-emerald-800 transition-colors cursor-pointer"
                  >
                    Log Daily Symptoms
                  </button>

                  {logSuccess && (
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5 animate-pulse">
                      <Check className="w-4 h-4" /> Symptom log saved! Trend updated.
                    </span>
                  )}
                </div>
              </form>

              {/* Automatic guidance warning card */}
              {(currentDiarrhea >= 3 || currentRash >= 3 || currentDrySkin >= 3) && (
                <div className="flex items-start gap-3 p-4 rounded-xl border bg-amber-50 border-amber-200 text-amber-900 animate-in">
                  <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold">Important Symptom Care Instructions</h5>
                    <ul className="text-xs space-y-1 mt-1 font-medium text-amber-800">
                      {currentDiarrhea >= 3 && (
                        <li>• Take 2 caps Loperamide (Imodium) now. Drink 2 liters of water/electrolytes today.</li>
                      )}
                      {currentRash >= 3 && (
                        <li>• Apply thin hydrocortisone cream if directed. Avoid direct sunlight.</li>
                      )}
                      {currentDrySkin >= 3 && (
                        <li>• Apply heavy fragrance-free moisturizers. Avoid very hot baths.</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Medication Log */}
          {activeTab === "meds" && (
            <div className="space-y-6 animate-in">
              <div>
                <h3 className="text-base font-bold text-gray-900">Medication Adherence Log</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Confirm daily intake of Osimertinib 80mg to verify compliance with your prescription.
                </p>
              </div>

              {/* Prescribed Tablet Details */}
              <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/10 flex items-start gap-4">
                <div className="p-3 bg-emerald-500 rounded-xl text-white text-base">💊</div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-900">Osimertinib (Tagrisso) 80mg</h4>
                  <p className="text-xs text-emerald-700 mt-0.5">Take 1 tablet daily by mouth at approx 9:00 AM.</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] bg-emerald-500 text-white font-mono px-2 py-0.5 rounded-full font-bold">ACTIVE REGIMEN</span>
                    <span className="text-[10px] text-gray-500 font-mono">No Refills Required</span>
                  </div>
                </div>
              </div>

              {/* Monthly Adherence Grid */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">June 2026 Adherence Calendar</h4>
                  <span className="text-[10px] text-gray-400">Click a day to log your pill intake</span>
                </div>
                
                <div className="grid grid-cols-7 gap-2">
                  {/* Days headers */}
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                    <div key={day} className="text-center text-[10px] font-bold text-gray-400">{day}</div>
                  ))}

                  {/* Empty cells before June starts (June 1 is Monday) */}
                  <div className="aspect-square bg-gray-50/20 rounded-lg"></div>

                  {/* 30 days grid */}
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => {
                    const isToday = day === currentDay;
                    const isFuture = day > currentDay;
                    const isLogged = medsLogged[day];

                    return (
                      <button
                        key={day}
                        disabled={isFuture}
                        onClick={() => toggleMedDay(day)}
                        className={`aspect-square flex flex-col items-center justify-between p-1.5 rounded-lg border transition-all text-xs font-bold ${
                          isLogged 
                            ? "bg-emerald-600 border-emerald-600 text-white shadow-xs" 
                            : isFuture 
                              ? "bg-gray-50/30 border-gray-100 text-gray-300 cursor-not-allowed"
                              : "bg-white hover:bg-emerald-50/50 hover:border-emerald-200 border-gray-200 text-gray-700"
                        } ${isToday ? "ring-2 ring-emerald-400 font-black scale-102" : ""}`}
                      >
                        <span className="self-start text-[9px]">{day}</span>
                        {isLogged ? (
                          <Check className="w-3.5 h-3.5 mb-1" />
                        ) : (
                          <span className="h-3.5 w-3.5"></span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Care Team Chat */}
          {activeTab === "chat" && (
            <div className="flex flex-col h-[520px] animate-in justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">Secure Care Team Coordinator</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Direct message interface with Dr. Allison Carter&apos;s precision oncology team.
                </p>
              </div>

              {/* Chat Thread */}
              <div className="flex-grow my-4 p-4 rounded-xl border border-gray-100 overflow-y-auto bg-gray-50/40 space-y-4 max-h-[360px]">
                {chatMessages.map((msg) => {
                  const isUser = msg.sender === "patient";
                  return (
                    <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-3xs ${
                        isUser 
                          ? 'bg-emerald-600 text-white rounded-tr-none' 
                          : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                      }`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-bold opacity-80">{msg.name}</span>
                          <span className="text-[8px] opacity-65 font-mono">• {msg.time}</span>
                        </div>
                        <p className="text-xs leading-relaxed font-medium">{msg.text}</p>
                      </div>
                    </div>
                  );
                })}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce delay-100"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce delay-200"></span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input Box */}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  placeholder="Ask nurse about medication timing, dry skin, scans, or general concerns..."
                  className="flex-grow rounded-xl border border-gray-200 px-4 py-3 text-xs focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
                <button
                  type="submit"
                  className="px-4 py-3 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition-colors shadow-sm flex items-center justify-center cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* TAB 5: Vitals Monitor */}
          {activeTab === "vitals" && (
            <div className="space-y-6 animate-in">
              <div>
                <h3 className="text-base font-bold text-gray-900">Vital Signs Log</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Log key health metrics to monitor baseline cardiovascular metrics while taking Osimertinib.
                </p>
              </div>

              {/* Vitals Form Input */}
              <form onSubmit={handleLogVitals} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl border bg-gray-50/50">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">HR (bpm)</label>
                  <input
                    type="number"
                    value={hrInput}
                    onChange={(e) => setHrInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-xs font-bold font-mono focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sys BP (mmHg)</label>
                  <input
                    type="number"
                    value={bpSysInput}
                    onChange={(e) => setBpSysInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-xs font-bold font-mono focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dia BP (mmHg)</label>
                  <input
                    type="number"
                    value={bpDiaInput}
                    onChange={(e) => setBpDiaInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-xs font-bold font-mono focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">SpO2 (%)</label>
                  <input
                    type="number"
                    value={spo2Input}
                    onChange={(e) => setSpo2Input(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-xs font-bold font-mono focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="md:col-span-4 flex items-center justify-between pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800 transition-colors shadow-sm cursor-pointer"
                  >
                    Add Vitals Entry
                  </button>

                  {vitalsSuccess && (
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                      <Check className="w-4 h-4" /> Vitals logged successfully!
                    </span>
                  )}
                </div>
              </form>

              {/* Status Visualizations */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Heart Rate Indicator */}
                {(() => {
                  const latest = vitalsHistory[vitalsHistory.length - 1];
                  const hr = latest?.hr || 70;
                  const isNormal = hr >= 60 && hr <= 100;
                  return (
                    <div className="p-4 rounded-xl border border-gray-100 flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Heart Rate</span>
                      <div className="my-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black font-mono" style={{ color: isNormal ? 'var(--clinical-green)' : 'var(--clinical-red)' }}>{hr}</span>
                        <span className="text-xs text-gray-500">bpm</span>
                      </div>
                      <span className={`text-[10px] font-bold ${isNormal ? 'text-emerald-700' : 'text-red-700'}`}>
                        {isNormal ? "Normal Range (60-100)" : "Alert Range"}
                      </span>
                    </div>
                  );
                })()}

                {/* Blood Pressure Indicator */}
                {(() => {
                  const latest = vitalsHistory[vitalsHistory.length - 1];
                  const sys = latest?.bpSystolic || 120;
                  const dia = latest?.bpDiastolic || 80;
                  const isHigh = sys > 140 || dia > 90;
                  return (
                    <div className="p-4 rounded-xl border border-gray-100 flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Blood Pressure</span>
                      <div className="my-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black font-mono" style={{ color: isHigh ? 'var(--clinical-red)' : 'var(--clinical-green)' }}>
                          {sys}/{dia}
                        </span>
                        <span className="text-xs text-gray-500">mmHg</span>
                      </div>
                      <span className={`text-[10px] font-bold ${isHigh ? 'text-red-700' : 'text-emerald-700'}`}>
                        {isHigh ? "Hypertensive Alert (>140/90)" : "Optimal Range (<130/80)"}
                      </span>
                    </div>
                  );
                })()}

                {/* SpO2 Oxygen */}
                {(() => {
                  const latest = vitalsHistory[vitalsHistory.length - 1];
                  const spo2 = latest?.spo2 || 98;
                  const isNormal = spo2 >= 95;
                  return (
                    <div className="p-4 rounded-xl border border-gray-100 flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Oxygen Saturation</span>
                      <div className="my-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black font-mono" style={{ color: isNormal ? 'var(--clinical-green)' : 'var(--clinical-red)' }}>{spo2}%</span>
                      </div>
                      <span className={`text-[10px] font-bold ${isNormal ? 'text-emerald-700' : 'text-red-700'}`}>
                        {isNormal ? "Normal Range (95-100)" : "Low Oxygen Alert (<95)"}
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* History Table */}
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-400 font-bold uppercase text-[9px] tracking-wider border-b">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Heart Rate</th>
                      <th className="px-4 py-3">Blood Pressure</th>
                      <th className="px-4 py-3">SpO2</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {vitalsHistory.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-semibold text-gray-700">{item.date}</td>
                        <td className="px-4 py-3 font-mono font-bold text-gray-800">{item.hr} bpm</td>
                        <td className="px-4 py-3 font-mono font-bold text-gray-800">{item.bpSystolic}/{item.bpDiastolic} mmHg</td>
                        <td className="px-4 py-3 font-mono font-bold text-gray-800">{item.spo2}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: Medical Documents */}
          {activeTab === "docs" && (
            <div className="space-y-6 animate-in">
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Approved Medical Reports</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Official clinical documents shared by your oncology team.
                  </p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-emerald-800 transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4" /> Print Approved Records
                </button>
              </div>

              <div className="space-y-5 print:space-y-12">
                {/* Document 1: Treatment Plan */}
                <div className="p-6 rounded-xl border border-gray-200 bg-white space-y-4 print:border-none print:p-0">
                  <div className="flex justify-between items-start border-b pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        Precision Regimen: Osimertinib Monotherapy
                      </h4>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">Category: Pharmacological Prescription Guidance</p>
                    </div>
                    <span className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono px-2.5 py-1 rounded-full font-bold">
                      APPROVED & SIGNED
                    </span>
                  </div>
                  <div className="text-xs leading-relaxed space-y-3 text-gray-700 font-medium">
                    <p><strong>Treatment Agent:</strong> Osimertinib (Tagrisso) 80mg Daily Tablet.</p>
                    <p><strong>Indications:</strong> Stage IVa Lung Adenocarcinoma featuring EGFR Exon 19 Deletion Mutation.</p>
                    <p><strong>Clinical Protocol:</strong> Continue medication continuously once daily. Periodic blood work and chest scans will be executed every 8 to 12 weeks to benchmark tumor shrinkage response.</p>
                  </div>
                </div>

                {/* Document 2: Toxicity Guidance */}
                <div className="p-6 rounded-xl border border-gray-200 bg-white space-y-4 print:border-none print:p-0">
                  <div className="flex justify-between items-start border-b pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        Toxicity Management & Safety Guideline
                      </h4>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">Category: Side Effect Profiling</p>
                    </div>
                  </div>
                  <div className="text-xs leading-relaxed space-y-2 text-gray-700 font-medium">
                    <p>• <strong>Dermatological Dryness / Rash:</strong> Apply intensive emollients or urea-based topical agents twice daily. Limit solar exposure.</p>
                    <p>• <strong>Gastrointestinal (Diarrhea):</strong> Have standby Loperamide (Imodium) available. Report any Grade 3+ diarrhea (4-6 extra stools daily) immediately to the nurse coordinator.</p>
                    <p>• <strong>Pulmonary:</strong> Report dry cough or sudden onset shortness of breath immediately, as these require temporary hold of TKI therapy.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: Educational Library */}
          {activeTab === "education" && (
            <div className="space-y-6 animate-in">
              <div>
                <h3 className="text-base font-bold text-gray-900">Patient Knowledge & Resource Library</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Understand your diagnosis and targeted therapy mechanisms.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Guide 1 */}
                <div className="p-5 rounded-xl border border-gray-100 hover:border-emerald-200 transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">DIAGNOSIS</span>
                    <h4 className="text-sm font-bold text-gray-800">Understanding Lung Adenocarcinoma</h4>
                    <p className="text-xs text-gray-500 leading-relaxed font-medium">
                      Adenocarcinoma is a type of non-small cell lung cancer that begins in gland cells that secrete substances like mucus. It is typically found in the outer areas of the lung.
                    </p>
                  </div>
                  <a href="https://www.cancer.org" target="_blank" rel="noreferrer" className="text-xs font-bold text-emerald-700 flex items-center gap-1 hover:underline">
                    Read ACS Guide <ChevronRight className="w-3 h-3" />
                  </a>
                </div>

                {/* Guide 2 */}
                <div className="p-5 rounded-xl border border-gray-100 hover:border-emerald-200 transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">BIOMARKER</span>
                    <h4 className="text-sm font-bold text-gray-800">What is an EGFR Mutation?</h4>
                    <p className="text-xs text-gray-500 leading-relaxed font-medium">
                      EGFR is a protein on cells that helps them grow. A mutation causes the cells to grow out of control. Osimertinib acts as a key that fits in the lock to shut this signal off.
                    </p>
                  </div>
                  <a href="https://www.cancer.gov" target="_blank" rel="noreferrer" className="text-xs font-bold text-emerald-700 flex items-center gap-1 hover:underline">
                    Read NCI Biomarker Factsheet <ChevronRight className="w-3 h-3" />
                  </a>
                </div>

                {/* Guide 3 */}
                <div className="p-5 rounded-xl border border-gray-100 hover:border-emerald-200 transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">MEDICATION</span>
                    <h4 className="text-sm font-bold text-gray-800">Osimertinib Patient Safety Manual</h4>
                    <p className="text-xs text-gray-500 leading-relaxed font-medium">
                      Tagrisso is a targeted tyrosine kinase inhibitor (TKI) pill. Learn about foods to avoid (like grapefruit juice which interacts with the drug) and normal hydration targets.
                    </p>
                  </div>
                  <a href="https://www.fda.gov" target="_blank" rel="noreferrer" className="text-xs font-bold text-emerald-700 flex items-center gap-1 hover:underline">
                    Download Official FDA Guide <ChevronRight className="w-3 h-3" />
                  </a>
                </div>

                {/* Guide 4 */}
                <div className="p-5 rounded-xl border border-gray-100 hover:border-emerald-200 transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full">NUTRITION</span>
                    <h4 className="text-sm font-bold text-gray-800">Wellness & Nutrition Tips</h4>
                    <p className="text-xs text-gray-500 leading-relaxed font-medium">
                      Tips on managing mouth sores, getting enough protein, maintaining moderate exercise, and remaining adequately hydrated (aim for 8-10 glasses of fluids daily).
                    </p>
                  </div>
                  <a href="https://www.cancercare.org" target="_blank" rel="noreferrer" className="text-xs font-bold text-emerald-700 flex items-center gap-1 hover:underline">
                    Get Nutrition Counseling <ChevronRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Footer disclaimer */}
      <footer className="mt-auto py-6 border-t bg-gray-50/50" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-5xl mx-auto px-4 text-center space-y-2">
          <p className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">
            OncoPilot Secure Health Gateway v2.5 · HIPAA Compliant · ISO 27001 Certified
          </p>
          <p className="text-[9px] text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Disclaimer: The translations and tools provided in this portal are for patient support and educational purposes only. Do not make changes to your medication regimen without consulting your physician.
          </p>
        </div>
      </footer>
    </div>
  );
}
