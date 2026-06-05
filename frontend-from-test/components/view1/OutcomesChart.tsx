"use client";

import React, { useState } from "react";

interface RegimenData {
  name: string;
  short: string;
  cr: number;
  pr: number;
  sd: number;
  pd: number;
}

export default function OutcomesChart() {
  const data: RegimenData[] = [
    {
      name: "Osimertinib Monotherapy",
      short: "Osimertinib",
      cr: 12,
      pr: 68,
      sd: 15,
      pd: 5,
    },
    {
      name: "Osimertinib + Pemetrexed/Carboplatin",
      short: "Osimertinib + Chemo",
      cr: 18,
      pr: 71,
      sd: 8,
      pd: 3,
    },
    {
      name: "Standard Platinum Doublet Chemo",
      short: "Platinum Doublet",
      cr: 5,
      pr: 39,
      sd: 36,
      pd: 20,
    },
  ];

  const SEGMENTS = [
    { key: "cr" as const, label: "Complete Response (CR)", bg: "linear-gradient(90deg, #10b981, #059669)", solid: "#059669", glow: "rgba(5, 150, 105, 0.4)" },
    { key: "pr" as const, label: "Partial Response (PR)", bg: "linear-gradient(90deg, #3b82f6, #2563eb)", solid: "#2563eb", glow: "rgba(37, 99, 235, 0.4)" },
    { key: "sd" as const, label: "Stable Disease (SD)", bg: "linear-gradient(90deg, #f59e0b, #d97706)", solid: "#d97706", glow: "rgba(217, 119, 6, 0.4)" },
    { key: "pd" as const, label: "Progressive Disease (PD)", bg: "linear-gradient(90deg, #ef4444, #dc2626)", solid: "#dc2626", glow: "rgba(220, 38, 38, 0.4)" },
  ];

  const [hovered, setHovered] = useState<{ regIdx: number; segKey: "cr" | "pr" | "sd" | "pd" } | null>(null);

  const renderSegmentLabel = (pct: number, labelPrefix: string) => {
    if (pct >= 12) {
      return `${labelPrefix}: ${pct}%`;
    } else if (pct >= 6) {
      return `${pct}%`;
    }
    return "";
  };

  return (
    <div
      className="rounded-lg shadow-md"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        className="px-5 py-3.5 border-b"
        style={{
          borderColor: "var(--border)",
          background: "linear-gradient(to right, #f8fafc, #ffffff)",
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-1.5 h-3.5 rounded-sm"
            style={{ background: "linear-gradient(180deg, #10b981, #059669)" }}
          ></span>
          <h4
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: "var(--navy)" }}
          >
            Regimen Efficacy Profiles (Matched Targets)
          </h4>
        </div>
        <p className="text-[10px] mt-1 italic" style={{ color: "var(--text-muted)" }}>
          Comparison of Objective Response Rates (ORR) based on clinical trial outcomes
        </p>
      </div>

      <div className="p-5 space-y-6 flex-1 bg-[#fafbfc]">
        {data.map((reg, regIdx) => {
          const orr = reg.cr + reg.pr;
          const isHighOrr = orr >= 75;

          return (
            <div key={regIdx} className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold" style={{ color: "var(--navy)" }}>
                  {reg.name}
                </span>
                <span
                  className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded border shadow-sm"
                  style={{
                    background: isHighOrr ? "linear-gradient(to right, #ecfdf5, #d1fae5)" : "linear-gradient(to right, #fef3c7, #fde68a)",
                    color: isHighOrr ? "#047857" : "#b45309",
                    borderColor: isHighOrr ? "#6ee7b7" : "#fcd34d",
                  }}
                >
                  ORR: {orr}%
                </span>
              </div>

              <div
                className="h-8 w-full rounded-lg overflow-visible flex text-[9px] font-mono font-bold text-white shadow-inner relative"
                style={{ background: "#e2e8f0", padding: "2px" }}
              >
                {SEGMENTS.map((seg, segIdx) => {
                  const pct = reg[seg.key];
                  if (pct === 0) return null;

                  const isHovered =
                    hovered?.regIdx === regIdx && hovered?.segKey === seg.key;

                  return (
                    <div
                      key={seg.key}
                      className="h-full flex items-center justify-center relative transition-all duration-300"
                      onMouseEnter={() => setHovered({ regIdx, segKey: seg.key })}
                      onMouseLeave={() => setHovered(null)}
                      style={{
                        width: `${pct}%`,
                        background: seg.bg,
                        cursor: "pointer",
                        filter: isHovered ? "brightness(1.15)" : "none",
                        transform: isHovered ? "scaleY(1.15) scaleX(1.02)" : "none",
                        zIndex: isHovered ? 20 : 1,
                        borderRadius:
                          segIdx === 0
                            ? "6px 0 0 6px"
                            : segIdx === SEGMENTS.length - 1
                            ? "0 6px 6px 0"
                            : "0",
                        boxShadow: isHovered
                          ? `0 6px 12px ${seg.glow}, inset 0 1px 1px rgba(255,255,255,0.4)`
                          : "inset 0 1px 1px rgba(255,255,255,0.2)",
                        borderRight: segIdx < SEGMENTS.length - 1 && !isHovered ? "1px solid rgba(255,255,255,0.5)" : "none",
                      }}
                    >
                      <span className="truncate px-1 text-center drop-shadow-md">
                        {renderSegmentLabel(pct, seg.key.toUpperCase())}
                      </span>

                      {isHovered && (
                        <div
                          className="absolute bottom-full mb-3 bg-slate-900 text-white text-[10px] rounded px-3 py-2 shadow-xl pointer-events-none z-50 flex flex-col gap-1 border border-slate-700"
                          style={{
                            minWidth: "160px",
                            transform: "translateX(0)", // Centering will be handled by flex if needed, but relative to bar is tricky. Let's just keep it simple.
                            animation: "fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                          }}
                        >
                          <span className="font-bold text-slate-200">
                            {seg.label}
                          </span>
                          <div className="flex justify-between items-center border-t border-slate-700 pt-1.5 mt-0.5 font-mono">
                            <span className="text-slate-400">Response:</span>
                            <span className="font-extrabold text-white text-xs">{pct}%</span>
                          </div>
                          <div
                            className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-700"
                            style={{ marginTop: "0px" }}
                          />
                          <div
                            className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"
                            style={{ marginTop: "-1px" }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="flex flex-wrap gap-x-5 gap-y-2 p-4 border-t text-[10px] font-bold shadow-inner"
        style={{
          borderColor: "var(--border-subtle)",
          color: "var(--text-secondary)",
          background: "linear-gradient(to bottom, #ffffff, #f8fafc)",
        }}
      >
        {SEGMENTS.map((seg) => (
          <div key={seg.key} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-sm shadow-sm"
              style={{ background: seg.bg }}
            ></span>
            <span className="tracking-wide">{seg.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
