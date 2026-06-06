import React from "react";

export default function DraftBanner() {
  return (
    <div className="px-4 py-2.5 text-center text-xs font-semibold flex items-center justify-center gap-2 border-y" style={{ background: 'var(--clinical-amber-bg)', borderColor: 'var(--clinical-amber-border)', color: 'var(--clinical-amber)' }}>
      <span className="inline-block px-1.5 py-0.5 rounded text-white font-bold uppercase text-[9px] tracking-wider" style={{ background: 'var(--clinical-amber)' }}>
        Draft Mode
      </span>
      <span>For Oncologist Review only. Not an active medical prescription or active clinical plan.</span>
    </div>
  );
}
