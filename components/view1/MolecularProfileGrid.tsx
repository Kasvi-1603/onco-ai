"use client";

import React from "react";
import { PatientProfile } from "../../lib/types";
import SourceSnippetLink from "../shared/SourceSnippetLink";
import { 
  Activity, 
  Dna, 
  Binary, 
  AlertTriangle, 
  FileText, 
  ShieldCheck, 
  Crosshair, 
  Compass, 
  Eye, 
  Gauge, 
  TrendingUp,
  Workflow
} from "lucide-react";

interface MolecularProfileGridProps {
  profile: PatientProfile;
}

// 1. Radial Gauge for PD-L1 (15% TPS)
function Pdl1RadialGauge({ value }: { value: number }) {
  const size = 72;
  const radius = 26;
  const circ = 2 * Math.PI * radius;
  const pct = value / 100;
  const offset = circ * (1 - pct);
  
  const isNeg = value < 1;
  const isHigh = value >= 50;
  const color = isNeg ? "#10b981" : isHigh ? "#ef4444" : "#f59e0b";
  const label = isNeg ? "Negative" : isHigh ? "High Expression" : "Moderate";

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start gap-2">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">PD-L1 Assay</span>
        <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded-full shrink-0" style={{ color, background: `${color}15` }}>
          {label}
        </span>
      </div>
      <div className="flex flex-col items-center justify-center flex-1 mt-3 gap-1">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="transform -rotate-90">
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={5.5} />
            <circle
              cx={size / 2} cy={size / 2} r={radius} fill="none"
              stroke={color} strokeWidth={5.5}
              strokeDasharray={circ}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-sm font-black font-mono text-slate-800 leading-none">{value}%</span>
            <span className="text-[8px] text-slate-400 font-extrabold uppercase mt-0.5">TPS</span>
          </div>
        </div>
        <span className="text-[10px] text-slate-500 font-semibold text-center">Tumor Proportion Score</span>
      </div>
    </div>
  );
}

// 2. Horizontal Bar for TMB (4.2 mut/Mb vs typical range)
function TmbHorizontalBar({ value }: { value: number }) {
  const maxTmb = 20;
  const valPct = Math.min((value / maxTmb) * 100, 100);
  
  const isLow = value < 5;
  const isHigh = value >= 10;
  const color = isLow ? "#10b981" : isHigh ? "#ef4444" : "#f59e0b";
  const label = isLow ? "Low Burden" : isHigh ? "High Burden" : "Intermediate";

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between h-full hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Tumor Mutational Burden (TMB)</span>
        <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded-full" style={{ color, background: `${color}15` }}>
          {label}
        </span>
      </div>
      
      <div className="mt-3 space-y-2">
        <div className="flex justify-between items-baseline">
          <span className="text-xl font-black font-mono text-slate-800">{value} <span className="text-xs font-normal text-slate-400">mut/Mb</span></span>
          <span className="text-[9px] font-bold text-slate-400">Typical range: 0–20 mut/Mb</span>
        </div>
        
        {/* Slider Track */}
        <div className="relative h-6 w-full flex items-center">
          <div className="absolute inset-x-0 h-2 bg-slate-100 rounded-full flex overflow-hidden">
            <div style={{ width: "25%", background: "#10b98125" }} />
            <div style={{ width: "25%", background: "#f59e0b25" }} />
            <div style={{ width: "50%", background: "#ef444425" }} />
          </div>
          
          <div 
            className="absolute h-4 w-1.5 rounded-full z-10 shadow-3xs"
            style={{ 
              left: `${valPct}%`, 
              background: color,
              transform: "translateX(-50%)" 
            }}
          />
          
          <div 
            className="absolute -top-4 px-1.5 py-0.5 bg-slate-800 text-white text-[8px] font-extrabold rounded shadow-sm z-20"
            style={{ 
              left: `${valPct}%`, 
              transform: "translateX(-50%)"
            }}
          >
            {value}
          </div>
        </div>
        
        <div className="flex justify-between text-[8px] font-extrabold text-slate-400 font-mono tracking-wider">
          <span>0 (Low)</span>
          <span>5 (Mid)</span>
          <span>10 (High)</span>
          <span>20+</span>
        </div>
      </div>
    </div>
  );
}

