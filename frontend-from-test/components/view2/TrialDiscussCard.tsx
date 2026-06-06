import React from "react";

interface TrialDiscussCardProps {
  content?: string;
}

export default function TrialDiscussCard({ content }: TrialDiscussCardProps) {
  if (!content) return null;
  return (
    <div className="rounded-lg p-5 shadow-sm space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--navy)' }}>
        🔬 Research Opportunities & Clinical Trials
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {content}
      </p>
      <div className="p-3.5 rounded-md text-[11px] leading-relaxed" style={{ background: 'var(--navy-muted)', border: '1px solid var(--border-subtle)', color: 'var(--navy-light)' }}>
        💡 <strong>Note:</strong> Clinical trials explore novel pathways and therapy adjustments. These are candidate options to review and discuss with your physician, not direct prescriptions.
      </div>
    </div>
  );
}
