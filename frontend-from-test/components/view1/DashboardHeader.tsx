import React from "react";
import Link from "next/link";
import { SessionPayload } from "../../lib/types";
import BiomarkerBadge from "../shared/BiomarkerBadge";
import { ExternalLink, FileText, User } from "lucide-react";

interface DashboardHeaderProps {
  payload: SessionPayload;
}

export default function DashboardHeader({ payload }: DashboardHeaderProps) {
  const { session_id, status, patient_profile, approved_at } = payload;
  const { clinical, genomic } = patient_profile;

  // Function to style demographics dynamically
  const getDemographicStyle = (label: string, value: string | number) => {
    const valStr = String(value).toUpperCase();
    if (label === "Stage") {
      if (valStr.includes("IV") || valStr.includes("4")) {
        return { bg: '#fff1f2', text: '#9f1239', border: '#fecdd3' }; // Alerting Red for advanced stage
      }
      return { bg: '#fffbeb', text: '#92400e', border: '#fde68a' }; // Amber
    }
    if (label === "ECOG") {
      if (valStr === "0" || valStr === "1") {
        return { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' }; // Healthy/low-risk green
      }
      return { bg: '#fffbeb', text: '#92400e', border: '#fde68a' };
    }
    if (label === "Sex") {
      if (valStr.startsWith("F")) {
        return { bg: '#fdf2f8', text: '#be185d', border: '#fbcfe8' }; // Pink hue
      }
      return { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' }; // Blue hue
    }
    return { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1' }; // Standard neutral slate
  };

  return (
    <div className="rounded-lg p-5 shadow-sm card-accent-navy" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        {/* Patient identity */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--navy-muted)' }}>
            <User className="w-5 h-5" style={{ color: 'var(--navy-light)' }} />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-base font-bold" style={{ color: 'var(--navy)' }}>
                Precision Oncology Workstation
              </h1>
              <span className="text-xs font-mono font-bold" style={{ color: 'var(--text-muted)' }}>
                #{session_id.slice(0, 12)}
              </span>
              {status === "shared" ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: 'var(--clinical-green-bg)', color: 'var(--clinical-green)', border: '1px solid var(--clinical-green-border)' }}>
                  ✓ SHARED WITH PORTAL
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: 'var(--clinical-amber-bg)', color: 'var(--clinical-amber)', border: '1px solid var(--clinical-amber-border)' }}>
                  ⚠ DRAFT
                </span>
              )}
            </div>

            {/* Demographics row */}
            <div className="flex items-center gap-2 flex-wrap mt-3">
              {[
                { label: 'Age', value: clinical?.age },
                { label: 'Sex', value: clinical?.sex },
                { label: 'ECOG', value: clinical?.ecog },
                { label: 'Stage', value: clinical?.stage },
                { label: 'Smoking', value: clinical?.smoking },
              ].map(({ label, value }) => {
                if (!value) return null;
                const colors = getDemographicStyle(label, value);
                return (
                  <div
                    key={label}
                    className="flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold border shadow-2xs"
                    style={{ background: colors.bg, color: colors.text, borderColor: colors.border }}
                  >
                    <span className="opacity-70 text-[9px] uppercase tracking-wider font-bold">{label}</span>
                    <span className="font-mono">{String(value)}</span>
                  </div>
                );
              })}
            </div>

            {/* Biomarker badges */}
            <div className="flex items-center gap-2 mt-3.5 flex-wrap">
              {genomic?.egfr && <BiomarkerBadge label="EGFR" value={genomic.egfr} />}
              {genomic?.kras && <BiomarkerBadge label="KRAS" value={genomic.kras} />}
              {genomic?.alk && <BiomarkerBadge label="ALK" value={genomic.alk} />}
              {genomic?.pd_l1 !== undefined && <BiomarkerBadge label="PD-L1" value={`${genomic.pd_l1}% TPS`} />}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/audit/${session_id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded transition-all cursor-pointer hover:bg-gray-50 active:bg-gray-100"
            style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)' }}
          >
            <FileText className="w-3.5 h-3.5" style={{ color: 'var(--navy-light)' }} />
            Audit Trail
          </Link>
          {status === "shared" && approved_at && (
            <Link
              href={`/patient/${session_id}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded transition-all cursor-pointer hover:opacity-90 active:scale-[0.98]"
              style={{ background: 'var(--clinical-green-bg)', color: 'var(--clinical-green)', border: '1px solid var(--clinical-green-border)' }}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Patient Portal
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
