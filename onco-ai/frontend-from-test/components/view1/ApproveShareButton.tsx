"use client";

import React, { useState } from "react";
import { approveSession } from "../../lib/api";
import { SessionStatus } from "../../lib/types";

interface ApproveShareButtonProps {
  sessionId: string;
  initialStatus: SessionStatus;
  approvedAt: string | null;
  onApproveSuccess?: (approvedAt: string, patientPortalUrl: string) => void;
}

export default function ApproveShareButton({
  sessionId,
  initialStatus,
  approvedAt,
  onApproveSuccess,
}: ApproveShareButtonProps) {
  const [status, setStatus] = useState<SessionStatus>(initialStatus);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [portalUrl, setPortalUrl] = useState<string | null>(
    initialStatus === "shared" ? `/patient/${sessionId}` : null
  );

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const res = await approveSession(sessionId);
      setStatus("shared");
      setPortalUrl(res.patient_portal_url);
      setIsModalOpen(false);
      if (onApproveSuccess) {
        onApproveSuccess(res.approved_at, res.patient_portal_url);
      }
    } catch (err) {
      console.error("Approval failed", err);
      alert("Failed to approve clinical drafts. Please try again.");
    } finally {
      setIsApproving(false);
    }
  };

  const copyLink = () => {
    if (portalUrl) {
      const fullUrl = `${window.location.origin}${portalUrl}`;
      navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isShared = status === "shared";

  return (
    <div className="relative inline-block w-full sm:w-auto">
      {isShared ? (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full">
          <span
            className="px-4 py-2 rounded-md text-xs font-bold font-mono tracking-wide text-center"
            style={{
              background: 'var(--clinical-green-bg)',
              border: '1px solid var(--clinical-green-border)',
              color: 'var(--clinical-green)'
            }}
          >
            ✓ Shared: {approvedAt ? new Date(approvedAt).toLocaleDateString() : "Approved"}
          </span>
          {portalUrl && (
            <button
              onClick={copyLink}
              className="px-4 py-2 rounded-md text-xs font-semibold transition-all text-center cursor-pointer hover:bg-gray-50 active:bg-gray-100"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)'
              }}
            >
              {copied ? "Link Copied!" : "Copy Patient Link"}
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full px-5 py-2.5 rounded-md text-xs font-bold tracking-wider transition-all text-center cursor-pointer shadow-sm hover:opacity-90 active:scale-[0.98]"
          style={{
            background: 'var(--navy)',
            color: '#ffffff',
            border: '1px solid var(--navy)'
          }}
        >
          Approve & Share with Patient Portal
        </button>
      )}

      {/* Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-lg p-5 shadow-lg space-y-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--navy)' }}>
              Confirm Release to Patient Portal
            </h3>
            <p className="text-xs leading-relaxed font-medium" style={{ color: 'var(--text-secondary)' }}>
              This action will snapshot all clinical document drafts, set the session status to <strong className="font-semibold" style={{ color: 'var(--navy-light)' }}>&quot;shared&quot;</strong>, and unlock the localized Patient Portal for viewing.
            </p>
            <div className="p-3.5 rounded-md text-[11px] leading-relaxed" style={{ background: 'var(--clinical-amber-bg)', border: '1px solid var(--clinical-amber-border)', color: 'var(--clinical-amber)' }}>
              <strong>Important Warning:</strong> Releasing these details will make plain-language translations available to the patient. Please verify the clinical details and draft revisions carefully before sharing.
            </div>
            
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isApproving}
                className="px-4 py-2 rounded text-xs font-semibold transition-all cursor-pointer hover:bg-gray-50"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={isApproving}
                className="px-4 py-2 rounded text-xs font-bold transition-all cursor-pointer shadow-sm hover:opacity-90"
                style={{
                  background: 'var(--navy)',
                  color: '#ffffff',
                  border: '1px solid var(--navy)'
                }}
              >
                {isApproving ? "Releasing..." : "Confirm & Share"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
