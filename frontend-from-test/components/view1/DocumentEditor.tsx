"use client";

import React, { useState, useEffect } from "react";
import { SessionDocuments, SourceSnippets } from "../../lib/types";
import { 
  FileText, 
  Printer, 
  CheckCircle, 
  Heart, 
  Stethoscope, 
  ShieldAlert, 
  Layers, 
  Compass, 
  ClipboardList,
  Activity
} from "lucide-react";

interface DocumentEditorProps {
  sessionId: string;
  initialDocuments: SessionDocuments;
  sourceSnippets: SourceSnippets;
  onSaveSuccess?: (updatedDocs: SessionDocuments) => void;
}

const DOC_LABELS: Record<keyof SessionDocuments, string> = {
  treatment_plan: "Treatment Plan",
  mdt_brief: "MDT Briefing",
  trial_report: "Trial Matching",
  referral_letter: "Referral Letter",
  toxicity_check: "Toxicity & Safety",
  prognosis: "Prognosis",
  patient_summary_clinical: "Patient Summary (Clinical)",
};

export default function DocumentEditor({
  sessionId,
  initialDocuments,
  sourceSnippets,
  onSaveSuccess,
}: DocumentEditorProps) {
  const [docs, setDocs] = useState<SessionDocuments>(initialDocuments);
  const [activeTab, setActiveTab] = useState<keyof SessionDocuments>("treatment_plan");

  // Sync state if initialDocuments changes externally
  useEffect(() => {
    setDocs(initialDocuments);
  }, [initialDocuments]);

  // Format date for medical file
  const formattedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Render inline styled bold/italic tags from markdown
  const formatInline = (text: string): string => {
    let formatted = text.replace(/\*\*(.*?)\*\*/g, "<strong class='font-bold text-slate-900' style='font-family: system-ui, -apple-system, sans-serif;'>$1</strong>");
    formatted = formatted.replace(/\*(.*?)\*/g, "<em class='italic text-slate-800'>$1</em>");
    return formatted;
  };

  // Custom simple Markdown Parser for clinical document preview
  const parseMarkdown = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("# ")) {
        return (
          <h2 
            key={idx} 
            className="text-2xl font-normal italic pb-1.5 border-b border-slate-200 mt-5 mb-3 text-slate-900 flex items-center gap-2"
            style={{ 
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              letterSpacing: "-0.01em"
            }}
          >
            <span className="w-1.5 h-4 bg-indigo-600 rounded"></span>
            {trimmed.slice(2)}
          </h2>
        );
      }
      if (trimmed.startsWith("## ")) {
        return (
          <h3 
            key={idx} 
            className="text-sm font-bold mt-4 mb-2 text-slate-800 flex items-center gap-1"
            style={{ 
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}
          >
            {trimmed.slice(3)}
          </h3>
        );
      }
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        const content = trimmed.slice(2);
        return (
          <li 
            key={idx} 
            className="text-[13px] leading-relaxed text-slate-700 ml-4 list-disc mb-1.5" 
            style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif' }}
            dangerouslySetInnerHTML={{ __html: formatInline(content) }} 
          />
        );
      }
      if (trimmed === "") {
        return <div key={idx} className="h-2.5" />;
      }
      return (
        <p 
          key={idx} 
          className="text-[13px] leading-relaxed text-slate-700 mb-2.5" 
          style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif' }}
          dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }} 
        />
      );
    });
  };

  // Helper widget to inject premium visualization templates per document type
  const renderDocumentWidget = () => {
    switch (activeTab) {
      case "treatment_plan":
        return (
          <div className="mb-5 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-lg space-y-3 shadow-3xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase text-blue-800 tracking-wider flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-blue-600" /> Active Regimen Details
              </span>
              <span className="text-[9px] bg-blue-600 text-white font-mono font-bold px-2 py-0.5 rounded-full uppercase">
                Targeted Therapy
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-2.5 rounded border border-blue-100 shadow-3xs">
                <span className="text-[9px] font-extrabold uppercase text-slate-400 block">Prescribed Drug</span>
                <span className="text-xs font-bold text-slate-900 block mt-0.5">Osimertinib (Tagrisso)</span>
                <span className="text-[9px] font-semibold text-blue-600 font-mono block mt-0.5">80mg Oral Daily</span>
              </div>
              <div className="bg-white p-2.5 rounded border border-blue-100 shadow-3xs">
                <span className="text-[9px] font-extrabold uppercase text-slate-400 block">Indication</span>
                <span className="text-xs font-bold text-slate-900 block mt-0.5">EGFR Exon 19 Deletion</span>
                <span className="text-[9px] font-semibold text-emerald-600 block mt-0.5">Highly Responsive</span>
              </div>
            </div>
            {/* Treatment Timeline Visualizer */}
            <div className="pt-2">
              <span className="text-[9px] font-extrabold uppercase text-slate-400 block mb-2">Therapeutic Timeline</span>
              <div className="relative flex justify-between items-center px-1">
                <div className="absolute left-2 right-2 h-0.5 bg-blue-200 z-0" />
                {[
                  { step: "Start", date: "Wk 0", active: true },
                  { step: "MDT Review", date: "Wk 2", active: true },
                  { step: "Labs Check", date: "Wk 4", active: false },
                  { step: "CT Evaluation", date: "Wk 8-12", active: false }
                ].map((pt, i) => (
                  <div key={i} className="relative z-10 flex flex-col items-center">
                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border-2 ${pt.active ? "bg-blue-600 border-blue-600" : "bg-white border-blue-300"}`}>
                      {pt.active && <div className="w-1 h-1 bg-white rounded-full" />}
                    </div>
                    <span className="text-[8px] font-bold text-slate-700 mt-1">{pt.step}</span>
                    <span className="text-[8px] font-mono text-slate-400">{pt.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case "mdt_brief":
        return (
          <div className="mb-5 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-lg space-y-3.5 shadow-3xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase text-purple-800 tracking-wider flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-purple-600" /> MDT Consensus Status
              </span>
              <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle className="w-2.5 h-2.5" /> Approved
              </span>
            </div>
            <div className="bg-white p-3 rounded border border-purple-100 space-y-2 text-[10px] text-slate-700 shadow-3xs">
              <div className="flex justify-between border-b pb-1.5">
                <span className="font-semibold text-slate-500">Board Consensus</span>
                <span className="font-bold text-slate-900">Reached (100% agreement)</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="font-semibold text-slate-500">Principal Recommendation</span>
                <span className="font-bold text-indigo-700">Osimertinib 80mg First-Line</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Attending Oncologists</span>
                <span className="font-semibold text-slate-900 truncate max-w-[160px]">Dr. Jenkins, Dr. Chen, Dr. Mercer</span>
              </div>
            </div>
          </div>
        );
      case "trial_report":
        return (
          <div className="mb-5 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-lg space-y-3 shadow-3xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase text-emerald-800 tracking-wider flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-emerald-600" /> Trial Matching Rationale
              </span>
              <span className="text-[9px] bg-emerald-600 text-white font-mono font-bold px-2 py-0.5 rounded">
                2 Matches
              </span>
            </div>
            <div className="space-y-2">
              <div className="bg-white p-2.5 rounded border border-emerald-100 flex items-center justify-between gap-3 shadow-3xs">
                <div>
                  <span className="text-[9px] font-mono font-bold text-emerald-600 uppercase">NCT05481745 (Phase III)</span>
                  <p className="text-[10px] font-semibold text-slate-800 mt-0.5">Osimertinib Combo Trial</p>
                </div>
                <span className="text-[10px] bg-slate-100 font-mono font-bold px-2 py-1 rounded text-slate-700">95% Match</span>
              </div>
              <div className="bg-white p-2.5 rounded border border-emerald-100 flex items-center justify-between gap-3 shadow-3xs">
                <div>
                  <span className="text-[9px] font-mono font-bold text-teal-600 uppercase">NCT04862598 (Phase II)</span>
                  <p className="text-[10px] font-semibold text-slate-800 mt-0.5">EGFR Adjuvant Targeted Therapy</p>
                </div>
                <span className="text-[10px] bg-slate-100 font-mono font-bold px-2 py-1 rounded text-slate-700">89% Match</span>
              </div>
            </div>
          </div>
        );
      case "referral_letter":
        return (
          <div className="mb-4 flex justify-between items-start border-b pb-3 border-slate-200">
            <div>
              <p className="text-[9px] uppercase font-bold tracking-widest text-indigo-950">OncoPilot Medical Alliance</p>
              <p className="text-[8px] text-slate-400">100 Precision Care Circle, Suite 400 · New York</p>
            </div>
            <div className="w-10 h-10 rounded border border-slate-200 flex items-center justify-center text-slate-300 font-bold text-xs bg-slate-50 uppercase tracking-widest font-mono">
              OP
            </div>
          </div>
        );
      case "toxicity_check":
        return (
          <div className="mb-5 p-4 bg-gradient-to-br from-amber-50 to-red-50 border border-amber-100 rounded-lg space-y-3 shadow-3xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase text-amber-800 tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> Toxicity &amp; Adverse Risk Radar
              </span>
              <span className="text-[9px] bg-amber-600 text-white font-mono font-bold px-2 py-0.5 rounded">
                Active Warnings
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-2 border border-amber-100 rounded flex items-center gap-2 shadow-3xs">
                <span className="w-1.5 h-6 rounded-full bg-emerald-500 shrink-0"></span>
                <div>
                  <span className="text-[8px] font-bold text-slate-400 block uppercase">Renal Risk</span>
                  <span className="text-[9px] font-bold text-emerald-600">Low/Safe</span>
                </div>
              </div>
              <div className="bg-white p-2 border border-amber-100 rounded flex items-center gap-2 shadow-3xs">
                <span className="w-1.5 h-6 rounded-full bg-amber-500 shrink-0 animate-pulse"></span>
                <div>
                  <span className="text-[8px] font-bold text-slate-400 block uppercase">QTc prolongation</span>
                  <span className="text-[9px] font-bold text-amber-600">Monitor ECG</span>
                </div>
              </div>
            </div>
          </div>
        );
      case "prognosis":
        return (
          <div className="mb-5 p-4 bg-gradient-to-br from-blue-50 to-emerald-50 border border-slate-100 rounded-lg space-y-3.5 shadow-3xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase text-slate-800 tracking-wider flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-indigo-600" /> Prognostic Outcome Metrics
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded border border-slate-100 shadow-3xs">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase block">Median OS Target</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-base font-extrabold text-indigo-700 font-mono">38.6</span>
                  <span className="text-[9px] text-slate-400">months</span>
                </div>
              </div>
              <div className="bg-white p-3 rounded border border-slate-100 shadow-3xs">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase block">Median PFS Target</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-base font-extrabold text-emerald-600 font-mono">18.9</span>
                  <span className="text-[9px] text-slate-400">months</span>
                </div>
              </div>
            </div>
          </div>
        );
      case "patient_summary_clinical":
        return (
          <div className="mb-5 p-4 bg-gradient-to-r from-indigo-950 to-slate-900 text-white rounded-lg space-y-3.5 shadow-3xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full translate-x-4 -translate-y-4"></div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase text-indigo-200 tracking-wider flex items-center gap-1">
                <ClipboardList className="w-3.5 h-3.5 text-indigo-400" /> Patient Translation Engine
              </span>
              <span className="text-[8px] bg-indigo-800/80 text-indigo-200 font-mono font-bold px-2 py-0.5 rounded-full border border-indigo-700/60 uppercase">
                Layman Formatted
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { title: "Diagnosis", val: "Adenocarcinoma", icon: Stethoscope },
                { title: "Gene Match", val: "EGFR Mutation", icon: Activity },
                { title: "Action Plan", val: "Targeted Pill", icon: Heart }
              ].map((item, i) => (
                <div key={i} className="bg-white/5 border border-white/10 p-2 rounded flex flex-col justify-between items-start">
                  <item.icon className="w-3.5 h-3.5 text-indigo-400 mb-1.5" />
                  <div>
                    <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wide">{item.title}</span>
                    <span className="text-[9px] font-bold text-white block truncate w-full mt-0.5">{item.val}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div 
      className="rounded-xl shadow-md border" 
      style={{ 
        background: 'var(--surface)', 
        borderColor: 'var(--border)' 
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between px-5 py-4 border-b flex-wrap gap-3" 
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-3.5 rounded-sm" style={{ background: 'var(--navy)' }}></span>
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2 font-sans">
            Clinical Document Workspace
          </h3>
        </div>
        
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded shadow-3xs cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" /> Print Chart
        </button>
      </div>

      {/* Document Select Tabs */}
      <div 
        className="flex items-center gap-px border-b px-3 overflow-x-auto scrollbar-thin bg-slate-50" 
        style={{ borderColor: 'var(--border)' }}
      >
        {(Object.keys(DOC_LABELS) as Array<keyof SessionDocuments>).map((key) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => {
                setActiveTab(key);
              }}
              className="px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all outline-none cursor-pointer flex items-center gap-2 hover:bg-slate-100/50"
              style={{
                borderColor: isActive ? 'var(--navy-light)' : 'transparent',
                color: isActive ? 'var(--navy)' : 'var(--text-muted)',
                background: isActive ? 'var(--navy-muted)' : 'transparent',
              }}
            >
              <FileText className={`w-3.5 h-3.5 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
              {DOC_LABELS[key]}
            </button>
          );
        })}
      </div>

      {/* Live Medical Report Sheet View (Full Width) */}
      <div className="p-5">
        <div className="space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
              Live Clinical Medical Sheet (Official Output)
            </span>
          </div>

          {/* White Medical Report Sheet Card */}
          <div 
            className="rounded-lg border border-slate-200 shadow-sm p-6 space-y-4 bg-white animate-in"
            style={{ minHeight: "380px" }}
          >
            {/* Visual Medical Stamp Header or Letterhead info */}
            {renderDocumentWidget()}

            {/* Medical Record Patient Info Bar */}
            <div 
              className="bg-slate-50 border rounded-md p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[9px] font-bold text-slate-600 mb-4"
              style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
            >
              <div>
                <span className="text-slate-400 uppercase font-bold text-[8px] block">Patient Case ID</span>
                <span className="font-mono text-slate-900">#{sessionId.slice(0, 12)}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-bold text-[8px] block">Medical Registry Date</span>
                <span className="text-slate-900">{formattedDate}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-bold text-[8px] block">Clinic Origin</span>
                <span className="text-slate-900">Precision Oncology</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-bold text-[8px] block">Document Status</span>
                <span className="text-amber-600 font-bold uppercase">Physician Draft</span>
              </div>
            </div>

            {/* Styled Parsed Markdown Body */}
            <div className="prose max-w-none text-slate-800 space-y-2.5">
              {docs[activeTab] ? (
                parseMarkdown(docs[activeTab])
              ) : (
                <p className="text-xs text-slate-400 italic font-sans">No document draft content available.</p>
              )}
            </div>

            {/* Interactive Physician Signature Lock Seal Block */}
            <div 
              className="pt-6 mt-6 border-t border-dashed border-slate-200 flex justify-between items-center flex-wrap gap-4"
              style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
            >
              <div>
                <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 block">Digitally Certified By</span>
                <span className="text-xs font-bold font-mono text-indigo-700 italic block mt-0.5">Dr. Attending Oncologist, MD</span>
              </div>
              <div className="flex items-center gap-1 px-3 py-1 rounded bg-slate-50 border border-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                <span className="text-[8px] font-bold text-slate-500 uppercase font-mono">Status: Pending Verification</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Disclaimer */}
        <div className="text-[10px] leading-relaxed p-3.5 mt-5 rounded-lg italic border text-slate-500 bg-slate-50 animate-in" style={{ borderColor: 'var(--border-subtle)' }}>
          🔒 Verify and share this session's clinical output directly with the patient portal or MDT registry by clicking the "Approve &amp; Share" button at the top of the Clinical Profile workstation.
        </div>
      </div>

      {/* OCR References Panel (Provenance Check) */}
      {sourceSnippets && Object.keys(sourceSnippets).length > 0 && (
        <div 
          className="mx-5 mb-5 p-4 rounded-lg border space-y-3" 
          style={{ background: 'var(--background)', borderColor: 'var(--border-subtle)' }}
        >
          <h4 className="text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--navy-light)' }}>
            <span className="w-1.5 h-3.5 rounded-sm bg-indigo-500"></span>
            Extracted Clinical Provenance Reference (Source Evidence)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-40 overflow-y-auto pr-1">
            {Object.entries(sourceSnippets).map(([field, text]) => (
              <div 
                key={field} 
                className="p-3.5 rounded-lg text-[11px] leading-relaxed shadow-3xs bg-white border"
                style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
              >
                <span className="font-extrabold block mb-1 uppercase tracking-wider text-[9px] font-mono" style={{ color: 'var(--navy)' }}>
                  {field.replace(/_/g, ' ')}
                </span>
                "{text}"
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
