import React from "react";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export default function ErrorState({ title = "An error occurred", message, onRetry }: ErrorStateProps) {
  return (
    <div className="rounded-lg p-6 max-w-md mx-auto my-8 text-center" style={{ background: 'var(--clinical-red-bg)', border: '1px solid var(--clinical-red-border)' }}>
      <div className="text-3xl mb-3">⚠️</div>
      <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--clinical-red)' }}>{title}</h3>
      <p className="text-xs mb-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 text-white rounded text-sm font-semibold transition-colors cursor-pointer hover:opacity-90 shadow-sm"
          style={{ background: 'var(--clinical-red)' }}
        >
          Retry Request
        </button>
      )}
    </div>
  );
}
