export type SessionStatus = "uploaded" | "processing" | "pending" | "reviewed" | "shared" | "failed" | "ready";
export type MatchColor = "green" | "amber" | "red";
export type SupportedLang = "en" | "hi" | "ta" | "kn";

export interface SourceSnippets {
  [field: string]: string; // field path → exact OCR sentence
}

export interface PatientProfile {
  pathology: {
    subtype: string;
    histological_type?: string;
    grade?: string;
    mitotic_index?: string | number;
    margins?: string;
    surgical_margin?: string;   // alias for margins (demo data)
    size_mm?: number;
    tumor_size_mm?: number;    // alias for size_mm (demo data)
    lvi?: boolean;
    pni?: boolean;
  };
  genomic: {
    egfr?: string;
    kras?: string;
    alk?: string;
    ros1?: string;
    tp53?: string;
    stk11?: string;
    keap1?: string;
    tmb?: number;
    pd_l1?: number;
    pd_l1_percent?: number;    // alias for pd_l1 (demo data)
    cnv?: string;
    assay?: string;
  };
  imaging: {
    lobe?: string;
    tumor_lobe?: string;       // alias for lobe (demo data)
    n_stage?: string;
    m_stage?: string;
    metastasis_sites?: string[];
    pleural_invasion?: boolean;
    max_tumor_size_mm?: number;
  };
  clinical: {
    age?: number;
    sex?: string;
    smoking?: string;
    ecog?: number;
    stage?: string;
    tnm?: string;
    prior_therapies?: string[];
    comorbidities?: string[];
    labs?: Record<string, number | string>;
    weight_kg?: number;
    allergies?: string[];
  };
  missing_fields: string[];
  source_snippets: SourceSnippets;
  extraction_confidence: "high" | "medium" | "low";
}

export interface ParamScore {
  param: string;
  score: number;       // 0–1
  color: MatchColor;
  patient_value: string | number | null;
  cohort_value: string | number | null;
}

export interface SimilarCohort {
  cohort_id: string;   // SYN-001
  overall_score: number; // 0–1 → display as %
  param_breakdown: ParamScore[];
  cancer_subtype: string;
  primary_mutation: string;
  stage: string;
  treatment_given: string;
  outcome_os_months?: number;
  outcome_pfs_months?: number;
  clinical_outcome?: string;
  toxicity_profile?: string;
}

export interface TrialMatch {
  nct_id: string;
  trial_title: string;
  phase: string;
  matched_on: string[];
  conflicts: string[];
  raw_eligibility: string;
  match_score?: number; // sorting only
}

export interface RiskFlag {
  flag_type: "biomarker_discordance" | "renal_exclusion" | "prior_therapy_conflict" | string;
  severity: "high" | "medium" | "low";
  description: string;
}

export interface PrognosisStats {
  cohort_count: number;
  median_os_months: number;
  os_range: [number, number];
  median_pfs_months?: number;
  pfs_range?: [number, number];
  disclaimer: string;
}

export interface Agent2Insights {
  trial_justifications: Array<{
    nct_id: string;
    rationale: string;
    matched_criteria: string[];
  }>;
  cohort_comparison: string;
  toxicity_warnings: string[];
  clinical_question_suggestion: string;
}

export interface SessionDocuments {
  treatment_plan: string;
  mdt_brief: string;
  trial_report: string;
  referral_letter: string;
  toxicity_check: string;
  prognosis: string;
  patient_summary_clinical: string;
}

export interface SessionPayload {
  session_id: string;
  status: SessionStatus;
  patient_profile: PatientProfile;
  similar_cohorts: SimilarCohort[];
  trial_matches: TrialMatch[];
  knowledge_snippet_ids?: string[];
  risk_flags: RiskFlag[];
  prognosis_stats: PrognosisStats;
  agent2_insights: Agent2Insights;
  documents: SessionDocuments;
  retrieval_ids: string[];
  approved_at: string | null;
  approved_documents: Partial<SessionDocuments> | null;
}

export interface PatientLocalizedView {
  session_id: string;
  lang: SupportedLang;
  status: "shared";
  headline: string;
  sections: {
    what_we_found: string;
    what_this_means: string;
    side_effects: string;
    trials?: string;
    questions_for_doctor: string[];
  };
  footer_disclaimer: string;
}

export interface PipelineStatus {
  session_id: string;
  status: SessionStatus;
  current_step: string;
  steps_completed: string[];
  steps_total?: number;
  error: string | null;
}

export interface AuditEntry {
  step: string;
  model: string | null;
  input_hash: string;
  retrieved_ids: string[];
  timestamp: string;
}

export interface ApiError {
  error: string;
  message: string;
  status?: SessionStatus;
}

export interface CaseSummary {
  case_id: string;
  label: string;
  description?: string | null;
  target_cohort?: string | null;
}

export interface UploadResponse {
  session_id: string;
  status: "uploaded";
  file_count: number;
  ocr_preview?: string | null;
  demo: boolean;
  raw_text?: string | null;
  case_id?: string | null;
  case_label?: string | null;
}
