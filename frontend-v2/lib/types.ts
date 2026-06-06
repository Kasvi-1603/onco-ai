export type SessionStatus = "uploaded" | "processing" | "pending" | "reviewed" | "shared" | "failed" | "ready";
export type MatchColor = "green" | "amber" | "red";
export type SupportedLang = "en" | "hi" | "ta" | "kn";

export interface MatchParameter {
  name: string;
  patient: string;
  match: string;
  score: MatchColor;
}

export interface ParamScore {
  param: string;
  score: number;
  color: MatchColor;
  patient_value: string | number | null;
  cohort_value: string | number | null;
}

export interface SimilarCohort {
  cohort_id: string;
  overall_score: number;
  param_breakdown: ParamScore[];
  cancer_subtype: string;
  primary_mutation: string;
  stage: string;
  treatment_given: string;
  outcome_os_months?: number;
  outcome_pfs_months?: number;
  clinical_outcome?: string;
}

export interface MatchResult {
  patient_id: string;
  similarity_score: number;
  treatment_history: string;
  guideline_citation: string;
  outcome: { response: string; OS_months: number; PFS_months: number } | string;
  stage: string;
  parameters: MatchParameter[];
  raw_case_data?: Record<string, unknown>;
}

export interface DoctorSession {
  session_id: string;
  status: SessionStatus;
  patient: Record<string, unknown>;
  patient_name: string;
  match_results: MatchResult[];
  selected_case_index: number;
  weights: Record<string, number>;
  approved_at: string | null;
}

export interface SourceSnippets {
  [field: string]: string;
}

export interface PatientProfile {
  pathology: Record<string, unknown>;
  genomic: Record<string, unknown>;
  imaging: Record<string, unknown>;
  clinical: Record<string, unknown>;
  missing_fields: string[];
  source_snippets: SourceSnippets;
  extraction_confidence: string;
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
  similar_cohorts: unknown[];
  trial_matches: unknown[];
  risk_flags: unknown[];
  prognosis_stats: Record<string, unknown>;
  agent2_insights: Record<string, unknown>;
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

export interface DemoUser {
  user_id: string;
  session_id: string;
  label: string;
}
