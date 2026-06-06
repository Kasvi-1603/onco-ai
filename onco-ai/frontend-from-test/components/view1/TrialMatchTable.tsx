"use client";

import React from "react";
import { TrialMatch } from "../../lib/types";
import { CheckCircle, AlertTriangle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";

interface TrialMatchTableProps {
  trials: TrialMatch[];
}

// Phase colour map
const PHASE_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  "Phase I":   { bg: "#eff6ff", text: "#1d4ed8", bar: "#60a5fa" },
  "Phase II":  { bg: "#f0fdf4", text: "#15803d", bar: "#4ade80" },
  "Phase III": { bg: "#fefce8", text: "#a16207", bar: "#facc15" },
  "Phase IV":  { bg: "#fdf4ff", text: "#7e22ce", bar: "#c084fc" },
};

const defaultPhase = { bg: "#f1f5f9", text: "#475569", bar: "#94a3b8" };

interface TrialTooltipPayload {
  value: number;
}

interface TrialTooltipProps {
  active?: boolean;
  payload?: TrialTooltipPayload[];
  label?: string;
}

const CustomBarTooltip = ({ active, payload, label }: TrialTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="rounded-lg px-3 py-2 shadow-lg text-xs"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <p className="font-bold mb-1" style={{ color: "var(--navy)" }}>{label}</p>
        <p className="font-mono font-bold" style={{ color: "#2563eb" }}>
          Match: {Math.round(payload[0].value * 100)}%
        </p>
      </div>
    );
  }
  return null;
};

