"""Shared API schemas — aligned with frontend-implementation.md."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field, computed_field, model_validator

SessionStatus = Literal["uploaded", "processing", "pending", "reviewed", "shared", "failed", "ready"]
PipelineStatusValue = Literal["uploaded", "processing", "ready", "failed"]
MatchColor = Literal["green", "amber", "red"]
SupportedLang = Literal["en", "hi", "ta", "kn"]
ExtractionConfidence = Literal["high", "medium", "low"]

PIPELINE_STEPS = [
    "ocr",
    "extract",
    "similarity",
    "trial_match",
    "knowledge_retrieve",
    "agent2",
    "documents",
    "ready",
]


class PathologyProfile(BaseModel):
    subtype: str | None = None
    histological_type: str | None = None
    grade: str | None = None
    mitotic_index: float | None = None
    surgical_margin: str | None = None
    margins: str | None = None
    tumor_size_mm: float | None = None
    size_mm: float | None = None
    lvi: bool | None = None
    pni: bool | None = None

    @model_validator(mode="after")
    def _normalize_aliases(self) -> "PathologyProfile":
        # Normalize surgical_margin → margins
        if self.margins is None and self.surgical_margin is not None:
            object.__setattr__(self, "margins", self.surgical_margin)
        # Normalize tumor_size_mm → size_mm
        if self.size_mm is None and self.tumor_size_mm is not None:
            object.__setattr__(self, "size_mm", self.tumor_size_mm)
        return self


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
    pd_l1: float | None = None
    cnv: str | None = None
    assay: str | None = None

    @model_validator(mode="after")
    def _normalize_pdl1(self) -> "GenomicProfile":
        # Normalize pd_l1_percent → pd_l1
        if self.pd_l1 is None and self.pd_l1_percent is not None:
            object.__setattr__(self, "pd_l1", self.pd_l1_percent)
        return self


class ImagingProfile(BaseModel):
    tumor_lobe: str | None = None
    lobe: str | None = None
    n_stage: str | None = None
    m_stage: str | None = None
    pleural_invasion: bool | None = None
    metastasis_sites: list[str] = Field(default_factory=list)
    max_tumor_size_mm: float | None = None

    @model_validator(mode="after")
    def _normalize_aliases(self) -> "ImagingProfile":
        # Normalize tumor_lobe → lobe
        if self.lobe is None and self.tumor_lobe is not None:
            object.__setattr__(self, "lobe", self.tumor_lobe)
        return self


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
    labs: ClinicalLabs | dict[str, Any] | None = None
    weight_kg: float | None = None
    allergies: list[str] = Field(default_factory=list)


class PatientProfile(BaseModel):
    pathology: PathologyProfile = Field(default_factory=PathologyProfile)
    genomic: GenomicProfile = Field(default_factory=GenomicProfile)
    imaging: ImagingProfile = Field(default_factory=ImagingProfile)
    clinical: ClinicalProfile = Field(default_factory=ClinicalProfile)
    missing_fields: list[str] = Field(default_factory=list)
    source_snippets: dict[str, str] = Field(default_factory=dict)
    extraction_confidence: ExtractionConfidence = "high"


class ParamScore(BaseModel):
    param: str
    score: float
    color: MatchColor
    patient_value: str | float | None = None
    cohort_value: str | float | None = None


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
    trial_title: str | None = None
    phase: str | None = None
    status: str | None = None
    eligibility: Literal["eligible_for_review", "conflicts", "excluded"] = "eligible_for_review"
    matched_on: list[str] = Field(default_factory=list)
    conflicts: list[str] = Field(default_factory=list)
    inclusion_summary: str | None = None
    raw_eligibility: str | None = None
    intervention: str | None = None
    match_score: float | None = None

    def model_post_init(self, __context: Any) -> None:
        if not self.trial_title:
            object.__setattr__(self, "trial_title", self.title)
        if not self.raw_eligibility:
            object.__setattr__(self, "raw_eligibility", self.inclusion_summary or "")


class KnowledgeSnippet(BaseModel):
    snippet_id: str
    source: str
    tags: list[str] = Field(default_factory=list)
    content: str


class RiskFlag(BaseModel):
    code: str
    message: str
    severity: Literal["info", "warning", "critical", "high", "medium", "low"] = "warning"

    @computed_field  # type: ignore[prop-decorator]
    @property
    def flag_type(self) -> str:
        return self.code

    @computed_field  # type: ignore[prop-decorator]
    @property
    def description(self) -> str:
        return self.message


class PrognosisStats(BaseModel):
    cohort_count: int
    median_os_months: float | None = None
    os_range: tuple[float, float] | list[float] | None = None
    median_pfs_months: float | None = None
    pfs_range: tuple[float, float] | list[float] | None = None
    summary: str = ""
    disclaimer: str = "Uncertain individual estimate — discuss with your care team."

    def model_post_init(self, __context: Any) -> None:
        if self.summary and not self.disclaimer.startswith("Uncertain"):
            object.__setattr__(self, "disclaimer", self.summary)


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
    referral_letter: str = ""
    toxicity_check: str = ""
    prognosis: str = ""
    patient_summary_clinical: str = ""


class SessionPayload(BaseModel):
    session_id: str
    status: SessionStatus = "pending"
    patient_profile: PatientProfile = Field(default_factory=PatientProfile)
    similar_cohorts: list[SimilarCohort] = Field(default_factory=list)
    trial_matches: list[TrialMatch] = Field(default_factory=list)
    knowledge_snippets: list[KnowledgeSnippet] = Field(default_factory=list)
    knowledge_snippet_ids: list[str] = Field(default_factory=list)
    risk_flags: list[RiskFlag] = Field(default_factory=list)
    prognosis_stats: PrognosisStats | None = None
    agent2_insights: Agent2Output | None = None
    documents: SessionDocuments = Field(default_factory=SessionDocuments)
    retrieval_ids: list[str] = Field(default_factory=list)
    approved_at: datetime | None = None
    approved_documents: SessionDocuments | None = None
    draft_label: str = "DRAFT — for oncologist review"

    def model_post_init(self, __context: Any) -> None:
        if not self.knowledge_snippet_ids and self.knowledge_snippets:
            object.__setattr__(
                self,
                "knowledge_snippet_ids",
                [k.snippet_id for k in self.knowledge_snippets],
            )


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
    timestamp: datetime | str
    details: dict[str, Any] | None = None


class AuditResponse(BaseModel):
    session_id: str
    entries: list[AuditEntry]


class UploadResponse(BaseModel):
    session_id: str
    status: Literal["uploaded"] = "uploaded"
    file_count: int = 0
    ocr_preview: str | None = None
    demo: bool = False
    raw_text: str | None = None
    case_id: str | None = None
    case_label: str | None = None


class CaseSummary(BaseModel):
    case_id: str
    label: str
    description: str | None = None
    target_cohort: str | None = None


class PipelineStatus(BaseModel):
    session_id: str
    status: PipelineStatusValue
    current_step: str
    steps_completed: list[str] = Field(default_factory=list)
    steps_total: int = len(PIPELINE_STEPS)
    error: str | None = None


class DocumentsPatchRequest(BaseModel):
    documents: SessionDocuments


class ApproveRequest(BaseModel):
    approved_documents: SessionDocuments | None = None
    approver_note: str | None = None


class ApproveResponse(BaseModel):
    session_id: str
    status: Literal["shared"] = "shared"
    approved_at: datetime
    patient_portal_url: str
    approved_documents: SessionDocuments | None = None


class PatientLocalizedSections(BaseModel):
    what_we_found: str
    what_this_means: str
    side_effects: str
    trials: str | None = None
    questions_for_doctor: list[str] = Field(default_factory=list)


class PatientLocalizedView(BaseModel):
    session_id: str
    lang: SupportedLang
    status: Literal["shared"] = "shared"
    headline: str
    sections: PatientLocalizedSections
    footer_disclaimer: str


class PatientNotSharedError(BaseModel):
    error: Literal["not_shared"] = "not_shared"
    message: str = "Your doctor is reviewing your results"
    status: SessionStatus = "pending"


class HealthResponse(BaseModel):
    status: str = "ok"
    demo_patient: bool = False