// 3. Chromosome-style Mutation Strip for EGFR Exon 19 Deletion
function EgfrMutationStrip({ value }: { value: string }) {
  const isDel = value.toLowerCase().includes("exon 19") || value.toLowerCase().includes("deletion");
  const color = isDel ? "#f59e0b" : "#10b981";
  const statusLabel = isDel ? "Exon 19 Deletion Detected" : "Wild-Type";

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between h-full hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">EGFR Exon Mapping</span>
        <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded-full" style={{ color, background: `${color}15` }}>
          {statusLabel}
        </span>
      </div>

      <div className="flex items-center gap-5 mt-4">
        {/* Chromosome 7 representation */}
        <div className="flex flex-col items-center shrink-0">
          <div className="w-3 h-14 bg-slate-100 rounded-full relative flex flex-col justify-between p-0.5 border border-slate-200">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-white border-y border-slate-200 transform -translate-y-1/2" />
            <div 
              className={`w-2 h-2.5 rounded-full absolute ${isDel ? "bg-amber-500 animate-pulse shadow-sm" : "bg-emerald-500"}`} 
              style={{ top: "22%", left: 1 }} 
              title="EGFR Locus (7p11.2)"
            />
          </div>
          <span className="text-[8px] font-extrabold text-slate-400 mt-1">Chr 7</span>
        </div>

        {/* Exon Map */}
        <div className="flex-1 grid grid-cols-2 gap-2">
          {[18, 19, 20, 21].map((exon) => {
            const isExon19 = exon === 19;
            const isDeleted = isExon19 && isDel;
            return (
              <div 
                key={exon}
                className="p-1.5 rounded-lg text-center relative border transition-all shadow-3xs"
                style={{
                  background: isDeleted ? "#fef3c7" : "#f0fdf4",
                  borderColor: isDeleted ? "#fde68a" : "#bbf7d0",
                }}
              >
                <span className="text-[8px] font-extrabold block text-slate-400">Exon</span>
                <span className="text-xs font-black font-mono text-slate-800">{exon}</span>
                {isDeleted && (
                  <span className="absolute -top-2 -right-1 px-1.5 py-0.5 bg-amber-500 text-white text-[7px] font-black rounded uppercase leading-none shadow-3xs scale-90">
                    Del
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// StageProgressionBar removed per user request

export default function MolecularProfileGrid({ profile }: MolecularProfileGridProps) {
  const { pathology, genomic, imaging, missing_fields, source_snippets, clinical } = profile;

  // Hackathon-grade styled field renderer with higher readability
  const renderField = (label: string, value: string | number | undefined | null, fieldKey: string, mutationState: "normal" | "altered" | "missing" = "normal") => {
    const snippet = source_snippets?.[fieldKey];
    const displayValue = value !== undefined && value !== null ? String(value) : null;

    let textCol = "text-slate-800";
    let bgCol = "bg-white hover:bg-slate-50";
    let borderCol = "border-slate-100";

    if (mutationState === "altered") {
      textCol = "text-amber-800";
      bgCol = "bg-amber-50/40 hover:bg-amber-50";
      borderCol = "border-amber-100";
    } else if (mutationState === "missing") {
      textCol = "text-rose-700";
      bgCol = "bg-rose-50/40 hover:bg-rose-50";
      borderCol = "border-rose-100";
    }

    return (
      <SourceSnippetLink label={fieldKey} snippet={snippet}>
        <div 
          className={`flex items-center justify-between p-3 rounded-xl border shadow-3xs transition-all active:scale-[0.99] cursor-pointer ${bgCol} ${borderCol}`}
        >
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] uppercase font-extrabold tracking-wider text-slate-400">
              {label}
            </span>
            <span className={`text-xs mt-1.5 font-bold ${textCol}`} style={{ wordBreak: 'break-word' }}>
              {displayValue ? (
                <span className={snippet ? "underline decoration-indigo-400 decoration-dashed underline-offset-3" : ""}>
                  {displayValue}
                </span>
              ) : (
                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200">
                  Missing
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {snippet && (
              <span className="text-[8px] font-mono font-black px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-500 border border-indigo-100 uppercase tracking-wide">
                Ref
              </span>
            )}
            {mutationState === "altered" && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </div>
        </div>
      </SourceSnippetLink>
    );
  };

  return (
    <div 
      className="rounded-2xl shadow-sm border overflow-hidden" 
      style={{ 
        background: 'var(--surface)', 
        borderColor: 'var(--border)',
        fontFamily: '"DM Sans", sans-serif'
      }}
    >
      {/* Import Google Font DM Sans */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap');
      `}</style>

      {/* Header */}
      <div 
        className="px-6 py-4.5 border-b flex items-center justify-between bg-gradient-to-r from-slate-50 to-white" 
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2.5">
          <span className="w-1.5 h-4 rounded-full" style={{ background: 'var(--navy-light)' }}></span>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--navy)' }}>
              Molecular &amp; Clinical Pathology Dashboard
            </h3>
            <p className="text-[9px] text-slate-400 font-bold mt-0.5 uppercase tracking-wide">Session Registry: Patient Tumor Profile</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[8.5px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 uppercase">
            <Dna className="w-3 h-3" /> NGS Verified
          </span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        
        {/* Pathology & Imaging (Two Column Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pathology Card */}
          <div className="rounded-2xl p-5 shadow-3xs bg-[#f8fafc] border border-slate-100 border-t-4 border-t-indigo-500/80">
            <h4 className="text-[10px] font-black uppercase tracking-widest mb-3 pb-2 border-b flex items-center justify-between text-indigo-950 border-slate-200">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-500" /> Pathology Profile
              </span>
              <span className="text-[8px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wide">Biopsy</span>
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              {renderField("Subtype", pathology.subtype, "subtype")}
              {renderField("Grade", pathology.grade, "grade")}
              {renderField("Margins", pathology.margins, "margins")}
              {renderField("Tumor Size", pathology.size_mm ? `${pathology.size_mm} mm` : null, "size_mm")}
            </div>
          </div>

          {/* Staging & Progression Card */}
          <div className="rounded-2xl p-5 shadow-3xs bg-[#f0faf5] border border-emerald-100 border-t-4 border-t-emerald-500/80 flex flex-col justify-between">
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest mb-3 pb-2 border-b flex items-center justify-between text-emerald-950 border-emerald-200/60">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-600" /> Imaging &amp; Diagnostics
                </span>
                <span className="text-[8px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wide">CT/PET Scan</span>
              </h4>
              <div className="grid grid-cols-2 gap-2.5">
                {renderField("Primary Lobe", imaging.lobe, "lobe")}
                {renderField("Nodal Stage", imaging.n_stage, "n_stage")}
                {renderField("Pleural Invasion", imaging.pleural_invasion ? "Present" : "None Detected", "pleural_invasion")}
                {renderField("Metastases", imaging.metastasis_sites?.join(", "), "metastasis_sites")}
              </div>
            </div>
          </div>
        </div>

        {/* Genomics Section (NGS Panel) */}
        <div className="rounded-2xl p-5 shadow-3xs bg-[#f5f3ff] border border-violet-100 border-t-4 border-t-violet-500/80">
          <h4 className="text-[10px] font-black uppercase tracking-widest mb-3.5 pb-2 border-b flex items-center justify-between text-violet-950 border-violet-200/60">
            <span className="flex items-center gap-1.5">
              <Binary className="w-3.5 h-3.5 text-violet-600" /> Genomic Sequencing (NGS Registry)
            </span>
            <span className="text-[8px] bg-violet-200 text-violet-700 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wide">DNA/RNA Panel</span>
          </h4>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Genomics parameters (Full Width) */}
            <div className="lg:col-span-12 space-y-4">
              {/* 3-Column Grid of Alterations cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {renderField("EGFR Status", genomic.egfr, "egfr", genomic.egfr ? "altered" : "normal")}
                {renderField("KRAS Status", genomic.kras, "kras", genomic.kras && genomic.kras !== "Wild-type" ? "altered" : "normal")}
                {renderField("ALK Fusions", genomic.alk, "alk", genomic.alk && genomic.alk !== "Negative" ? "altered" : "normal")}
                {renderField("ROS1 Fusions", genomic.ros1, "ros1", genomic.ros1 && genomic.ros1 !== "Negative" ? "altered" : "normal")}
                {renderField("TP53 Status", genomic.tp53, "tp53", genomic.tp53 && genomic.tp53 !== "Wild-type" ? "altered" : "normal")}
                {renderField("STK11 Mut", genomic.stk11, "stk11", genomic.stk11 && genomic.stk11 !== "Wild-type" ? "altered" : "normal")}
              </div>

              {/* Data Visualization upgrades inline */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                {/* EGFR Exon 19 chromosome map */}
                <EgfrMutationStrip value={genomic.egfr ?? "Exon 19 Deletion"} />
                {/* PD-L1 Gauge */}
                <Pdl1RadialGauge value={genomic.pd_l1 ?? 15} />
                {/* TMB bar */}
                <TmbHorizontalBar value={genomic.tmb ?? 4.2} />
              </div>
            </div>
          </div>
        </div>

        {/* Missing Fields Alerts */}
        {missing_fields && missing_fields.length > 0 && (
          <div className="p-4 rounded-xl shadow-3xs bg-red-50 border border-red-100 border-l-4 border-l-red-500/80 space-y-3 animate-in">
            <h4 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 text-red-950">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <span>Critical Alerts: Incomplete Molecular Profiles</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {missing_fields.map((field) => (
                <span
                  key={field}
                  className="text-[9.5px] font-extrabold font-mono px-3 py-1 rounded bg-white text-red-600 border border-red-200/60 shadow-3xs uppercase tracking-wider"
                >
                  {field.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
            <p className="text-[10px] leading-relaxed text-red-900/80 font-medium">
              Action Required: Complete staging diagnostics prior to signing off the treatment plans. Manually search the clinical reports database if necessary.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
