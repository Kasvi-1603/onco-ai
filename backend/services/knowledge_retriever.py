from typing import List, Dict, Any
from backend.models.schemas import PatientProfile, KnowledgeSnippet

def retrieve_knowledge(patient: PatientProfile, knowledge_db: List[Dict[str, Any]], limit: int = 5) -> List[KnowledgeSnippet]:
    """
    Retrieves mock NCCN/FDA guidelines based on overlapping tags.
    Tags are derived from positive biomarkers and candidate drugs in the patient profile.
    """
    # Build a set of patient tags to match against
    patient_tags = set()
    
    # Positive biomarkers
    for biomarker in patient.positive_biomarkers:
        patient_tags.add(str(biomarker).lower())
        
    # Candidate drugs
    for drug in patient.candidate_drugs:
        patient_tags.add(str(drug).lower())
        
    # Also add specific genomic findings if not explicitly in positive_biomarkers
    if patient.genomic.egfr and str(patient.genomic.egfr).lower() != "negative":
        patient_tags.add("egfr")
    if patient.genomic.alk and str(patient.genomic.alk).lower() != "negative":
        patient_tags.add("alk")
        
    matched_snippets = []
    
    for entry in knowledge_db:
        entry_tags = set([t.lower() for t in entry.get("tags", [])])
        
        # Check overlap
        if patient_tags.intersection(entry_tags):
            # Calculate match score based on number of overlapping tags
            overlap_count = len(patient_tags.intersection(entry_tags))
            matched_snippets.append((overlap_count, entry))
            
    # Sort by overlap count descending
    matched_snippets.sort(key=lambda x: x[0], reverse=True)
    
    # Return top 'limit' snippets mapped to KnowledgeSnippet schema
    results = []
    for _, snippet_data in matched_snippets[:limit]:
        results.append(KnowledgeSnippet(
            snippet_id=snippet_data.get("snippet_id", "UNKNOWN"),
            content=snippet_data.get("content", ""),
            tags=snippet_data.get("tags", [])
        ))
        
    return results
