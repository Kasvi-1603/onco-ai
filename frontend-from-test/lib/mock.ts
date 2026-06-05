import { SessionPayload } from "./types";

export const MOCK_SESSION_PAYLOAD: SessionPayload = {
  session_id: "demo_session_123",
  status: "ready",
  patient_profile: {
    pathology: {
      subtype: "Adenocarcinoma",
      grade: "Grade 2",
      mitotic_index: "3/10 HPF",
      margins: "Negative",
      size_mm: 35
    },
    genomic: {
      egfr: "Exon 19 Deletion (p.Glu746_Ala750del)",
      kras: "Wild-type",
      alk: "Negative",
      ros1: "Negative",
      tp53: "p.R273H",
      stk11: "Wild-type",
      keap1: "Wild-type",
      tmb: 4.2,
      pd_l1: 15
    },
    imaging: {
      lobe: "Right Upper Lobe",
      n_stage: "N2",
      metastasis_sites: ["Contralateral lung nodules"],
      pleural_invasion: true
    },
    clinical: {
      age: 62,
      sex: "Female",
      smoking: "Former smoker (15 pack-years)",
      ecog: 1,
      stage: "IVa",
      prior_therapies: ["None"],
      comorbidities: ["Hypertension"],
      labs: {
        "Creatinine": 0.8,
        "ALT": 24,
        "AST": 19,
        "WBC": 6.8
      }
    },
    missing_fields: ["brain_mri_date"],
    source_snippets: {
      "egfr": "Next-generation sequencing performed on pleural fluid specimen demonstrated an EGFR exon 19 deletion.",
      "subtype": "Histologic sections show infiltration of lung parenchyma by neoplastic glands consistent with lung adenocarcinoma.",
      "stage": "PET-CT scan showed metabolic activity in the right upper lobe mass, ipsilateral mediastinal nodes, and two small contralateral nodules, consistent with Stage IVa disease.",
      "pd_l1": "PD-L1 immunohistochemistry (22C3) showed tumor proportion score of approximately 15%."
    },
    extraction_confidence: "high"
  },
  similar_cohorts: [
    {
      cohort_id: "SYN-001",
      overall_score: 0.87,
      cancer_subtype: "Adenocarcinoma",
      primary_mutation: "EGFR Exon 19 Del",
      stage: "IV",
      treatment_given: "Osimertinib daily",
      outcome_os_months: 38.6,
      outcome_pfs_months: 18.9,
      clinical_outcome: "Complete Response",
      toxicity_profile: "G1 Diarrhea, G1 Rash",
      param_breakdown: [
        { param: "Mutation", score: 1.0, color: "green", patient_value: "EGFR Exon 19 del", cohort_value: "EGFR Exon 19 del" },
        { param: "Subtype", score: 1.0, color: "green", patient_value: "Adenocarcinoma", cohort_value: "Adenocarcinoma" },
        { param: "Stage", score: 0.9, color: "green", patient_value: "IVa", cohort_value: "IV" },
        { param: "Smoking", score: 0.6, color: "amber", patient_value: "Former", cohort_value: "Never" },
        { param: "ECOG", score: 0.9, color: "green", patient_value: "1", cohort_value: "1" }
      ]
    },
    {
      cohort_id: "SYN-002",
      overall_score: 0.74,
      cancer_subtype: "Adenocarcinoma",
      primary_mutation: "EGFR L858R",
      stage: "IV",
      treatment_given: "Osimertinib daily",
      outcome_os_months: 31.2,
      outcome_pfs_months: 14.4,
      clinical_outcome: "Partial Response",
      toxicity_profile: "G2 Rash, Dry Skin",
      param_breakdown: [
        { param: "Mutation", score: 0.7, color: "amber", patient_value: "EGFR Exon 19 del", cohort_value: "EGFR L858R" },
        { param: "Subtype", score: 1.0, color: "green", patient_value: "Adenocarcinoma", cohort_value: "Adenocarcinoma" },
        { param: "Stage", score: 0.9, color: "green", patient_value: "IVa", cohort_value: "IV" },
        { param: "Smoking", score: 0.6, color: "amber", patient_value: "Former", cohort_value: "Former" },
        { param: "ECOG", score: 0.5, color: "amber", patient_value: "1", cohort_value: "2" }
      ]
    },
    {
      cohort_id: "SYN-003",
      overall_score: 0.42,
      cancer_subtype: "Adenocarcinoma",
      primary_mutation: "KRAS G12C",
      stage: "IV",
      treatment_given: "Sotorasib daily",
      outcome_os_months: 12.5,
      outcome_pfs_months: 6.5,
      clinical_outcome: "Stable Disease",
      toxicity_profile: "G2 LFT elevation",
      param_breakdown: [
        { param: "Mutation", score: 0.1, color: "red", patient_value: "EGFR Exon 19 del", cohort_value: "KRAS G12C" },
        { param: "Subtype", score: 1.0, color: "green", patient_value: "Adenocarcinoma", cohort_value: "Adenocarcinoma" },
        { param: "Stage", score: 0.9, color: "green", patient_value: "IVa", cohort_value: "IV" },
        { param: "Smoking", score: 0.1, color: "red", patient_value: "Former", cohort_value: "Heavy Smoker" },
        { param: "ECOG", score: 0.9, color: "green", patient_value: "1", cohort_value: "1" }
      ]
    }
  ],
  trial_matches: [
    {
      nct_id: "NCT04300127",
      trial_title: "Osimertinib with or without Chemotherapy in EGFR-Mutated NSCLC",
      phase: "Phase III",
      matched_on: ["EGFR Exon 19 Deletion", "Stage IVa NSCLC", "ECOG 0-1"],
      conflicts: [],
      raw_eligibility: "Inclusion: Pathologically confirmed non-small cell lung cancer with EGFR Exon 19 deletion or L858R mutation. Exclusion: Prior treatment with EGFR TKIs, active brain metastases.",
      match_score: 0.95
    },
    {
      nct_id: "NCT03491540",
      trial_title: "A Study of Osimertinib vs Placebo in EGFR Mutation-Positive Non-Small Cell Lung Cancer",
      phase: "Phase III",
      matched_on: ["EGFR Exon 19 Deletion", "No Prior TKI"],
      conflicts: ["Requires prior chemoradiation (patient is treatment-naive)"],
      raw_eligibility: "Inclusion: Patients with unresectable Stage III NSCLC whose disease has not progressed following definitive platinum-based chemoradiation. EGFR mutation positive.",
      match_score: 0.65
    }
  ],
  risk_flags: [
    {
      flag_type: "biomarker_discordance",
      severity: "medium",
      description: "Patient's PD-L1 is 15% (moderate expression). In EGFR-mutated lung cancer, immunotherapy is generally contraindicated or less effective than EGFR TKIs, despite PD-L1 positivity. Use targeted Osimertinib."
    },
    {
      flag_type: "prior_therapy_conflict",
      severity: "low",
      description: "Ensure no current treatment with potent CYP3A4 inducers (e.g. phenytoin, rifampicin), which will decrease Osimertinib exposure."
    }
  ],
  prognosis_stats: {
    cohort_count: 154,
    median_os_months: 38.6,
    os_range: [32.4, 44.8],
    median_pfs_months: 18.9,
    pfs_range: [15.2, 22.4],
    disclaimer: "Prognosis estimates are derived from historical cohort comparisons and do not guarantee individual outcomes. Use for clinical modeling and family counseling purposes."
  },
  agent2_insights: {
    trial_justifications: [
      {
        nct_id: "NCT04300127",
        rationale: "Strong fit as first-line trial comparing Osimertinib monotherapy vs combination. Matches patient's exact EGFR exon 19 deletion.",
        matched_criteria: ["EGFR Exon 19 Del", "Treatment-naive"]
      }
    ],
    cohort_comparison: "Patient aligns closely with the SYN-001 cohort (87% similarity), which showed favorable OS of 38.6 months and manageable G1 toxicity with first-line daily Osimertinib.",
    toxicity_warnings: [
      "Monitor QTc interval dynamically. Patient is on baseline anti-hypertensives.",
      "Ensure diarrhea management protocols are reviewed prior to treatment onset."
    ],
    clinical_question_suggestion: "Should we perform a baseline brain MRI due to Stage IVa classification and the N2 stage, despite lack of neurological symptoms?"
  },
  documents: {
    treatment_plan: "# Personalized Treatment Plan (Targeted Therapy)\n\n**Regimen:** Osimertinib (Tagrisso) 80mg orally once daily.\n\n**Duration:** Continue until disease progression or unacceptable toxicity.\n\n**Monitoring:** Repeat chest CT every 8-12 weeks to assess therapeutic response.\n\n*Draft regimen for review - not a prescription.*",
    mdt_brief: "# MDT Briefing Notes\n\nPatient is a 62-year-old female, active smoker history, presenting with Stage IVa Lung Adenocarcinoma. NGS reveals EGFR exon 19 deletion.\n\n**Consensus Recommendation:** Initiate first-line Osimertinib 80mg QD. Monitor LFTs and QTc interval at baseline and periodically.",
    trial_report: "# Clinical Trial Matching Report\n\n**NCT04300127 (ADAURA Variant Study):** Phase III trial evaluating Osimertinib post-resection. High molecular match.\n\n**NCT03491540 (LAURA Study):** Evaluting Osimertinib after chemoradiation in unresectable Stage III EGFRm NSCLC.",
    referral_letter: "# Medical Referral Letter\n\nDear Colleague,\n\nI am referring this 62yo female patient diagnosed with EGFR-mutated Stage IV lung adenocarcinoma for evaluation of targeted TKI therapy. Enclosed are pathology, NGS reports, and staging scans.\n\nSincerely,\nOncology Department",
    toxicity_check: "# Toxicity & Safety Guidance\n\n- Check baseline LFTs and QTc interval.\n- Advise patient on diarrhea management (loperamide standby) and dermatologic care (topical emollients).\n- Monitor for pneumonitis/ILD symptoms (cough, dyspnea).",
    prognosis: "# Prognosis & Cohort Expectations\n\nBased on similar clinical cohorts with EGFR exon 19 deletions treated with front-line Osimertinib, median Progression-Free Survival (PFS) is 18.9 months, and median Overall Survival (OS) is 38.6 months.",
    patient_summary_clinical: "# Clinical Summary Draft\n\nStage IV lung adenocarcinoma with EGFR exon 19 deletion. Recommend daily Osimertinib (TKI targeted therapy). Close monitoring for skin, GI toxicity and routine CT imaging."
  },
  retrieval_ids: ["SYN-001", "NCT04300127"],
  approved_at: null,
  approved_documents: null
};

export function getMockSessionPayload(sessionId: string): SessionPayload {
  return {
    ...MOCK_SESSION_PAYLOAD,
    session_id: sessionId
  };
}
