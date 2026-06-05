from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime

# ── Agent 1 output structures ────────────────────────────────

class PathologyInfo(BaseModel):
    subtype: Optional[str] = None
    grade: Optional[str] = None
    mitotic_index: Optional[str] = None
    margins: Optional[str] = None
    size_mm: Optional[float] = None

class GenomicInfo(BaseModel):
    egfr: Optional[str] = None
    kras: Optional[str] = None
    alk: Optional[str] = None
    ros1: Optional[str] = None
    tp53: Optional[str] = None
    tmb: Optional[str] = None
    pd_l1: Optional[float] = None

class ImagingInfo(BaseModel):
    lobe: Optional[str] = None
    n_stage: Optional[str] = None
    metastasis_sites: list[str] = []
    pleural_invasion: Optional[bool] = None

class ClinicalInfo(BaseModel):
    age: Optional[int] = None
    sex: Optional[str] = None
    smoking: Optional[str] = None
    ecog: Optional[int] = None
    stage: Optional[str] = None
    prior_therapies: list[str] = []
    comorbidities: list[str] = []

class PatientProfile(BaseModel):
    pathology: PathologyInfo = PathologyInfo()
    genomic: GenomicInfo = GenomicInfo()
    imaging: ImagingInfo = ImagingInfo()
    clinical: ClinicalInfo = ClinicalInfo()
    missing_fields: list[str] = []
    source_snippets: dict[str, str] = {}

# ── Retrieval outputs ────────────────────────────────────────

class SimilarCohort(BaseModel):
    cohort_id: str
    overall_score: float
    param_breakdown: dict[str, Any] = {}
    treatment_given: str = ""
    outcome_os_months: Optional[float] = None
    outcome_pfs_months: Optional[float] = None
    clinical_outcome: Optional[str] = None
    toxicity_profile: Optional[str] = None

class TrialMatch(BaseModel):
    nct_id: str
    title: str
    phase: Optional[str] = None
    matched_on: list[str] = []
    conflicts: list[str] = []
    eligibility_excerpt: Optional[str] = None

class RiskFlag(BaseModel):
    flag_type: str
    message: str
    severity: str  # "low" | "medium" | "high"

class PrognosisStats(BaseModel):
    median_os_months: Optional[float] = None
    median_pfs_months: Optional[float] = None
    os_range: Optional[tuple[float, float]] = None
    cohort_count: int = 0
    note: str = ""

# ── Agent 2 output ───────────────────────────────────────────

class Agent2Output(BaseModel):
    trial_justifications: list[dict] = []
    cohort_comparison: str = ""
    toxicity_warnings: list[str] = []
    clinical_question_suggestion: str = ""

# ── RAG context pack ─────────────────────────────────────────

class RAGContext(BaseModel):
    session_id: str
    patient_profile: PatientProfile
    top_cohorts: list[SimilarCohort] = []
    top_trials: list[TrialMatch] = []
    knowledge_snippets: list[dict] = []
    risk_flags: list[RiskFlag] = []
    prognosis_stats: PrognosisStats = PrognosisStats()
    source_snippets: dict[str, str] = {}
    retrieval_ids: list[str] = []

# ── Final payload (both views consume this) ──────────────────

class SessionPayload(BaseModel):
    session_id: str
    status: str = "pending"   # pending | reviewed | shared
    patient_profile: PatientProfile
    similar_cohorts: list[SimilarCohort] = []
    trial_matches: list[TrialMatch] = []
    risk_flags: list[RiskFlag] = []
    prognosis_stats: PrognosisStats = PrognosisStats()
    agent2_insights: Agent2Output = Agent2Output()
    documents: dict[str, str] = {}
    retrieval_ids: list[str] = []
    approved_at: Optional[datetime] = None
    approved_documents: Optional[dict[str, str]] = None