"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAudit } from "../../../lib/api";
import ErrorState from "../../../components/shared/ErrorState";

export default function AuditTrailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const { data, isLoading, isError } = useAudit(sessionId);

  const copyHash = (hash: string, index: number) => {
    navigator.clipboard.writeText(hash);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 min-h-screen" style={{ background: 'var(--background)' }}>
        <div className="text-center space-y-3 font-mono">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mx-auto" style={{ borderColor: 'var(--navy)', borderTopColor: 'transparent' }}></div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Loading Audit Log Ledger...</p>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 min-h-screen" style={{ background: 'var(--background)' }}>
        <ErrorState
          title="Session Audit Trail Missing"
          message="No log details could be found for this session ID. Return to the dashboard."
          onRetry={() => router.push(`/dashboard/${sessionId}`)}
        />
      </div>
    );
  }

  return (
    <div className="flex-grow min-h-screen p-4 md:p-8 flex flex-col font-sans selection:bg-slate-200" style={{ background: 'var(--background)', color: 'var(--text-primary)' }}>
      <div className="max-w-4xl w-full mx-auto space-y-6 flex-grow">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b flex-wrap gap-3" style={{ borderColor: 'var(--border)' }}>
          <div>
            <div className="text-[10px] font-bold font-mono tracking-widest uppercase" style={{ color: 'var(--navy-light)' }}>
              Provenance Ledger
            </div>
            <h1 className="text-lg font-bold flex items-center gap-2 mt-0.5" style={{ color: 'var(--navy)' }}>
              Pipeline Audit Trail
              <span className="text-xs font-mono font-normal" style={{ color: 'var(--text-muted)' }}>
                [{sessionId.slice(0, 12)}]
              </span>
            </h1>
          </div>

          <Link
            href={`/dashboard/${sessionId}`}
            className="text-xs font-semibold px-3 py-1.5 rounded-md transition-all font-mono hover:bg-gray-50 active:bg-gray-100"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Audit Table */}
        <div className="rounded-lg overflow-hidden shadow-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b text-[10px] font-bold uppercase tracking-wider font-mono bg-gray-50" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                  <th className="py-3 px-4">Pipeline Step</th>
                  <th className="py-3 px-3">LLM Model Targeted</th>
                  <th className="py-3 px-3">Retrieved IDs</th>
                  <th className="py-3 px-3">Execution Time</th>
                  <th className="py-3 px-4 text-right">Input Payload Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                {data.entries.map((entry, idx) => {
                  const truncatedHash = entry.input_hash.substring(0, 15) + "...";
                  return (
                    <tr 
                      key={idx}
                      className="hover:bg-gray-50/50 transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <td className="py-3 px-4 font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
                        {entry.step}
                      </td>
                      <td className="py-3 px-3 font-medium">
                        {entry.model || <span className="italic" style={{ color: 'var(--text-subtle)' }}>N/A</span>}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        {entry.retrieved_ids && entry.retrieved_ids.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {entry.retrieved_ids.map((id) => (
                              <span 
                                key={id} 
                                className="text-[9px] px-1.5 py-0.5 rounded font-semibold"
                                style={{ background: 'var(--navy-muted)', border: '1px solid var(--border-subtle)', color: 'var(--navy-light)' }}
                              >
                                {id}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="italic" style={{ color: 'var(--text-subtle)' }}>None</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono" style={{ color: 'var(--text-muted)' }}>
                        {new Date(entry.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => copyHash(entry.input_hash, idx)}
                          className="text-[10px] font-mono px-2.5 py-1 rounded transition-all cursor-pointer hover:bg-gray-50"
                          style={{ background: 'var(--background)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}
                          title="Click to copy hash value"
                        >
                          {copiedIndex === idx ? "Copied!" : truncatedHash}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-4 rounded-lg space-y-2 text-xs leading-relaxed" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
          <p>
            ℹ_ <strong>Ledger Proof Verification:</strong> The hashes listed above represent the cryptographic snapshot processed during each stage of the analysis pipeline. This ledger guarantees clinical data integrity and ensures generated patient summaries map directly to physician-approved records.
          </p>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="py-4 text-center text-[9px] font-mono mt-8 border-t" style={{ borderColor: 'var(--border)', color: 'var(--text-subtle)' }}>
        PROVENANCE LEDGER AUDIT SCREEN • ONCOPILOT ENTERPRISE
      </footer>
    </div>
  );
}
