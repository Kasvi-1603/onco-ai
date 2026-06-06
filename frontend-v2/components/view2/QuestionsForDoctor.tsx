import React from "react";

interface QuestionsForDoctorProps {
  questions?: string[];
}

export default function QuestionsForDoctor({ questions }: QuestionsForDoctorProps) {
  if (!questions || questions.length === 0) return null;
  return (
    <div className="rounded-lg p-5 shadow-sm space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--navy)' }}>
        📋 Suggested Questions for your next doctor visit
      </h3>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        Consider sharing these questions with your oncology care team at your next appointment:
      </p>
      
      <ul className="space-y-2.5">
        {questions.map((q, idx) => (
          <li 
            key={idx} 
            className="flex items-start gap-2.5 text-xs p-3 rounded-md border"
            style={{ background: 'var(--background)', borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
          >
            <span className="w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] shrink-0 font-mono" style={{ background: 'var(--navy-muted)', color: 'var(--navy)' }}>
              {idx + 1}
            </span>
            <span className="leading-relaxed">{q}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
