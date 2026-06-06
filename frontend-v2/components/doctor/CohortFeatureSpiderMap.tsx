"use client";

import { MatchResult } from "@/lib/types";
import { scoreToNormalized } from "@/lib/match-utils";

interface CohortFeatureSpiderMapProps {
  activeCase: MatchResult;
}

const MAX_R = 62;

/** Six-axis hex vertices — same geometry as oncopilot_ui.html */
function hexPoints(scores: number[], maxR = MAX_R): string {
  return scores
    .map((s, i) => {
      const angle = ((i * 60 - 90) * Math.PI) / 180;
      const r = Math.max(0, Math.min(1, s)) * maxR;
      const x = r * Math.cos(angle);
      const y = r * Math.sin(angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function domainAverages(parameters: MatchResult["parameters"]): [number, number, number, number] {
  const slices = [
    parameters.slice(0, 5),
    parameters.slice(5, 10),
    parameters.slice(10, 15),
    parameters.slice(15, 20),
  ];
  return slices.map((slice) => {
    if (!slice.length) return 0;
    return slice.reduce((sum, p) => sum + scoreToNormalized(p.score), 0) / slice.length;
  }) as [number, number, number, number];
}

/** Map 4 domain scores onto 6 radar spokes (matches oncopilot_ui hex layout). */
function fourToSix([path, gen, img, cli]: [number, number, number, number]): number[] {
  return [path, gen, img, cli, (path + gen) / 2, (img + cli) / 2];
}

/** Patient baseline reference — fixed near-full hex from oncopilot_ui.html */
const PATIENT_BASELINE_POINTS =
  "0,-60 54,-27 51,32 -2,62 -52,30 -52,-28";

export default function CohortFeatureSpiderMap({ activeCase }: CohortFeatureSpiderMapProps) {
  const domains = domainAverages(activeCase.parameters);
  const [path, gen, img, cli] = domains;
  const matchPoints = hexPoints(fourToSix(domains));

  const metrics = [
    { key: "genomic", label: "genomic", value: Math.round(gen * 100) },
    { key: "staging", label: "staging", value: Math.round(img * 100) },
    { key: "pathology", label: "pathology", value: Math.round(path * 100) },
    { key: "clinical", label: "clinical", value: Math.round(cli * 100) },
  ];

  const greenCount = activeCase.parameters.filter((p) => p.score === "green").length;

  return (
    <div className="flex items-center gap-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4 mb-0">
      <svg
        className="shrink-0 -rotate-90"
        width="150"
        height="150"
        viewBox="0 0 160 160"
        aria-label="Cohort feature radar"
      >
        <g transform="translate(80,80)">
          {/* Grid rings */}
          <polygon
            points="0,-66 57,-33 57,33 0,66 -57,33 -57,-33"
            fill="none"
            stroke="rgba(15,25,50,0.07)"
            strokeWidth="0.5"
          />
          <polygon
            points="0,-44 38,-22 38,22 0,44 -38,22 -38,-22"
            fill="none"
            stroke="rgba(15,25,50,0.07)"
            strokeWidth="0.5"
          />
          <polygon
            points="0,-22 19,-11 19,11 0,22 -19,11 -19,-11"
            fill="none"
            stroke="rgba(15,25,50,0.07)"
            strokeWidth="0.5"
          />

          {/* TCGA match shape */}
          <polygon
            points={matchPoints}
            fill="rgba(14,165,160,0.1)"
            stroke="#0EA5A0"
            strokeWidth="1.2"
            className="transition-all duration-500 ease-out"
          />

          {/* Patient baseline (dashed reference) */}
          <polygon
            points={PATIENT_BASELINE_POINTS}
            fill="none"
            stroke="#16A34A"
            strokeWidth="1.2"
            strokeDasharray="2,2"
          />

          {/* Spokes */}
          {[0, 60, 120, 180, 240, 300].map((deg) => {
            const a = ((deg - 90) * Math.PI) / 180;
            return (
              <line
                key={deg}
                x1="0"
                y1="0"
                x2={66 * Math.cos(a)}
                y2={66 * Math.sin(a)}
                stroke="rgba(15,25,50,0.07)"
                strokeWidth="0.5"
              />
            );
          })}
        </g>
      </svg>

      <div className="flex-1 flex flex-col gap-1.5 min-w-0">
        <p className="text-[11px] font-medium text-zinc-800 mb-1">
          {activeCase.patient_id} vs Active Patient Metrics Verification
        </p>

        <div className="flex items-center gap-2 text-[11px] text-zinc-500">
          <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
          Patient baseline tracking parameters
        </div>
        <div className="flex items-center gap-2 text-[11px] text-zinc-500">
          <span className="w-2 h-2 rounded-full bg-[#0EA5A0] shrink-0" />
          Targeted TCGA case structural variance mapping
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2">
          {metrics.map(({ key, label, value }) => (
            <div key={key} className="flex justify-between text-[10px]">
              <span className="text-zinc-400 capitalize">{label}</span>
              <span className="text-[#0EA5A0] font-medium">{value}%</span>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-zinc-400 mt-1">
          {greenCount}/20 parameters aligned · {activeCase.similarity_score}% overall
        </p>
      </div>
    </div>
  );
}
