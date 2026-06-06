import type { Agent2Output, RiskFlag } from "@/lib/types";

export function RiskFlagBanner({
  flags,
  insights,
}: {
  flags: RiskFlag[];
  insights?: Agent2Output | null;
}) {
  const items = [
    ...flags.map((f) => ({ type: f.severity, text: f.message })),
    ...(insights?.toxicity_warnings ?? []).map((t) => ({
      type: "warning" as const,
      text: t,
    })),
  ];

  if (!items.length) return null;

  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <h2 className="text-sm font-semibold text-amber-900">Risk Flags & Toxicity</h2>
      <ul className="mt-2 space-y-1 text-sm text-amber-900">
        {items.map((item, i) => (
          <li key={i}>• {item.text}</li>
        ))}
      </ul>
      {insights?.clinical_question_suggestion && (
        <p className="mt-3 border-t border-amber-200 pt-2 text-xs text-amber-800">
          <strong>Tumor board question:</strong> {insights.clinical_question_suggestion}
        </p>
      )}
    </section>
  );
}
