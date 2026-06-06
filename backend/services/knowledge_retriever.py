"""Knowledge retriever — tag overlap on mock NCCN/FDA snippets."""

from __future__ import annotations

from db.database import get_all_knowledge
from models.schemas import KnowledgeSnippet, PatientProfile


def _collect_tags(profile: PatientProfile) -> set[str]:
    tags: set[str] = set()
    g = profile.genomic
    if g.egfr:
        eg = g.egfr.lower()
        tags.add("egfr")
        if "exon 19" in eg:
            tags.add("exon19")
        if "l858r" in eg:
            tags.add("l858r")
        if "exon 20" in eg:
            tags.add("exon20")
    if g.kras and "g12c" in g.kras.lower():
        tags.add("kras")
        tags.add("g12c")
    if g.alk and "positive" in g.alk.lower():
        tags.add("alk")
    if g.pd_l1_percent is not None:
        tags.add("pd-l1")
        if g.pd_l1_percent >= 50:
            tags.add("pembrolizumab")
    if profile.pathology.subtype:
        tags.add(profile.pathology.subtype.lower())
    tags.add("osimertinib")
    tags.add("first-line")
    tags.add("stageiii")
    if profile.clinical.stage:
        tags.add(profile.clinical.stage.lower().replace(" ", ""))
    return tags


def retrieve_knowledge(profile: PatientProfile, limit: int = 5) -> list[KnowledgeSnippet]:
    patient_tags = _collect_tags(profile)
    rows = get_all_knowledge()
    scored: list[tuple[int, dict]] = []

    for row in rows:
        row_tags = {t.lower() for t in row.get("tags", [])}
        overlap = len(patient_tags & row_tags)
        if overlap > 0:
            scored.append((overlap, row))

    scored.sort(key=lambda x: x[0], reverse=True)
    result: list[KnowledgeSnippet] = []
    for _, row in scored[:limit]:
        result.append(
            KnowledgeSnippet(
                snippet_id=row["snippet_id"],
                source=row["source"],
                tags=row.get("tags", []),
                content=row["content"],
            )
        )
    return result
