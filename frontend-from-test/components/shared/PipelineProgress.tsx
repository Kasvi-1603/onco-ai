import React from "react";
import { PipelineStatus } from "../../lib/types";

interface PipelineProgressProps {
  status: PipelineStatus;
}

const STEP_LABELS: Record<string, string> = {
  ocr: "Document OCR Scan",
  extract: "Profile Field Extraction",
  similarity: "Similar Cohort Search",
  trial_match: "Clinical Trial Matching",
  knowledge_retrieve: "Knowledge Retrieval",
  agent2: "Multi-agent Synthesis",
  documents: "Document Generation",
  ready: "Ready for Review",
};

const STEP_ORDER = [
  "ocr",
  "extract",
  "similarity",
  "trial_match",
  "knowledge_retrieve",
  "agent2",
  "documents",
  "ready",
];

export default function PipelineProgress({ status }: PipelineProgressProps) {
  const currentIdx = STEP_ORDER.indexOf(status.current_step);
  const completed = status.steps_completed || [];

  return (
    <div className="w-full rounded-lg p-5 shadow-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between mb-4 pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--navy)' }}>
            Pipeline Orchestration Progress
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Extracting metrics, comparing cohorts & matching clinical trials
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'var(--navy-light)' }}></span>
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: 'var(--navy)' }}></span>
          </span>
          <span className="text-[10px] font-mono uppercase tracking-widest font-bold" style={{ color: 'var(--navy-light)' }}>
            {status.status}
          </span>
        </div>
      </div>

      <div className="space-y-2.5">
        {STEP_ORDER.map((stepKey, idx) => {
          const label = STEP_LABELS[stepKey] || stepKey;
          const isCompleted = completed.includes(stepKey) || idx < currentIdx;
          const isCurrent = status.current_step === stepKey;

          return (
            <div
              key={stepKey}
              className="flex items-center justify-between p-3 rounded-md border transition-all duration-300"
              style={{
                background: isCurrent
                  ? 'var(--navy-muted)'
                  : isCompleted
                  ? 'var(--background)'
                  : 'var(--surface)',
                borderColor: isCurrent
                  ? 'var(--navy-light)'
                  : isCompleted
                  ? 'var(--border-subtle)'
                  : 'var(--border-subtle)',
                color: isCurrent
                  ? 'var(--navy)'
                  : isCompleted
                  ? 'var(--text-secondary)'
                  : 'var(--text-subtle)',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono"
                  style={{
                    background: isCurrent
                      ? 'var(--navy)'
                      : isCompleted
                      ? 'var(--clinical-green-bg)'
                      : 'var(--background)',
                    color: isCurrent
                      ? '#ffffff'
                      : isCompleted
                      ? 'var(--clinical-green)'
                      : 'var(--text-subtle)',
                    border: isCompleted
                      ? '1px solid var(--clinical-green-border)'
                      : '1px solid var(--border-subtle)',
                  }}
                >
                  {isCompleted ? "✓" : idx + 1}
                </div>
                <span className="text-xs font-semibold">
                  {label}
                </span>
              </div>
              <div>
                {isCurrent && (
                  <span className="text-[9px] px-2 py-0.5 rounded font-mono uppercase tracking-wider text-white" style={{ background: 'var(--navy-light)' }}>
                    Active
                  </span>
                )}
                {isCompleted && (
                  <span className="text-[9px] px-2 py-0.5 rounded font-mono uppercase tracking-wider" style={{ background: 'var(--clinical-green-bg)', color: 'var(--clinical-green)', border: '1px solid var(--clinical-green-border)' }}>
                    Complete
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
