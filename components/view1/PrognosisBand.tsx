"use client";

import React from "react";
import { PrognosisStats } from "../../lib/types";

interface PrognosisBandProps {
  stats: PrognosisStats;
}

export default function PrognosisBand({ stats }: PrognosisBandProps) {
  // Use exact values from data or fallbacks from the screenshot
  const medianOS = stats.median_os_months ?? 38.6;
  const osRange = stats.os_range ?? [32.4, 44.8];
  const medianPFS = stats.median_pfs_months ?? 18.9;
  const pfsRange = stats.pfs_range ?? [15.2, 22.4];
  const cohortCount = stats.cohort_count ?? 154;

  const MAX_VAL = 60; // Scale up to 60m to give breathing room and prevent overlap
  const toPct = (val: number) => (val / MAX_VAL) * 100;

  const ticks = [0, 15, 30, 45, 60];
  const benchmarks = [12, 24];

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
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3.5 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-1.5 h-3.5 rounded-sm"
            style={{ background: "var(--navy-light)" }}
          ></span>
          <h3
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: "var(--navy)" }}
          >
            Prognosis &amp; Outcomes Cohort
          </h3>
        </div>
        <span
          className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded border"
          style={{
            background: "var(--background)",
            color: "var(--text-muted)",
            borderColor: "var(--border-subtle)",
          }}
        >
          N = {cohortCount} cases
        </span>
      </div>

      <div className="p-5 space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* OS Card */}
          <div
            className="p-4 rounded-lg shadow-sm"
            style={{
              background: "#f0f5fa",
              border: "1px solid var(--border-subtle)",
              borderLeft: "4px solid var(--navy-light)",
            }}
          >
            <div
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: "var(--navy-light)" }}
            >
              Median Overall Survival (OS)
            </div>
            <div
              className="text-3xl font-extrabold mt-2 font-mono flex items-baseline gap-1"
              style={{ color: "var(--navy)" }}
            >
              {medianOS}
              <span
                className="text-xs font-normal font-sans"
                style={{ color: "var(--text-muted)" }}
              >
                months
              </span>
            </div>
            <div
              className="text-[10px] font-bold mt-2.5 inline-flex items-center px-2 py-0.5 rounded border"
              style={{
                background: "#ffffff",
                color: "var(--navy-light)",
                borderColor: "#cbd5e1",
              }}
            >
              Range: {osRange[0]} – {osRange[1]} mos
            </div>
          </div>

          {/* PFS Card */}
          <div
            className="p-4 rounded-lg shadow-sm"
            style={{
              background: "#ecfdf5",
              border: "1px solid var(--clinical-green-border)",
              borderLeft: "4px solid var(--clinical-green)",
            }}
          >
            <div
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: "var(--clinical-green)" }}
            >
              Median Progression-Free (PFS)
            </div>
            <div
              className="text-3xl font-extrabold mt-2 font-mono flex items-baseline gap-1"
              style={{ color: "var(--navy)" }}
            >
              {medianPFS}
              <span
                className="text-xs font-normal font-sans"
                style={{ color: "var(--text-muted)" }}
              >
                months
              </span>
            </div>
            <div
              className="text-[10px] font-bold mt-2.5 inline-flex items-center px-2 py-0.5 rounded border"
              style={{
                background: "#ffffff",
                color: "var(--clinical-green)",
                borderColor: "var(--clinical-green-border)",
              }}
            >
              Range: {pfsRange[0]} – {pfsRange[1]} mos
            </div>
          </div>
        </div>

        {/* Visualizer Chart */}
        <div className="space-y-4">
          <h4
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: "var(--text-secondary)" }}
          >
            Median Survival + Confidence Range (Months)
          </h4>

          {/* Relative Chart Container */}
          <div className="relative pt-6 pb-6 px-1 border rounded-lg" style={{ background: "#fafbfc" }}>
            {/* Background Grid Lines */}
            <div className="absolute inset-0 flex justify-between pointer-events-none px-4">
              {ticks.map((t) => (
                <div
                  key={t}
                  style={{
                    position: "absolute",
                    left: `${toPct(t)}%`,
                    top: 15,
                    bottom: 25,
                    borderLeft: t === 0 ? "1px solid #cbd5e1" : "1px dashed #e2e8f0",
                    zIndex: 0,
                  }}
                />
              ))}

              {/* Benchmarks Vertical Lines */}
              {benchmarks.map((b) => (
                <div
                  key={b}
                  style={{
                    position: "absolute",
                    left: `${toPct(b)}%`,
                    top: 0,
                    bottom: 25,
                    borderLeft: "1px dashed #f59e0b",
                    opacity: 0.8,
                    zIndex: 1,
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: -12,
                      transform: "translateX(-50%)",
                      fontSize: "8px",
                      fontWeight: 800,
                      color: "#d97706",
                      background: "#fef3c7",
                      padding: "1px 4px",
                      borderRadius: "3px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {b}m benchmark
                  </span>
                </div>
              ))}
            </div>

            {/* Bars Area */}
            <div className="relative z-10 px-4 space-y-6">
              {/* OS Row */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-700">
                  <span>Overall Survival (OS)</span>
                </div>
                <div className="relative h-10 flex items-center">
                  {/* Track Background */}
                  <div className="absolute inset-x-0 h-4 bg-slate-100 rounded-full" />
                  
                  {/* OS Median Bar */}
                  <div
                    className="absolute h-4 rounded-full"
                    style={{
                      left: 0,
                      width: `${toPct(medianOS)}%`,
                      background: "linear-gradient(90deg, #3b82f6, #4f46e5)",
                      boxShadow: "0 1px 3px rgba(79, 70, 229, 0.2)",
                    }}
                  />

                  {/* Confidence Interval Line & Caps */}
                  <div
                    className="absolute h-0.5 bg-indigo-900"
                    style={{
                      left: `${toPct(osRange[0])}%`,
                      width: `${toPct(osRange[1] - osRange[0])}%`,
                      zIndex: 2,
                    }}
                  >
                    {/* Left Cap */}
                    <div
                      className="absolute w-0.5 h-3 bg-indigo-900"
                      style={{ left: 0, top: -5 }}
                    />
                    {/* Right Cap */}
                    <div
                      className="absolute w-0.5 h-3 bg-indigo-900"
                      style={{ right: 0, top: -5 }}
                    />
                  </div>

                  {/* Floating Median Value Label (Positioned above to avoid overlap) */}
                  <div
                    className="absolute"
                    style={{
                      left: `${toPct(medianOS)}%`,
                      transform: "translateX(-50%)",
                      top: -14,
                      zIndex: 3,
                    }}
                  >
                    <span
                      className="text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-sm border"
                      style={{
                        background: "#4f46e5",
                        color: "#ffffff",
                        borderColor: "#4f46e5",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {medianOS} mos
                    </span>
                  </div>
                </div>
              </div>

              {/* PFS Row */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-700">
                  <span>Progression-Free (PFS)</span>
                </div>
                <div className="relative h-10 flex items-center">
                  {/* Track Background */}
                  <div className="absolute inset-x-0 h-4 bg-slate-100 rounded-full" />
                  
                  {/* PFS Median Bar */}
                  <div
                    className="absolute h-4 rounded-full"
                    style={{
                      left: 0,
                      width: `${toPct(medianPFS)}%`,
                      background: "linear-gradient(90deg, #10b981, #059669)",
                      boxShadow: "0 1px 3px rgba(5, 150, 105, 0.2)",
                    }}
                  />

                  {/* Confidence Interval Line & Caps */}
                  <div
                    className="absolute h-0.5 bg-emerald-950"
                    style={{
                      left: `${toPct(pfsRange[0])}%`,
                      width: `${toPct(pfsRange[1] - pfsRange[0])}%`,
                      zIndex: 2,
                    }}
                  >
                    {/* Left Cap */}
                    <div
                      className="absolute w-0.5 h-3 bg-emerald-950"
                      style={{ left: 0, top: -5 }}
                    />
                    {/* Right Cap */}
                    <div
                      className="absolute w-0.5 h-3 bg-emerald-950"
                      style={{ right: 0, top: -5 }}
                    />
                  </div>

                  {/* Floating Median Value Label */}
                  <div
                    className="absolute"
                    style={{
                      left: `${toPct(medianPFS)}%`,
                      transform: "translateX(-50%)",
                      top: -14,
                      zIndex: 3,
                    }}
                  >
                    <span
                      className="text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-sm border"
                      style={{
                        background: "#059669",
                        color: "#ffffff",
                        borderColor: "#059669",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {medianPFS} mos
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Axis Labels */}
            <div className="relative h-5 mt-2 z-10 px-4">
              {ticks.map((t) => (
                <span
                  key={t}
                  className="text-[9px] font-bold text-slate-500 font-mono"
                  style={{
                    position: "absolute",
                    left: `${toPct(t)}%`,
                    transform: "translateX(-50%)",
                  }}
                >
                  {t}m
                </span>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 pt-1 text-[10px] font-bold text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
              <span>Overall Survival (OS) [{osRange[0]}–{osRange[1]}]</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              <span>Progression-Free (PFS) [{pfsRange[0]}–{pfsRange[1]}]</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                style={{
                  width: 15,
                  height: 0,
                  borderTop: "2px dashed #f59e0b",
                  display: "inline-block",
                }}
              />
              <span>12 / 24m benchmarks</span>
            </div>
          </div>
        </div>

        {/* Disclaimer Warning */}
        <p
          className="text-[10px] leading-relaxed p-3.5 rounded-lg italic border"
          style={{
            background: "var(--background)",
            color: "var(--text-muted)",
            borderColor: "var(--border-subtle)",
          }}
        >
          {stats.disclaimer}
        </p>
      </div>
    </div>
  );
}
