import React from "react";

interface BiomarkerBadgeProps {
  label: string;
  value?: string;
}

export default function BiomarkerBadge({ label, value }: BiomarkerBadgeProps) {
  if (!value) return null;
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-bold" style={{ background: 'var(--navy-muted)', border: '1px solid var(--border)', color: 'var(--navy)' }}>
      <span className="opacity-70 uppercase">{label}</span>
      <span className="w-1 h-1 rounded-full" style={{ background: 'var(--navy-light)' }}></span>
      <span>{value}</span>
    </div>
  );
}