export default function TrialMatchTable({ trials }: TrialMatchTableProps) {
  // Build chart data from trials
  const chartData = trials.map((t) => ({
    name: t.nct_id,
    score: t.match_score ?? 0,
    phase: t.phase,
    hasConflicts: t.conflicts && t.conflicts.length > 0,
  }));

  return (
    <div
      className="rounded-lg shadow-sm card-accent-green"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3.5 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <h3
          className="text-xs font-bold uppercase tracking-wider flex items-center gap-2"
          style={{ color: "var(--navy)" }}
        >
          <span
            className="w-1.5 h-3.5 rounded-sm"
            style={{ background: "var(--clinical-green)" }}
          />
          Matched Clinical Trials
        </h3>
        <span
          className="text-[10px] font-bold px-2.5 py-0.5 rounded border"
          style={{
            background: "var(--clinical-green-bg)",
            color: "var(--clinical-green)",
            borderColor: "var(--clinical-green-border)",
          }}
        >
          {trials.length} Match{trials.length !== 1 ? "es" : ""}
        </span>
      </div>

      {/* Match Score Bar Chart */}
      {chartData.length > 0 && (
        <div
          className="px-4 pt-4 pb-2 border-b"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <p
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              Trial Match Score Overview
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {Object.entries(PHASE_COLORS).map(([phase, c]) => (
                <span
                  key={phase}
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: c.bg, color: c.text }}
                >
                  {phase}
                </span>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={90}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 50, left: 10, bottom: 0 }}
              barSize={18}
            >
              <XAxis
                type="number"
                domain={[0, 1]}
                tickFormatter={(v) => `${Math.round(v * 100)}%`}
                tick={{ fontSize: 9, fill: "var(--text-muted)", fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={90}
                tick={{ fontSize: 10, fill: "var(--text-secondary)", fontWeight: 700, fontFamily: "monospace" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
              <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => {
                  const c = PHASE_COLORS[entry.phase] ?? defaultPhase;
                  return <Cell key={`cell-${index}`} fill={c.bar} />;
                })}
                <LabelList
                  dataKey="score"
                  position="right"
                  formatter={(v: number | string) => `${Math.round(Number(v) * 100)}%`}
                  style={{ fontSize: 10, fontWeight: 700, fill: "var(--text-secondary)", fontFamily: "monospace" }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Trial Cards */}
      <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
        {trials.map((trial) => {
          const hasConflicts = trial.conflicts && trial.conflicts.length > 0;
          const phaseColor = PHASE_COLORS[trial.phase] ?? defaultPhase;
          const matchPct = trial.match_score ? Math.round(trial.match_score * 100) : null;

          return (
            <div
              key={trial.nct_id}
              className="p-4 transition-colors hover:bg-slate-50/40 space-y-2.5"
            >
              {/* Title row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-xs font-bold font-mono px-2 py-0.5 rounded"
                      style={{
                        background: "var(--navy-muted)",
                        color: "var(--navy-light)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      {trial.nct_id}
                    </span>
                    <span
                      className="text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase font-mono"
                      style={{ background: phaseColor.bg, color: phaseColor.text }}
                    >
                      {trial.phase}
                    </span>
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border"
                      style={{
                        background: "var(--clinical-green-bg)",
                        color: "var(--clinical-green)",
                        borderColor: "var(--clinical-green-border)",
                      }}
                    >
                      <CheckCircle className="w-2.5 h-2.5" />
                      Eligible
                    </span>
                    {matchPct !== null && (
                      <span
                        className="text-[10px] font-extrabold font-mono px-2 py-0.5 rounded border"
                        style={{
                          background: matchPct >= 80 ? "#dcfce7" : matchPct >= 50 ? "#fef9c3" : "#fee2e2",
                          color: matchPct >= 80 ? "#15803d" : matchPct >= 50 ? "#92400e" : "#b91c1c",
                          borderColor: matchPct >= 80 ? "#bbf7d0" : matchPct >= 50 ? "#fde68a" : "#fecaca",
                        }}
                      >
                        {matchPct}% match
                      </span>
                    )}
                  </div>
                  <h4
                    className="text-sm font-bold mt-2.5 leading-normal"
                    style={{ color: "var(--navy)" }}
                  >
                    {trial.trial_title}
                  </h4>
                </div>
              </div>

              {/* Match progress bar inline */}
              {matchPct !== null && (
                <div className="flex items-center gap-2">
                  <div
                    className="flex-1 h-1 rounded-full overflow-hidden"
                    style={{ background: "var(--border-subtle)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${matchPct}%`,
                        background: matchPct >= 80 ? "#16a34a" : matchPct >= 50 ? "#d97706" : "#dc2626",
                      }}
                    />
                  </div>
                  <span
                    className="text-[9px] font-bold font-mono"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {matchPct}%
                  </span>
                </div>
              )}

              {/* Matched criteria */}
              {trial.matched_on && trial.matched_on.length > 0 && (
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span
                    className="text-[10px] font-extrabold uppercase mr-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Matches:
                  </span>
                  {trial.matched_on.map((crit) => (
                    <span
                      key={crit}
                      className="text-[10px] font-bold px-2 py-0.5 rounded border"
                      style={{ background: "#f0f9ff", color: "#0369a1", borderColor: "#bae6fd" }}
                    >
                      {crit}
                    </span>
                  ))}
                </div>
              )}

              {/* Conflicts */}
              {hasConflicts && (
                <div
                  className="flex items-start gap-2.5 p-3 rounded-md border"
                  style={{
                    background: "var(--clinical-amber-bg)",
                    borderColor: "var(--clinical-amber-border)",
                  }}
                >
                  <AlertTriangle
                    className="w-4 h-4 mt-0.5 shrink-0"
                    style={{ color: "var(--clinical-amber)" }}
                  />
                  <div>
                    <div
                      className="text-[10px] font-extrabold uppercase tracking-wider mb-1"
                      style={{ color: "var(--clinical-amber)" }}
                    >
                      Exclusion Risk Warnings
                    </div>
                    <ul
                      className="list-disc list-inside space-y-0.5 text-[10px] font-medium"
                      style={{ color: "var(--clinical-amber)" }}
                    >
                      {trial.conflicts.map((conf, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {conf}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Raw eligibility */}
              <div
                className="text-[10px] leading-relaxed max-h-20 overflow-y-auto p-3 rounded-md border"
                style={{
                  background: "#f8fafc",
                  color: "var(--text-secondary)",
                  borderColor: "var(--border-subtle)",
                }}
              >
                <span
                  className="font-bold block mb-1 text-[9px] uppercase tracking-wider"
                  style={{ color: "var(--navy-light)" }}
                >
                  Eligibility Criteria:
                </span>
                {trial.raw_eligibility}
              </div>
            </div>
          );
        })}
        {trials.length === 0 && (
          <div
            className="py-8 text-center text-sm italic"
            style={{ color: "var(--text-muted)" }}
          >
            No clinical trial matches found for this patient&apos;s profile.
          </div>
        )}
      </div>
    </div>
  );
}
