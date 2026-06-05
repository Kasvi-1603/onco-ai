"use client";

import React, { useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { SimilarCohort } from "../../lib/types";

interface CohortSpiderMapProps {
  cohorts: SimilarCohort[];
}

const COHORT_COLORS = [
  { stroke: "#4f46e5", fill: "#4f46e5", name: "Indigo" },
  { stroke: "#059669", fill: "#059669", name: "Emerald" },
  { stroke: "#d97706", fill: "#d97706", name: "Amber" },
  { stroke: "#7c3aed", fill: "#7c3aed", name: "Violet" },
  { stroke: "#dc2626", fill: "#dc2626", name: "Rose" },
];

// Score → semantic colour
const scoreColor = (s: number) =>
  s >= 0.85 ? "#059669" : s >= 0.6 ? "#d97706" : "#dc2626";

const scoreBg = (s: number) =>
  s >= 0.85 ? "#dcfce7" : s >= 0.6 ? "#fef3c7" : "#fee2e2";

// Custom polar axis tick that renders text with better styling
const CustomAngleTick = ({ x, y, payload, cx, cy }: any) => {
  const dx = x - cx;
  const dy = y - cy;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  const anchor = Math.abs(dx) < 10 ? "middle" : dx > 0 ? "start" : "end";
  const extraX = dx < -5 ? -6 : dx > 5 ? 6 : 0;
  const extraY = dy < -5 ? -6 : dy > 5 ? 8 : 0;
  return (
    <g>
      <text
        x={x + extraX}
        y={y + extraY}
        textAnchor={anchor}
        dominantBaseline="middle"
        style={{ fontSize: 12, fontWeight: 700, fill: "#1e293b", fontFamily: "system-ui, sans-serif" }}
      >
        {payload.value}
      </text>
    </g>
  );
};

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        padding: "10px 14px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        minWidth: 180,
      }}
    >
      <p style={{ fontWeight: 700, fontSize: 11, color: "#0f172a", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
        {label}
      </p>
      {payload.map((entry: any, i: number) => (
        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 4 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: entry.color, fontSize: 11, fontWeight: 600 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: entry.color, display: "inline-block" }} />
            {entry.name.split(" (")[0]}
          </span>
          <span style={{
            fontWeight: 800, fontSize: 12, fontFamily: "monospace",
            color: scoreColor(entry.value),
            background: scoreBg(entry.value),
            padding: "1px 6px", borderRadius: 4
          }}>
            {Math.round(entry.value * 100)}%
          </span>
        </div>
      ))}
    </div>
  );
};

