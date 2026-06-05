"""Shared API schemas — must mirror frontend/lib/types.ts."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

SessionStatus = Literal["pending", "reviewed", "shared"]
MatchColor = Literal["green", "amber", "red"]


class PathologyProfile(BaseModel):
    subtype: str | None = None
    histological_type: str | None = None
    grade: str | None = None
    mitotic_index: float | None = None
    surgical_margin: str | None = None
    tumor_size_mm: float | None = None
    lvi: bool | None = None
    pni: bool | None = None


class GenomicProfile(BaseModel):
    egfr: str | None = None
    kras: str | None = None
    alk: str | None = None
    ros1: str | None = None
    tp53: str | None = None
    stk11: str | None = None
    keap1: str | None = None
    tmb: float | None = None
    pd_l1_percent: float | None = None
    cnv: str | None = None
    assay: str | None = None


class ImagingProfile(BaseModel):
    tumor_lobe: str | None = None
    n_stage: str | None = None
    m_stage: str | None = None
    pleural_invasion: bool | None = None
    metastasis_sites: list[str] = Field(default_factory=list)
    max_tumor_size_mm: float | None = None


class ClinicalLabs(BaseModel):
    egfr_ml_min: float | None = None
    alt_u_l: float | None = None
    hemoglobin_g_dl: float | None = None
    platelets_k: float | None = None


class ClinicalProfile(BaseModel):
    age: int | None = None
    sex: str | None = None
    smoking: str | None = None
    ecog: int | None = None
    stage: str | None = None
    tnm: str | None = None
    prior_therapies: list[str] = Field(default_factory=list)
    comorbidities: list[str] = Field(default_factory=list)
    labs: ClinicalLabs | None = None
    weight_kg: float | None = None
    allergies: list[str] = Field(default_factory=list)


class PatientProfile(BaseModel):
    pathology: PathologyProfile = Field(default_factory=PathologyProfile)
    genomic: GenomicProfile = Field(default_factory=GenomicProfile)
    imaging: ImagingProfile = Field(default_factory=ImagingProfile)
    clinical: ClinicalProfile = Field(default_factory=ClinicalProfile)
    missing_fields: list[str] = Field(default_factory=list)
    source_snippets: dict[str, str] = Field(default_factory=dict)


class ParamScore(BaseModel):
    param: str
    score: float
    color: MatchColor
    patient_value: str | None = None
    cohort_value: str | None = None


class SimilarCohort(BaseModel):
    cohort_id: str
    overall_score: float
    param_breakdown: list[ParamScore]
    cancer_subtype: str | None = None
    primary_mutation: str | None = None
    stage: str | None = None
    treatment_given: str | None = None
    outcome_os_months: float | None = None
    outcome_pfs_months: float | None = None
    clinical_outcome: str | None = None
    toxicity_profile: str | None = None
    pathology_summary: str | None = None


class TrialMatch(BaseModel):
    nct_id: str
    title: str
    phase: str | None = None
    status: str | None = None
    eligibility: Literal["eligible_for_review", "conflicts", "excluded"] = "eligible_for_review"
    matched_on: list[str] = Field(default_factory=list)
    conflicts: list[str] = Field(default_factory=list)
    inclusion_summary: str | None = None
    intervention: str | None = None


class KnowledgeSnippet(BaseModel):
    snippet_id: str
    source: str
    tags: list[str] = Field(default_factory=list)
    content: str


class RiskFlag(BaseModel):
    code: str
    severity: Literal["info", "warning", "critical"] = "warning"
    message: str


class PrognosisStats(BaseModel):
    cohort_count: int
    median_os_months: float | None = None
    os_range: tuple[float, float] | None = None
    median_pfs_months: float | None = None
    pfs_range: tuple[float, float] | None = None
    summary: str = ""


class TrialJustification(BaseModel):
    nct_id: str
    rationale: str
    matched_criteria: list[str] = Field(default_factory=list)


class Agent2Output(BaseModel):
    trial_justifications: list[TrialJustification] = Field(default_factory=list)
    cohort_comparison: str = ""
    toxicity_warnings: list[str] = Field(default_factory=list)
    clinical_question_suggestion: str = ""


class SessionDocuments(BaseModel):
    treatment_plan: str = ""
    mdt_brief: str = ""
    trial_report: str = ""


class SessionPayload(BaseModel):
    session_id: str
    status: SessionStatus = "pending"
    patient_profile: PatientProfile = Field(default_factory=PatientProfile)
    similar_cohorts: list[SimilarCohort] = Field(default_factory=list)
    trial_matches: list[TrialMatch] = Field(default_factory=list)
    knowledge_snippets: list[KnowledgeSnippet] = Field(default_factory=list)
    risk_flags: list[RiskFlag] = Field(default_factory=list)
    prognosis_stats: PrognosisStats | None = None
    agent2_insights: Agent2Output | None = None
    documents: SessionDocuments = Field(default_factory=SessionDocuments)
    retrieval_ids: list[str] = Field(default_factory=list)
    approved_at: datetime | None = None
    approved_documents: SessionDocuments | None = None
    draft_label: str = "DRAFT — for oncologist review"


class RAGContext(BaseModel):
    session_id: str
    patient_profile: PatientProfile
    top_cohorts: list[SimilarCohort] = Field(default_factory=list)
    top_trials: list[TrialMatch] = Field(default_factory=list)
    knowledge_snippets: list[KnowledgeSnippet] = Field(default_factory=list)
    risk_flags: list[RiskFlag] = Field(default_factory=list)
    prognosis_stats: PrognosisStats | None = None
    retrieval_ids: list[str] = Field(default_factory=list)


class AuditEntry(BaseModel):
    step: str
    model: str | None = None
    input_hash: str | None = None
    retrieved_ids: list[str] = Field(default_factory=list)
    timestamp: datetime
    details: dict[str, Any] | None = None


class UploadResponse(BaseModel):
    session_id: str
    raw_text: str | None = None
    demo: bool = False


class ApproveResponse(BaseModel):
    status: SessionStatus
    approved_documents: SessionDocuments
    approved_at: datetime


class HealthResponse(BaseModel):
    status: str = "ok"
