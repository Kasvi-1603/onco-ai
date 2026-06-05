from typing import List, Dict, Any
from backend.models.schemas import PatientProfile, CohortScore

def calculate_similarity_score(patient: PatientProfile, cohort: Dict[str, Any]) -> CohortScore:
    """
    Calculates weighted JSON field scoring for a patient profile against a historical cohort.
    Weights: genomic 0.35, pathology 0.25, clinical 0.25, imaging-text 0.15
    """
    scores = {}
    
    # 1. Genomic Score (0.35 weight)
    genomic_score = 0.0
    genomic_features = ["egfr", "kras", "alk", "ros1", "tp53", "stk11", "keap1", "tmb", "pd_l1", "cnvs"]
    matched_genomic = 0
    total_genomic = 0
    for feat in genomic_features:
        p_val = getattr(patient.genomic, feat, None)
        c_val = cohort.get("genomic", {}).get(feat)
        if p_val is not None and c_val is not None:
            total_genomic += 1
            if str(p_val).lower() == str(c_val).lower():
                matched_genomic += 1
    
    genomic_score = matched_genomic / total_genomic if total_genomic > 0 else 0.0
    scores["genomic"] = {"score": genomic_score, "color": _get_color(genomic_score)}

    # 2. Pathology Score (0.25 weight)
    pathology_score = 0.0
    pathology_features = ["subtype", "grade", "mitotic_index", "margins", "size_mm"]
    matched_path = 0
    total_path = 0
    for feat in pathology_features:
        p_val = getattr(patient.pathology, feat, None)
        c_val = cohort.get("pathology", {}).get(feat)
        if p_val is not None and c_val is not None:
            total_path += 1
            # Simple categorical match; in a real app, continuous vars like size_mm would use numeric distance
            if str(p_val).lower() == str(c_val).lower():
                matched_path += 1
                
    pathology_score = matched_path / total_path if total_path > 0 else 0.0
    scores["pathology"] = {"score": pathology_score, "color": _get_color(pathology_score)}

    # 3. Clinical Score (0.25 weight)
    clinical_score = 0.0
    clinical_features = ["age", "sex", "smoking", "ecog", "stage"]
    matched_clin = 0
    total_clin = 0
    for feat in clinical_features:
        p_val = getattr(patient.clinical, feat, None)
        c_val = cohort.get("clinical", {}).get(feat)
        if p_val is not None and c_val is not None:
            total_clin += 1
            if str(p_val).lower() == str(c_val).lower():
                matched_clin += 1
                
    clinical_score = matched_clin / total_clin if total_clin > 0 else 0.0
    scores["clinical"] = {"score": clinical_score, "color": _get_color(clinical_score)}

    # 4. Imaging Score (0.15 weight)
    imaging_score = 0.0
    imaging_features = ["lobe", "n_stage", "pleural_invasion"]
    matched_img = 0
    total_img = 0
    for feat in imaging_features:
        p_val = getattr(patient.imaging, feat, None)
        c_val = cohort.get("imaging", {}).get(feat)
        if p_val is not None and c_val is not None:
            total_img += 1
            if str(p_val).lower() == str(c_val).lower():
                matched_img += 1
                
    imaging_score = matched_img / total_img if total_img > 0 else 0.0
    scores["imaging"] = {"score": imaging_score, "color": _get_color(imaging_score)}

    # Calculate overall score
    overall_score = (genomic_score * 0.35) + (pathology_score * 0.25) + (clinical_score * 0.25) + (imaging_score * 0.15)
    
    return CohortScore(
        cohort_id=cohort.get("cohort_id", "UNKNOWN"),
        overall_score=overall_score,
        param_breakdown=scores,
        cohort_data=cohort
    )

def _get_color(score: float) -> str:
    if score >= 0.85:
        return "green"
    elif score >= 0.50:
        return "amber"
    else:
        return "red"

def find_similar_cohorts(patient: PatientProfile, all_cohorts: List[Dict[str, Any]], top_k: int = 10) -> List[CohortScore]:
    scored_cohorts = []
    for cohort in all_cohorts:
        score = calculate_similarity_score(patient, cohort)
        scored_cohorts.append(score)
        
    scored_cohorts.sort(key=lambda x: x.overall_score, reverse=True)
    return scored_cohorts[:top_k]
