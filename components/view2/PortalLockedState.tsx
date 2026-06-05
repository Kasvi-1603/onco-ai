import React from "react";

export default function PortalLockedState() {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto my-16 rounded-lg shadow-sm space-y-6 animate-in" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl" style={{ background: 'var(--background)', border: '1px solid var(--border-subtle)' }}>
        🔒
      </div>
      
      <div className="space-y-2">
        <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--navy)' }}>
          Plan Under Review
        </h2>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Your oncology team is currently reviewing your pathology and genomic details to formulate a personalized precision regimen.
        </p>
      </div>
      
      <div className="p-3.5 rounded-md text-[11px] leading-relaxed" style={{ background: 'var(--clinical-amber-bg)', border: '1px solid var(--clinical-amber-border)', color: 'var(--clinical-amber)' }}>
        Draft clinical summaries and recommendations are hidden. Full access, translation toggles, and clinician guides will unlock as soon as your oncologist approves release.
      </div>
    </div>
  );
}
