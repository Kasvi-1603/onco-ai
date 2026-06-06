export function MDTBriefPanel({ content }: { content: string }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">MDT / Tumor Board Brief</h2>
      <pre className="mt-2 max-h-[400px] overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 font-sans text-xs leading-relaxed text-slate-800">
        {content}
      </pre>
    </section>
  );
}
