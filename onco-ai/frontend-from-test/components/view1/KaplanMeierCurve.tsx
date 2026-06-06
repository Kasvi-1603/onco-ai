"use client";

import React, { useState } from "react";

export default function KaplanMeierCurve() {
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    label: string;
    value: string;
    sub?: string;
  } | null>(null);

  // OS cohort curve data
  const cohortOSData = [
    { x: 0,  y: 100 },
    { x: 6,  y: 95  },
    { x: 12, y: 82  },
    { x: 18, y: 68  },
    { x: 24, y: 52  },
    { x: 30, y: 40  },
    { x: 36, y: 28  },
    { x: 42, y: 18  },
    { x: 48, y: 10  },
  ];

  // Patient projected OS
  const patientOSData = [
    { x: 0,  y: 100 },
    { x: 6,  y: 98  },
    { x: 12, y: 90  },
    { x: 18, y: 80  },
    { x: 24, y: 68  },
    { x: 30, y: 55  },
    { x: 36, y: 42  },
    { x: 42, y: 30  },
    { x: 48, y: 20  },
  ];

  // PFS cohort curve
  const cohortPFSData = [
    { x: 0,  y: 100 },
    { x: 6,  y: 88  },
    { x: 12, y: 72  },
    { x: 18, y: 54  },
    { x: 24, y: 35  },
    { x: 30, y: 22  },
    { x: 36, y: 12  },
    { x: 42, y: 6   },
    { x: 48, y: 3   },
  ];

  // 95% CI upper/lower for OS cohort (used as shaded band)
  const ciUpperData = [
    { x: 0,  y: 100 },
    { x: 6,  y: 98  },
    { x: 12, y: 88  },
    { x: 18, y: 76  },
    { x: 24, y: 62  },
    { x: 30, y: 50  },
    { x: 36, y: 37  },
    { x: 42, y: 26  },
    { x: 48, y: 18  },
  ];

  const ciLowerData = [
    { x: 0,  y: 100 },
    { x: 6,  y: 91  },
    { x: 12, y: 76  },
    { x: 18, y: 60  },
    { x: 24, y: 43  },
    { x: 30, y: 31  },
    { x: 36, y: 20  },
    { x: 42, y: 11  },
    { x: 48, y: 4   },
  ];

  // SVG layout
  const width   = 520;
  const height  = 220;
  const padL    = 40;
  const padR    = 20;
  const padT    = 16;
  const padB    = 38;

  const toSvgX = (month: number) => padL + (month / 48) * (width - padL - padR);
  const toSvgY = (pct: number)   => padT + (1 - pct / 100) * (height - padT - padB);

  // Build step path (KM style)
  const stepPath = (data: { x: number; y: number }[]) => {
    let d = "";
    data.forEach((p, idx) => {
      const cx = toSvgX(p.x);
      const cy = toSvgY(p.y);
      if (idx === 0) {
        d += `M ${cx} ${cy}`;
      } else {
        const prevY = toSvgY(data[idx - 1].y);
        d += ` L ${cx} ${prevY} L ${cx} ${cy}`;
      }
    });
    return d;
  };

  // Build CI polygon (upper forward then lower backward)
  const ciPolygon = () => {
    const upper = ciUpperData.map((p) => `${toSvgX(p.x)},${toSvgY(p.y)}`).join(" L ");
    const lowerRev = [...ciLowerData].reverse().map((p) => `${toSvgX(p.x)},${toSvgY(p.y)}`).join(" L ");
    return `M ${upper} L ${lowerRev} Z`;
  };

  // Median OS reference line (38.6m ≈ between 36 and 42)
  const medianOSX = toSvgX(38.6);
  // Median PFS reference line (18.9m ≈ between 18 and 24)
  const medianPFSX = toSvgX(18.9);

  const benchmarks = [
    { month: 12, label: "12m" },
    { month: 24, label: "24m" },
    { month: 36, label: "36m" },
  ];

  return (
    <div
      className="rounded-lg shadow-sm card-accent-indigo p-4 flex flex-col md:flex-row gap-4"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div className="flex-1 min-w-0">
        {/* Chart Header */}
        <div
          className="flex items-center justify-between pb-2 border-b mb-4"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <div>
            <h4
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: "var(--navy)" }}
            >
              Kaplan-Meier Survival Analysis
            </h4>
            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              Overall &amp; Progression-Free survival · 95% CI band shown for cohort OS
            </p>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold">
            <span className="flex items-center gap-1.5" style={{ color: "#6366f1" }}>
              <span className="w-5 h-0.5 inline-block bg-indigo-500 rounded" />
              OS Cohort
            </span>
            <span className="flex items-center gap-1.5" style={{ color: "#16a34a" }}>
              <span
                className="w-5 h-0.5 inline-block rounded"
                style={{ background: "repeating-linear-gradient(90deg,#16a34a 0,#16a34a 4px,transparent 4px,transparent 7px)" }}
              />
              OS Projected
            </span>
            <span className="flex items-center gap-1.5" style={{ color: "#d97706" }}>
              <span className="w-5 h-0.5 inline-block bg-amber-500 rounded" style={{ borderBottom: "2px dotted #d97706", background: "none" }} />
              PFS Cohort
            </span>
            <span className="flex items-center gap-1.5" style={{ color: "#6366f1", opacity: 0.4 }}>
              <span className="w-5 h-3 inline-block rounded" style={{ background: "#6366f1", opacity: 0.15 }} />
              95% CI
            </span>
          </div>
        </div>

        {/* SVG Chart */}
        <div className="relative">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto overflow-visible select-none"
          >
            {/* Y-axis grid + labels */}
            {[0, 25, 50, 75, 100].map((gridY) => {
              const yPos = toSvgY(gridY);
              return (
                <g key={gridY}>
                  <line
                    x1={padL} y1={yPos} x2={width - padR} y2={yPos}
                    stroke="var(--border-subtle)" strokeWidth="1" strokeDasharray="3 3"
                  />
                  <text
                    x={padL - 6} y={yPos + 3.5}
                    textAnchor="end" fontSize={9}
                    fontWeight={600} fontFamily="monospace"
                    fill="var(--text-muted)"
                  >
                    {gridY}%
                  </text>
                </g>
              );
            })}

            {/* X-axis labels */}
            {[0, 6, 12, 18, 24, 30, 36, 42, 48].map((month) => {
              const xPos = toSvgX(month);
              return (
                <g key={month}>
                  <line
                    x1={xPos} y1={height - padB}
                    x2={xPos} y2={height - padB + 4}
                    stroke="var(--border)" strokeWidth="1"
                  />
                  <text
                    x={xPos} y={height - padB + 16}
                    textAnchor="middle" fontSize={9}
                    fontWeight={600} fontFamily="monospace"
                    fill="var(--text-muted)"
                  >
                    {month}m
                  </text>
                </g>
              );
            })}

            {/* Axis label: Y */}
            <text
              x={10} y={(height) / 2}
              textAnchor="middle" fontSize={9}
              fontWeight={700} fill="var(--text-muted)"
              transform={`rotate(-90, 10, ${height / 2})`}
            >
              Survival %
            </text>

            {/* Axes */}
            <line x1={padL} y1={padT} x2={padL} y2={height - padB} stroke="var(--border)" strokeWidth="1.5" />
            <line x1={padL} y1={height - padB} x2={width - padR} y2={height - padB} stroke="var(--border)" strokeWidth="1.5" />

            {/* 95% CI band */}
            <path d={ciPolygon()} fill="#6366f1" opacity="0.10" />

            {/* Benchmark dashed verticals */}
            {benchmarks.map(({ month, label }) => (
              <g key={month}>
                <line
                  x1={toSvgX(month)} y1={padT}
                  x2={toSvgX(month)} y2={height - padB}
                  stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4 3"
                />
                <text
                  x={toSvgX(month)} y={padT - 4}
                  textAnchor="middle" fontSize={8}
                  fill="#94a3b8" fontWeight={600}
                >
                  {label}
                </text>
              </g>
            ))}

            {/* Median OS vertical marker */}
            <line
              x1={medianOSX} y1={toSvgY(50)}
              x2={medianOSX} y2={height - padB}
              stroke="#6366f1" strokeWidth="1.5" strokeDasharray="6 3" opacity="0.7"
            />
            <text x={medianOSX + 3} y={toSvgY(50) - 3} fontSize={8} fill="#6366f1" fontWeight={700}>
              OS med
            </text>

            {/* Median PFS vertical marker */}
            <line
              x1={medianPFSX} y1={toSvgY(50)}
              x2={medianPFSX} y2={height - padB}
              stroke="#d97706" strokeWidth="1.5" strokeDasharray="6 3" opacity="0.7"
            />
            <text x={medianPFSX + 3} y={toSvgY(50) - 3} fontSize={8} fill="#d97706" fontWeight={700}>
              PFS med
            </text>

            {/* 50% horizontal reference */}
            <line
              x1={padL} y1={toSvgY(50)}
              x2={width - padR} y2={toSvgY(50)}
              stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2"
            />

            {/* PFS cohort curve */}
            <path
              d={stepPath(cohortPFSData)}
              fill="none"
              stroke="#d97706"
              strokeWidth="2"
              strokeDasharray="3 2"
              opacity="0.85"
            />

            {/* OS Cohort Curve */}
            <path
              d={stepPath(cohortOSData)}
              fill="none"
              stroke="#6366f1"
              strokeWidth="2.5"
            />

            {/* Patient Projected OS */}
            <path
              d={stepPath(patientOSData)}
              fill="none"
              stroke="#16a34a"
              strokeWidth="2"
              strokeDasharray="5 3"
            />

            {/* Interactive circles on OS cohort */}
            {cohortOSData.map((pt, idx) => {
              const cx = toSvgX(pt.x);
              const cy = toSvgY(pt.y);
              return (
                <circle
                  key={idx}
                  cx={cx} cy={cy} r={4}
                  fill="#ffffff" stroke="#6366f1" strokeWidth="2"
                  className="cursor-pointer"
                  onMouseEnter={() =>
                    setHoveredPoint({
                      x: cx, y: cy,
                      label: `OS Cohort · ${pt.x}m`,
                      value: `${pt.y}%`,
                      sub: `CI: ${ciLowerData[idx]?.y}–${ciUpperData[idx]?.y}%`,
                    })
                  }
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              );
            })}

            {/* Interactive circles on PFS cohort */}
            {cohortPFSData.map((pt, idx) => {
              const cx = toSvgX(pt.x);
              const cy = toSvgY(pt.y);
              return (
                <circle
                  key={`pfs-${idx}`}
                  cx={cx} cy={cy} r={3}
                  fill="#ffffff" stroke="#d97706" strokeWidth="2"
                  className="cursor-pointer"
                  onMouseEnter={() =>
                    setHoveredPoint({
                      x: cx, y: cy,
                      label: `PFS Cohort · ${pt.x}m`,
                      value: `${pt.y}%`,
                    })
                  }
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              );
            })}
          </svg>

          {/* Hover Tooltip */}
          {hoveredPoint && (
            <div
              className="absolute z-20 pointer-events-none px-3 py-2 rounded-lg shadow-lg text-[10px] font-bold border"
              style={{
                left: `${(hoveredPoint.x / width) * 100}%`,
                top: `${(hoveredPoint.y / height) * 100}%`,
                transform: "translate(-50%, -120%)",
                background: "var(--surface)",
                borderColor: "var(--border)",
                color: "var(--navy)",
                minWidth: 140,
              }}
            >
              <div className="mb-0.5">{hoveredPoint.label}</div>
              <div className="font-mono text-indigo-600">{hoveredPoint.value} survival</div>
              {hoveredPoint.sub && (
                <div className="font-mono text-slate-400 text-[9px] mt-0.5">{hoveredPoint.sub}</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Stats Panel */}
      <div
        className="w-full md:w-52 shrink-0 flex flex-col justify-center border-t md:border-t-0 md:border-l pl-0 md:pl-4 pt-4 md:pt-0 space-y-4"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <h5
          className="text-[10px] font-bold uppercase tracking-wider"
          style={{ color: "var(--text-muted)" }}
        >
          Survival Benchmarks
        </h5>

        {[
          { label: "12-Month OS Rate", value: "82.4%", color: "#6366f1" },
          { label: "24-Month OS Rate", value: "52.1%", color: "#6366f1" },
          { label: "18-Month PFS Rate", value: "54.0%", color: "#d97706" },
          { label: "Projected OS Benefit", value: "▲ +6.4 mos", color: "#16a34a" },
        ].map(({ label, value, color }) => (
          <div key={label}>
            <div
              className="text-[9px] uppercase font-bold mb-0.5"
              style={{ color: "var(--text-muted)" }}
            >
              {label}
            </div>
            <div
              className="text-base font-bold font-mono"
              style={{ color }}
            >
              {value}
            </div>
          </div>
        ))}

        {/* Mini PFS vs OS comparison bars */}
        <div className="space-y-2 pt-2 border-t" style={{ borderColor: "var(--border-subtle)" }}>
          <p className="text-[9px] uppercase font-bold" style={{ color: "var(--text-muted)" }}>
            Cohort at 24m
          </p>
          {[
            { label: "OS", pct: 52, color: "#6366f1" },
            { label: "PFS", pct: 35, color: "#d97706" },
          ].map(({ label, pct, color }) => (
            <div key={label} className="flex items-center gap-2">
              <span
                className="text-[10px] font-bold font-mono w-6"
                style={{ color }}
              >
                {label}
              </span>
              <div
                className="flex-1 h-1.5 rounded-full overflow-hidden"
                style={{ background: "var(--border-subtle)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>
              <span
                className="text-[9px] font-mono font-bold"
                style={{ color: "var(--text-muted)" }}
              >
                {pct}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
