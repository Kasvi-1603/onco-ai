/** Mirror backend/models/schemas.py */

export type SessionStatus = "pending" | "reviewed" | "shared";
export type MatchColor = "green" | "amber" | "red";

export interface PathologyProfile {
  subtype?: string | null;
  histological_type?: string | null;
  grade?: string | null;
  mitotic_index?: number | null;
  surgical_margin?: string | null;
  tumor_size_mm?: number | null;
  lvi?: boolean | null;
  pni?: boolean | null;
}

export interface GenomicProfile {
  egfr?: string | null;
  kras?: string | null;
  alk?: string | null;
  ros1?: string | null;
  tp53?: string | null;
  stk11?: string | null;
  keap1?: string | null;
  tmb?: number | null;
  pd_l1_percent?: number | null;
  cnv?: string | null;
  assay?: string | null;
}

export interface ImagingProfile {
  tumor_lobe?: string | null;
  n_stage?: string | null;
  m_stage?: string | null;
  pleural_invasion?: boolean | null;
  metastasis_sites?: string[];
  max_tumor_size_mm?: number | null;
}

export interface ClinicalLabs {
  egfr_ml_min?: number | null;
  alt_u_l?: number | null;
  hemoglobin_g_dl?: number | null;
  platelets_k?: number | null;
}

export interface ClinicalProfile {
  age?: number | null;
  sex?: string | null;
  smoking?: string | null;
  ecog?: number | null;
  stage?: string | null;
  tnm?: string | null;
  prior_therapies?: string[];
  comorbidities?: string[];
  labs?: ClinicalLabs | null;
  weight_kg?: number | null;
  allergies?: string[];
}

export interface PatientProfile {
  pathology: PathologyProfile;
  genomic: GenomicProfile;
  imaging: ImagingProfile;
  clinical: ClinicalProfile;
  missing_fields: string[];
  source_snippets: Record<string, string>;
}

export interface ParamScore {
  param: string;
  score: number;
  color: MatchColor;
  patient_value?: string | null;
  cohort_value?: string | null;
}

export interface SimilarCohort {
  cohort_id: string;
  overall_score: number;
  param_breakdown: ParamScore[];
  cancer_subtype?: string | null;
  primary_mutation?: string | null;
  stage?: string | null;
  treatment_given?: string | null;
  outcome_os_months?: number | null;
  outcome_pfs_months?: number | null;
  clinical_outcome?: string | null;
  toxicity_profile?: string | null;
  pathology_summary?: string | null;
}

export interface TrialMatch {
  nct_id: string;
  title: string;
  phase?: string | null;
  status?: string | null;
  eligibility: "eligible_for_review" | "conflicts" | "excluded";
  matched_on: string[];
  conflicts: string[];
  inclusion_summary?: string | null;
  intervention?: string | null;
}

export interface KnowledgeSnippet {
  snippet_id: string;
  source: string;
  tags: string[];
  content: string;
}

export interface RiskFlag {
  code: string;
  severity: "info" | "warning" | "critical";
  message: string;
}

export interface PrognosisStats {
  cohort_count: number;
  median_os_months?: number | null;
  os_range?: [number, number] | null;
  median_pfs_months?: number | null;
  pfs_range?: [number, number] | null;
  summary: string;
}

export interface TrialJustification {
  nct_id: string;
  rationale: string;
  matched_criteria: string[];
}

export interface Agent2Output {
  trial_justifications: TrialJustification[];
  cohort_comparison: string;
  toxicity_warnings: string[];
  clinical_question_suggestion: string;
}

export interface SessionDocuments {
  treatment_plan: string;
  mdt_brief: string;
  trial_report: string;
}

export interface SessionPayload {
  session_id: string;
  status: SessionStatus;
  patient_profile: PatientProfile;
  similar_cohorts: SimilarCohort[];
  trial_matches: TrialMatch[];
  knowledge_snippets: KnowledgeSnippet[];
  risk_flags: RiskFlag[];
  prognosis_stats?: PrognosisStats | null;
  agent2_insights?: Agent2Output | null;
  documents: SessionDocuments;
  retrieval_ids: string[];
  approved_at?: string | null;
  approved_documents?: SessionDocuments | null;
  draft_label: string;
}

export interface AuditEntry {
  step: string;
  model?: string | null;
  input_hash?: string | null;
  retrieved_ids?: string[];
  timestamp: string;
  details?: Record<string, unknown> | null;
}

export interface UploadResponse {
  session_id: string;
  raw_text?: string | null;
  demo?: boolean;
}
