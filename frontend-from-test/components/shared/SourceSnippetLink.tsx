"use client";

import React, { useState, useRef, useEffect } from "react";

interface SourceSnippetLinkProps {
  label: string;
  snippet?: string;
  children: React.ReactNode;
}

export default function SourceSnippetLink({ label, snippet, children }: SourceSnippetLinkProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!snippet) return <>{children}</>;

  return (
    <div ref={containerRef} className="relative w-full">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer group rounded transition-colors"
        title="Click to view source OCR provenance"
      >
        {children}
      </div>
      
      {isOpen && (
        <div className="absolute z-50 left-0 mt-2 w-80 rounded-lg p-3.5 shadow-lg text-xs" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b" style={{ borderColor: 'var(--border)' }}>
            <span className="font-bold uppercase tracking-wider text-[10px]" style={{ color: 'var(--navy)' }}>
              OCR Source Provenance
            </span>
            <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
              field: {label}
            </span>
          </div>
          <p className="italic leading-relaxed p-2.5 rounded" style={{ background: 'var(--background)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
            "{snippet}"
          </p>
          <div className="mt-2 text-[9px] text-right" style={{ color: 'var(--text-subtle)' }}>
            Verified extraction from uploaded files
          </div>
        </div>
      )}
    </div>
  );
}
export type { SourceSnippetLinkProps };