export default function CohortSpiderMap({ cohorts }: CohortSpiderMapProps) {
  const [activeCohorts, setActiveCohorts] = useState<Set<string>>(
    new Set(cohorts.map((c) => c.cohort_id))
  );

  const allParams = Array.from(
    new Set(cohorts.flatMap((c) => c.param_breakdown.map((p) => p.param)))
  );

  const radarData = allParams.map((param) => {
    const point: Record<string, any> = { param };
    cohorts.forEach((cohort) => {
      const match = cohort.param_breakdown.find((p) => p.param === param);
      point[cohort.cohort_id] = match ? match.score : 0;
    });
    return point;
  });

  const toggleCohort = (id: string) => {
    setActiveCohorts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size === 1) return prev;
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        marginTop: 16,
        overflow: "hidden",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 20px",
          borderBottom: "1px solid #f1f5f9",
          flexWrap: "wrap",
          gap: 8,
          background: "linear-gradient(to right, #fafbff, #f8fafc)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 4, height: 20, borderRadius: 3, background: "linear-gradient(180deg, #4f46e5, #7c3aed)" }} />
          <div>
            <p style={{ fontWeight: 800, fontSize: 12, color: "#0f172a", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Cohort Feature Spider Map
            </p>
            <p style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>
              Per-parameter match scores — hover on chart for details
            </p>
          </div>
        </div>

        {/* Toggle chips */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {cohorts.map((cohort, i) => {
            const color = COHORT_COLORS[i % COHORT_COLORS.length];
            const isActive = activeCohorts.has(cohort.cohort_id);
            const pct = Math.round(cohort.overall_score * 100);
            return (
              <button
                key={cohort.cohort_id}
                onClick={() => toggleCohort(cohort.cohort_id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px",
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 700,
                  border: `2px solid ${color.stroke}`,
                  background: isActive ? color.stroke + "15" : "transparent",
                  color: isActive ? color.stroke : "#94a3b8",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  opacity: isActive ? 1 : 0.5,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: isActive ? color.stroke : "#cbd5e1",
                    display: "inline-block",
                    transition: "background 0.15s",
                  }}
                />
                {cohort.cohort_id}
                <span
                  style={{
                    background: isActive ? color.stroke : "#e2e8f0",
                    color: isActive ? "#fff" : "#94a3b8",
                    borderRadius: 999,
                    padding: "0 5px",
                    fontSize: 10,
                    fontWeight: 800,
                    fontFamily: "monospace",
                  }}
                >
                  {pct}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart + Legend row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 0 }}>
        {/* Radar */}
        <div style={{ flex: 1, minWidth: 0, padding: "8px 8px 8px 8px" }}>
          <ResponsiveContainer width="100%" height={360}>
            <RadarChart data={radarData} margin={{ top: 28, right: 48, bottom: 28, left: 48 }}>
              <PolarGrid
                stroke="#e2e8f0"
                strokeDasharray="0"
                strokeWidth={1}
              />
              <PolarAngleAxis
                dataKey="param"
                tick={<CustomAngleTick />}
                tickLine={false}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 1]}
                tickCount={6}
                tick={{ fill: "#94a3b8", fontSize: 9, fontFamily: "monospace" }}
                tickFormatter={(v) => v === 0 ? "" : `${Math.round(v * 100)}%`}
                axisLine={false}
                tickLine={false}
              />
              {cohorts.map((cohort, i) => {
                const color = COHORT_COLORS[i % COHORT_COLORS.length];
                if (!activeCohorts.has(cohort.cohort_id)) return null;
                return (
                  <Radar
                    key={cohort.cohort_id}
                    name={`${cohort.cohort_id} (${cohort.primary_mutation})`}
                    dataKey={cohort.cohort_id}
                    stroke={color.stroke}
                    fill={color.fill}
                    fillOpacity={0.14}
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: color.stroke, strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 6, fill: color.stroke, stroke: "#fff", strokeWidth: 2 }}
                  />
                );
              })}
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Right legend panel */}
        <div
          style={{
            width: 200,
            flexShrink: 0,
            borderLeft: "1px solid #f1f5f9",
            padding: "20px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Overall Match
          </p>
          {cohorts.map((cohort, i) => {
            const color = COHORT_COLORS[i % COHORT_COLORS.length];
            const isActive = activeCohorts.has(cohort.cohort_id);
            const pct = Math.round(cohort.overall_score * 100);
            return (
              <div
                key={cohort.cohort_id}
                style={{ opacity: isActive ? 1 : 0.35, transition: "opacity 0.15s" }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: color.stroke, display: "inline-block" }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#334155" }}>{cohort.cohort_id}</span>
                  </span>
                  <span style={{ fontWeight: 800, fontSize: 12, fontFamily: "monospace", color: scoreColor(cohort.overall_score) }}>
                    {pct}%
                  </span>
                </div>
                {/* Full-width progress bar */}
                <div style={{ height: 6, borderRadius: 999, background: "#f1f5f9", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${pct}%`,
                      borderRadius: 999,
                      background: `linear-gradient(90deg, ${color.stroke}aa, ${color.stroke})`,
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
                <p style={{ fontSize: 9, color: "#94a3b8", marginTop: 3, fontStyle: "italic" }}>
                  {cohort.primary_mutation}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Score breakdown table */}
      <div style={{ borderTop: "1px solid #f1f5f9", overflow: "hidden" }}>
        <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              <th style={{ padding: "8px 20px", textAlign: "left", fontWeight: 700, fontSize: 10, color: "#475569", letterSpacing: "0.07em", textTransform: "uppercase", borderBottom: "1px solid #e2e8f0" }}>
                Parameter
              </th>
              {cohorts.map((c, i) => (
                <th
                  key={c.cohort_id}
                  style={{
                    padding: "8px 16px",
                    textAlign: "center",
                    fontWeight: 800,
                    fontSize: 10,
                    color: COHORT_COLORS[i % COHORT_COLORS.length].stroke,
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    borderBottom: "1px solid #e2e8f0",
                    borderLeft: "1px solid #f1f5f9",
                  }}
                >
                  {c.cohort_id}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allParams.map((param, rowIdx) => (
              <tr
                key={param}
                style={{ background: rowIdx % 2 === 0 ? "#fff" : "#f8fafc" }}
              >
                <td style={{ padding: "8px 20px", fontWeight: 600, color: "#334155", borderBottom: "1px solid #f1f5f9" }}>
                  {param}
                </td>
                {cohorts.map((cohort, ci) => {
                  const match = cohort.param_breakdown.find((p) => p.param === param);
                  const score = match ? match.score : null;
                  const color = COHORT_COLORS[ci % COHORT_COLORS.length];
                  return (
                    <td
                      key={cohort.cohort_id}
                      style={{
                        padding: "8px 16px",
                        textAlign: "center",
                        borderBottom: "1px solid #f1f5f9",
                        borderLeft: "1px solid #f1f5f9",
                      }}
                    >
                      {score !== null ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                          <span style={{ fontWeight: 800, fontSize: 12, fontFamily: "monospace", color: scoreColor(score) }}>
                            {Math.round(score * 100)}%
                          </span>
                          {/* Full-width bar */}
                          <div style={{ width: "80%", height: 4, borderRadius: 999, background: "#f1f5f9", overflow: "hidden" }}>
                            <div
                              style={{
                                height: "100%",
                                width: `${Math.round(score * 100)}%`,
                                borderRadius: 999,
                                background: `linear-gradient(90deg, ${color.stroke}88, ${color.stroke})`,
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: "#cbd5e1" }}>—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
