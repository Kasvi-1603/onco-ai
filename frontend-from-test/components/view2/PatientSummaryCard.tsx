import React from "react";

interface PatientSummaryCardProps {
  headline: string;
  summaryText: string;
}

export default function PatientSummaryCard({ headline, summaryText }: PatientSummaryCardProps) {
  return (
    <div className="rounded-lg p-6 shadow-sm space-y-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2">
        <span className="text-xl">🩺</span>
        <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--navy)' }}>
          Clinical Intelligence Release
        </h3>
      </div>

      <div className="space-y-3">
        <h4 className="text-lg font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
          {headline}
        </h4>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {summaryText}
        </p>
      </div>

      <div className="pt-4 flex items-center justify-between text-[10px] font-mono border-t" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
        <span>Prepared by your clinical oncology team</span>
        <span style={{ color: 'var(--clinical-green)' }}>✓ Verified Release</span>
      </div>
    </div>
  );
}
