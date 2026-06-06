export function BiomarkerBadge({
  label,
  value,
  highlight,
}: {
  label: string;
  value?: string;
  highlight?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        highlight ? "bg-violet-100 text-violet-800" : "bg-slate-100 text-slate-700"
      }`}
    >
      {label}
      {value ? `: ${value}` : ""}
    </span>
  );
}
