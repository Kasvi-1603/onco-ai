import type { PatientProfile } from "@/lib/types";
import { SourceSnippetLink } from "@/components/shared/SourceSnippetLink";

export function MolecularProfileGrid({ profile }: { profile: PatientProfile }) {
  const rows = [
    ["Subtype", profile.pathology.subtype, "subtype"],
    ["Histology", profile.pathology.histological_type, "subtype"],
    ["Grade", profile.pathology.grade, null],
    ["Tumor size", profile.pathology.tumor_size_mm ? `${profile.pathology.tumor_size_mm} mm` : null, "tumor_lobe"],
    ["EGFR", profile.genomic.egfr, "egfr"],
    ["KRAS", profile.genomic.kras, null],
    ["ALK", profile.genomic.alk, null],
    ["PD-L1", profile.genomic.pd_l1_percent != null ? `${profile.genomic.pd_l1_percent}%` : null, "pd_l1_percent"],
    ["TMB", profile.genomic.tmb != null ? `${profile.genomic.tmb} mut/Mb` : null, null],
    ["TNM", profile.clinical.tnm, "stage"],
    ["Stage", profile.clinical.stage, "stage"],
    ["ECOG", profile.clinical.ecog?.toString(), "ecog"],
    ["Smoking", profile.clinical.smoking, "smoking"],
    ["Lobe", profile.imaging.tumor_lobe, "tumor_lobe"],
    ["N stage", profile.imaging.n_stage, "n_stage"],
  ];

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Molecular & Clinical Profile
      </h2>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {rows.map(([label, val, snippetKey]) => (
          <div key={String(label)} className="border-b border-slate-50 pb-2">
            <dt className="text-xs text-slate-500">{label}</dt>
            <dd className="font-medium text-slate-900">{val ?? "—"}</dd>
            {snippetKey && profile.source_snippets[snippetKey] && (
              <SourceSnippetLink
                field={String(label)}
                snippet={profile.source_snippets[snippetKey]}
              />
            )}
          </div>
        ))}
      </dl>
      {profile.missing_fields.length > 0 && (
        <p className="mt-3 rounded bg-amber-50 p-2 text-xs text-amber-800">
          Missing: {profile.missing_fields.join(", ")}
        </p>
      )}
    </section>
  );
}
