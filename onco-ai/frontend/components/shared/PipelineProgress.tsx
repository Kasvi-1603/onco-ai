type Step = "upload" | "extract" | "retrieve" | "generate" | "done";

const LABELS: Record<Step, string> = {
  upload: "Upload",
  extract: "Agent 1 — Extract profile",
  retrieve: "Phase 1 — Retrieve cases & trials",
  generate: "Agent 2 — Generate drafts",
  done: "Complete",
};

const ORDER: Step[] = ["upload", "extract", "retrieve", "generate", "done"];

export function PipelineProgress({ step }: { step: Step }) {
  const idx = ORDER.indexOf(step);
  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pipeline</p>
      <ol className="mt-3 space-y-2">
        {ORDER.map((s, i) => {
          const active = i === idx;
          const done = i < idx;
          return (
            <li
              key={s}
              className={`flex items-center gap-2 text-sm ${
                active ? "font-medium text-slate-900" : done ? "text-emerald-700" : "text-slate-400"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  active ? "bg-blue-500 animate-pulse" : done ? "bg-emerald-500" : "bg-slate-300"
                }`}
              />
              {LABELS[s]}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
