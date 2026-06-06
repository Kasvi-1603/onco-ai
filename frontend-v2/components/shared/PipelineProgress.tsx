"use client";

export type PipelineStep = "ingest" | "validate" | "match" | "documents" | "ready";

const STEPS: { id: PipelineStep; label: string; detail: string }[] = [
  { id: "ingest", label: "Ingest EHR JSON", detail: "Reading patient record file" },
  { id: "validate", label: "Validate Profile", detail: "Pathology · Genomics · Imaging · Clinical" },
  { id: "match", label: "TCGA Similarity Match", detail: "Scoring against 100 TCGA-LUAD cases" },
  { id: "documents", label: "Generate Drafts", detail: "Treatment plan · MDT brief · Summary" },
  { id: "ready", label: "Ready for Review", detail: "Dashboard unlocked" },
];

const ORDER = STEPS.map((s) => s.id);

interface PipelineProgressProps {
  step: PipelineStep;
  compact?: boolean;
}

export default function PipelineProgress({ step, compact }: PipelineProgressProps) {
  const currentIdx = ORDER.indexOf(step);

  return (
    <div
      className={`rounded-xl border border-zinc-200 bg-white shadow-sm ${
        compact ? "p-3" : "p-5"
      }`}
    >
      <div className={`flex items-center justify-between ${compact ? "mb-2" : "mb-4 pb-3 border-b border-zinc-100"}`}>
        <div>
          <h3 className={`font-bold uppercase tracking-wider text-[#0EA5A0] ${compact ? "text-[10px]" : "text-xs"}`}>
            Pipeline Progress
          </h3>
          {!compact && (
            <p className="text-xs text-zinc-500 mt-0.5">Matching cohorts &amp; generating clinical drafts</p>
          )}
        </div>
        {step !== "ready" && (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0EA5A0] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0EA5A0]" />
          </span>
        )}
      </div>

      <ol className={compact ? "space-y-1.5" : "space-y-2"}>
        {STEPS.map((s, idx) => {
          const isDone = idx < currentIdx || step === "ready";
          const isActive = s.id === step && step !== "ready";
          return (
            <li
              key={s.id}
              className={`flex items-start gap-2.5 rounded-lg border px-3 py-2 transition-all ${
                isActive
                  ? "border-[#0EA5A0] bg-[#ecfdf9]"
                  : isDone
                  ? "border-zinc-100 bg-zinc-50"
                  : "border-transparent opacity-50"
              }`}
            >
              <span
                className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5 ${
                  isDone
                    ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                    : isActive
                    ? "bg-[#0EA5A0] text-white"
                    : "bg-zinc-100 text-zinc-400 border border-zinc-200"
                }`}
              >
                {isDone ? "✓" : idx + 1}
              </span>
              <div className="min-w-0">
                <p
                  className={`font-semibold ${compact ? "text-[11px]" : "text-xs"} ${
                    isActive ? "text-[#0d9488]" : isDone ? "text-zinc-700" : "text-zinc-400"
                  }`}
                >
                  {s.label}
                </p>
                {!compact && (
                  <p className="text-[10px] text-zinc-400 mt-0.5">{s.detail}</p>
                )}
                {isActive && (
                  <span className="inline-block mt-1 text-[9px] font-mono uppercase tracking-wider text-[#0EA5A0] bg-white px-1.5 py-0.5 rounded border border-[#99f6e4]">
                    Running
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export async function runPipelineAnimation(
  setStep: (s: PipelineStep) => void,
  uploadFn: () => Promise<{ session_id: string }>
): Promise<string> {
  setStep("ingest");
  const t1 = setTimeout(() => setStep("validate"), 350);
  const t2 = setTimeout(() => setStep("match"), 800);
  try {
    const { session_id } = await uploadFn();
    clearTimeout(t1);
    clearTimeout(t2);
    setStep("documents");
    await new Promise((r) => setTimeout(r, 350));
    setStep("ready");
    await new Promise((r) => setTimeout(r, 450));
    return session_id;
  } catch (e) {
    clearTimeout(t1);
    clearTimeout(t2);
    throw e;
  }
}
