from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

class PathologySchema(BaseModel):
    subtype: Optional[str] = None
    grade: Optional[str] = None
    mitotic_index: Optional[str] = None
    margins: Optional[str] = None
    size_mm: Optional[float] = None
    lvi: Optional[str] = None
    pni: Optional[str] = None

class GenomicSchema(BaseModel):
    egfr: Optional[str] = None
    kras: Optional[str] = None
    alk: Optional[str] = None
    ros1: Optional[str] = None
    tp53: Optional[str] = None
    stk11: Optional[str] = None
    keap1: Optional[str] = None
    tmb: Optional[str] = None
    pd_l1: Optional[str] = None
    cnvs: Optional[str] = None
    msi: Optional[str] = None
    fusions: Optional[str] = None

class ImagingSchema(BaseModel):
    lobe: Optional[str] = None
    n_stage: Optional[str] = None
    metastasis_sites: Optional[List[str]] = Field(default_factory=list)
    pleural_invasion: Optional[str] = None

class ClinicalSchema(BaseModel):
    age: Optional[int] = None
    sex: Optional[str] = None
    smoking: Optional[str] = None
    ecog: Optional[int] = None
    stage: Optional[str] = None
    prior_therapies: Optional[List[str]] = Field(default_factory=list)
    comorbidities: Optional[List[str]] = Field(default_factory=list)
    labs: Optional[Dict[str, Any]] = Field(default_factory=dict)
    allergies: Optional[List[str]] = Field(default_factory=list)
    weight: Optional[float] = None

class PatientProfile(BaseModel):
    pathology: PathologySchema = Field(default_factory=PathologySchema)
    genomic: GenomicSchema = Field(default_factory=GenomicSchema)
    imaging: ImagingSchema = Field(default_factory=ImagingSchema)
    clinical: ClinicalSchema = Field(default_factory=ClinicalSchema)
    missing_fields: List[str] = Field(default_factory=list)
    source_snippets: Dict[str, str] = Field(default_factory=dict)
    positive_biomarkers: List[str] = Field(default_factory=list)
    candidate_drugs: List[str] = Field(default_factory=list)

class CohortScore(BaseModel):
    cohort_id: str
    overall_score: float
    param_breakdown: Dict[str, Dict[str, Any]] # e.g., "genomic": {"score": 0.8, "color": "green", "details": "EGFR matches"}
    cohort_data: Dict[str, Any]

class TrialMatch(BaseModel):
    nct_id: str
    title: str
    phase: str
    matched_criteria: List[str]
    conflicts: List[str]
    raw_eligibility: str

class KnowledgeSnippet(BaseModel):
    snippet_id: str
    content: str
    tags: List[str]

class PrognosisStats(BaseModel):
    median_os_months: Optional[float] = None
    median_pfs_months: Optional[float] = None
    range_os_months: Optional[List[float]] = None
    range_pfs_months: Optional[List[float]] = None
    cohort_size: int

class RAGContext(BaseModel):
    session_id: str
    patient_profile: PatientProfile
    top_cohorts: List[CohortScore]
    top_trials: List[TrialMatch]
    knowledge_snippets: List[KnowledgeSnippet]
    risk_flags: List[str]
    prognosis_stats: PrognosisStats
    source_snippets: Dict[str, str]
    retrieval_ids: List[str]
