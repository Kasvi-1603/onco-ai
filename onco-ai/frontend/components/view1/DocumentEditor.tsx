export function DocumentEditor({ title, content }: { title: string; content: string }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      <p className="mb-2 text-[10px] uppercase text-amber-700">Draft — editable before sign-off</p>
      <textarea
        className="min-h-[280px] w-full resize-y rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs leading-relaxed text-slate-800"
        defaultValue={content}
        readOnly
      />
    </section>
  );
}
