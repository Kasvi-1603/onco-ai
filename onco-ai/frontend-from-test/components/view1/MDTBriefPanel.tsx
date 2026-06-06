import React from "react";

interface MDTBriefPanelProps {
  mdtBriefText: string;
}

export default function MDTBriefPanel({ mdtBriefText }: MDTBriefPanelProps) {
  return (
    <div className="rounded-lg shadow-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--navy)' }}>
          MDT Consensus Panel
        </h3>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ background: 'var(--navy-muted)', color: 'var(--navy-light)' }}>
          MDT Consensus
        </span>
      </div>

      <div className="p-4 text-xs leading-relaxed max-h-48 overflow-y-auto" style={{ color: 'var(--text-secondary)' }}>
        {mdtBriefText ? (
          mdtBriefText.split("\n").map((para, i) => {
            if (!para.trim()) return null;
            if (para.startsWith("#")) {
              return (
                <h4 key={i} className="text-xs font-bold mt-3 mb-1 uppercase tracking-wide" style={{ color: 'var(--navy)' }}>
                  {para.replace(/#/g, "").trim()}
                </h4>
              );
            }
            return (
              <p key={i} className="mb-2 leading-relaxed">
                {para}
              </p>
            );
          })
        ) : (
          <span className="italic" style={{ color: 'var(--text-muted)' }}>No MDT notes generated for this session.</span>
        )}
      </div>
    </div>
  );
}
