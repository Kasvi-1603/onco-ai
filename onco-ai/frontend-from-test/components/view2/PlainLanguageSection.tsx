import React from "react";

interface PlainLanguageSectionProps {
  title: string;
  content: string;
  icon?: string;
}

export default function PlainLanguageSection({ title, content, icon }: PlainLanguageSectionProps) {
  if (!content) return null;
  return (
    <div className="rounded-lg p-5 shadow-sm space-y-2" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--navy)' }}>
        {icon && <span className="text-base">{icon}</span>}
        {title}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {content}
      </p>
    </div>
  );
}
