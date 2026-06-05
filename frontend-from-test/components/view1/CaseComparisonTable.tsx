"use client";

import React, { useState } from "react";
import { SimilarCohort } from "../../lib/types";
import { Filter } from "lucide-react";
import CohortSpiderMap from "./CohortSpiderMap";

interface CaseComparisonTableProps {
  cohorts: SimilarCohort[];
}

export default function CaseComparisonTable({ cohorts }: CaseComparisonTableProps) {
  const [selectedSubtype, setSelectedSubtype] = useState<string>("all");
  const [selectedMutation, setSelectedMutation] = useState<string>("all");

  const subtypes = Array.from(new Set(cohorts.map((c) => c.cancer_subtype)));
  const mutations = Array.from(new Set(cohorts.map((c) => c.primary_mutation)));

  const filteredCohorts = cohorts.filter((c) => {
    const matchSubtype = selectedSubtype === "all" || c.cancer_subtype === selectedSubtype;
    const matchMutation = selectedMutation === "all" || c.primary_mutation === selectedMutation;
    return matchSubtype && matchMutation;
  });

  return (
    <div className="rounded-lg overflow-hidden shadow-sm card-accent-indigo" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b flex-wrap gap-2.5" style={{ borderColor: 'var(--border)' }}>
        <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--navy)' }}>
          <span className="w-1.5 h-3.5 rounded-sm" style={{ background: '#6366f1' }}></span>
          Historical Cohort Matches
        </h3>
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5" style={{ color: 'var(--text-subtle)' }} />
          <select
            value={selectedSubtype}
            onChange={(e) => setSelectedSubtype(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-md focus:outline-none cursor-pointer hover:bg-gray-50 font-medium"
            style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)' }}
          >
            <option value="all">All Subtypes</option>
            {subtypes.map((sub) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
          <select
            value={selectedMutation}
            onChange={(e) => setSelectedMutation(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-md focus:outline-none cursor-pointer hover:bg-gray-50 font-medium"
            style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)' }}
          >
            <option value="all">All Mutations</option>
            {mutations.map((mut) => (
              <option key={mut} value={mut}>{mut}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left clinical-table">
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
              {['Cohort ID', 'Match Confidence', 'Subtype & Mutation', 'Treatment Regimen', 'Survival Outcomes', 'Feature Breakdown'].map((h) => (
                <th key={h} className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--navy)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
            {filteredCohorts.map((cohort) => {
              const matchPct = Math.round(cohort.overall_score * 100);
              
              // Dynamic colors for overall match score
              const matchColors = cohort.overall_score >= 0.85
                ? { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' }
                : cohort.overall_score >= 0.6
                ? { bg: '#fef3c7', text: '#b45309', border: '#fde68a' }
                : { bg: '#fee2e2', text: '#b91c1c', border: '#fecaca' };

              return (
                <tr key={cohort.cohort_id} className="transition-colors hover:bg-slate-50/40">
                  <td className="py-3 px-4 text-xs font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
                    {cohort.cohort_id}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full border shadow-2xs" style={{ background: matchColors.bg, color: matchColors.text, borderColor: matchColors.border }}>
                      {matchPct}% MATCH
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{cohort.cancer_subtype}</div>
                    <div className="text-[10px] mt-0.5 font-semibold font-mono" style={{ color: 'var(--navy-light)' }}>{cohort.primary_mutation}</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{cohort.treatment_given}</div>
                    <div className="text-[10px] mt-0.5 italic" style={{ color: 'var(--text-muted)' }}>{cohort.toxicity_profile}</div>
                  </td>
                  <td className="py-3 px-3 font-mono">
                    {cohort.outcome_os_months && (
                      <div className="text-xs font-bold" style={{ color: 'var(--navy)' }}>OS: {cohort.outcome_os_months} mos</div>
                    )}
                    {cohort.outcome_pfs_months && (
                      <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>PFS: {cohort.outcome_pfs_months} mos</div>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5 flex-wrap max-w-sm">
                      {cohort.param_breakdown.map((param, i) => {
                        // Dynamic breakdown badges
                        const badgeColors = param.color === "green"
                          ? { bg: 'var(--clinical-green-bg)', text: 'var(--clinical-green)', border: 'var(--clinical-green-border)' }
                          : param.color === "amber"
                          ? { bg: 'var(--clinical-amber-bg)', text: 'var(--clinical-amber)', border: 'var(--clinical-amber-border)' }
                          : { bg: 'var(--clinical-red-bg)', text: 'var(--clinical-red)', border: 'var(--clinical-red-border)' };

                        return (
                          <div
                            key={i}
                            className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide border shadow-3xs"
                            style={{ background: badgeColors.bg, color: badgeColors.text, borderColor: badgeColors.border }}
                            title={`${param.param}: Patient [${param.patient_value}] vs Cohort [${param.cohort_value}]`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: badgeColors.text }}></span>
                            {param.param}
                          </div>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredCohorts.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm italic" style={{ color: 'var(--text-muted)' }}>
                  No cohort matching current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Spider Map */}
      <div className="px-4 pb-4">
        <CohortSpiderMap cohorts={filteredCohorts.length > 0 ? filteredCohorts : cohorts} />
      </div>
    </div>
  );
}
