# Oncopilot AI — Implementation Guide

## 1. Repository Structure

```
oncopilot/
├── backend/
│   ├── main.py                  # FastAPI app entrypoint
│   ├── agents/
│   │   ├── extractor.py         # Agent 1: biomedical extraction
│   │   └── matcher.py           # Agent 2: trial eligibility matching
│   ├── models/
│   │   └── schemas.py           # Pydantic v2 schemas (shared contract)
│   ├── services/
│   │   ├── ocr.py               # OCR pipeline (Tesseract + pypdf)
│   │   ├── trials.py            # ClinicalTrials.gov API + local cache
│   │   ├── audit.py             # Audit log writer
│   │   └── translation.py      # Plain-language summary generation
│   ├── db/
│   │   ├── database.py          # SQLite connection + init
│   │   └── seed.py              # Trial cache seeding script
│   ├── routers/
│   │   ├── upload.py
│   │   ├── patients.py
│   │   ├── trials.py
│   │   └── audit.py
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── page.tsx             # Upload / landing
│   │   ├── dashboard/
│   │   │   └── [sessionId]/
│   │   │       └── page.tsx     # Oncologist dashboard
│   │   ├── patient/
│   │   │   └── [sessionId]/
│   │   │       └── page.tsx     # Patient portal
│   │   └── audit/
│   │       └── [sessionId]/
│   │           └── page.tsx     # Audit trail view
│   ├── components/
│   │   ├── BiomarkerBadge.tsx
│   │   ├── TrialMatchTable.tsx
│   │   ├── RiskFlagBanner.tsx
│   │   ├── PipelineProgress.tsx
│   │   ├── EligibilityDrawer.tsx
│   │   └── PatientSummaryCard.tsx
│   ├── lib/
│   │   └── api.ts               # API client (React Query hooks)
│   └── package.json
├── docker-compose.yml
└── .env.example
```

---

## 2. Environment Variables

```bash
# .env.example
GROQ_API_KEY=gsk_your_key_here
GROQ_MODEL=llama-3.1-70b-versatile
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
DATABASE_URL=./oncopilot.db
CLINICALTRIALS_API_BASE=https://clinicaltrials.gov/api/v2
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 3. Backend Setup

### requirements.txt

```
fastapi==0.111.0
uvicorn[standard]==0.30.1
pydantic==2.7.4
instructor==1.3.3
groq==0.9.0
openai==1.35.3          # used for Ollama OpenAI-compatible endpoint
pytesseract==0.3.13
pypdf==4.2.0
Pillow==10.3.0
opencv-python-headless==4.10.0.82
httpx==0.27.0
aiosqlite==0.20.0
python-multipart==0.0.9
python-dotenv==1.0.1
```

### main.py

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from db.database import init_db
from db.seed import seed_trials
from routers import upload, patients, trials, audit

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await seed_trials()          # pulls ~20 NSCLC trials at startup, stores in cache
    yield

app = FastAPI(title="Oncopilot AI", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router,   prefix="/api")
app.include_router(patients.router, prefix="/api")
app.include_router(trials.router,   prefix="/api")
app.include_router(audit.router,    prefix="/api")
```

---

## 4. Pydantic Schemas (Shared Contract)

This is the central contract between Agent 1, Agent 2, and the frontend. All four team members must agree on this before writing any other code.

```python
# backend/models/schemas.py
from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum

class MutationStatus(str, Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    UNKNOWN = "unknown"

class Biomarker(BaseModel):
    name: str = Field(description="Standardized name e.g. 'EGFR Exon 19 deletion'")
    status: MutationStatus
    assay_method: Optional[str] = Field(None, description="NGS, IHC, FISH, PCR")
    source_snippet: Optional[str] = Field(None, description="Exact sentence from source doc")
    confidence: str = Field(default="high", description="high / medium / low")

class OrganFunction(BaseModel):
    creatinine_mgdl: Optional[float] = None
    egfr_mlmin:      Optional[float] = None
    alt_ul:          Optional[float] = None
    bilirubin_mgdl:  Optional[float] = None

class MedicalProfileSchema(BaseModel):
    cancer_type:          str
    stage:                str   = Field(description="TNM stage e.g. 'Stage IIIB'")
    ecog_status:          Optional[int] = Field(None, ge=0, le=5)
    biomarkers:           List[Biomarker]
    pdl1_tps_percent:     Optional[float] = Field(None, ge=0, le=100)
    prior_therapies:      List[str]
    organ_function:       Optional[OrganFunction] = None
    smoking_history:      Optional[str] = None
    extraction_confidence: str = Field(description="overall: high / medium / low")
    missing_fields:       List[str] = Field(
        description="Fields not found in report — surfaced in UI for manual entry"
    )

class TrialMatch(BaseModel):
    nct_id:          str
    trial_title:     str
    phase:           str
    match_score:     float = Field(ge=0, le=1, description="Sorting score only — not a recommendation")
    matched_on:      List[str]   = Field(description="Inclusion criteria that matched")
    conflicts:       List[str]   = Field(description="Exclusion criteria that triggered")
    raw_eligibility: str         = Field(description="Full eligibility text for provenance")

class RiskFlag(BaseModel):
    flag_type:   str   # 'biomarker_discordance' | 'renal_exclusion' | 'prior_therapy_conflict'
    severity:    str   # 'high' | 'medium' | 'low'
    description: str
    resolved:    bool = False
```

---

## 5. Agent 1 — Biomedical Extraction

```python
# backend/agents/extractor.py
import os
import instructor
from groq import Groq
from openai import OpenAI
from models.schemas import MedicalProfileSchema

SYSTEM_PROMPT = """
You are a specialist in oncology data extraction.
Extract structured data from the clinical report text provided.
For every biomarker, include the exact sentence from the report that supports the finding in source_snippet.
If a field cannot be found, include it in missing_fields — do not guess.
You are providing data for oncologist review, not making clinical decisions.
"""

def _get_clients():
    """Returns list of (client, model) tuples in priority order."""
    clients = []
    if os.getenv("GROQ_API_KEY"):
        groq_client = instructor.from_groq(
            Groq(api_key=os.getenv("GROQ_API_KEY")),
            mode=instructor.Mode.JSON
        )
        clients.append((groq_client, os.getenv("GROQ_MODEL", "llama-3.1-70b-versatile")))

    ollama_client = instructor.from_openai(
        OpenAI(
            base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434") + "/v1",
            api_key="ollama"
        ),
        mode=instructor.Mode.JSON
    )
    clients.append((ollama_client, os.getenv("OLLAMA_MODEL", "llama3")))
    return clients

async def extract_medical_profile(raw_text: str) -> tuple[MedicalProfileSchema, str]:
    """
    Returns (profile, model_used).
    Tries Groq first, falls back to Ollama.
    """
    for client, model in _get_clients():
        try:
            profile = client.chat.completions.create(
                model=model,
                response_model=MedicalProfileSchema,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user",   "content": f"Extract the oncology profile from this report:\n\n{raw_text}"}
                ],
                max_retries=2,
                max_tokens=2000
            )
            return profile, model
        except Exception as e:
            print(f"[extractor] {model} failed: {e}, trying next...")
            continue

    raise RuntimeError("All LLM backends unavailable")
```

---

## 6. Agent 2 — Trial Matching Engine

The matching engine is deterministic — it does not call an LLM. It applies eligibility rules against the structured profile from Agent 1.

```python
# backend/agents/matcher.py
import json
from models.schemas import MedicalProfileSchema, TrialMatch, RiskFlag
from db.database import get_db

KNOWN_TKI_THERAPIES = ["osimertinib", "erlotinib", "gefitinib", "afatinib", "dacomitinib"]
KNOWN_ALK_THERAPIES = ["alectinib", "crizotinib", "ceritinib", "lorlatinib", "brigatinib"]

def match_trials(profile: MedicalProfileSchema, trials: list[dict]) -> tuple[list[TrialMatch], list[RiskFlag]]:
    matches = []
    risk_flags = []

    # Check for biomarker discordance across uploaded files (if multiple)
    _check_biomarker_discordance(profile, risk_flags)

    # Organ function flags
    if profile.organ_function:
        if profile.organ_function.egfr_mlmin and profile.organ_function.egfr_mlmin < 30:
            risk_flags.append(RiskFlag(
                flag_type="renal_exclusion",
                severity="high",
                description=f"eGFR {profile.organ_function.egfr_mlmin} mL/min is below the 30 mL/min threshold required by most trials. Manual review required."
            ))

    positive_biomarkers = [b.name.lower() for b in profile.biomarkers if b.status == "positive"]
    prior_therapies_lower = [t.lower() for t in profile.prior_therapies]

    for trial in trials:
        eligibility = trial.get("eligibility", "").lower()
        matched_on = []
        conflicts = []

        # Inclusion matching — check if any positive biomarker is mentioned in eligibility
        for biomarker_name in positive_biomarkers:
            keywords = _get_biomarker_keywords(biomarker_name)
            if any(kw in eligibility for kw in keywords):
                matched_on.append(biomarker_name)

        if not matched_on:
            continue  # No inclusion match — skip trial

        # Exclusion checking — prior therapies
        for therapy in prior_therapies_lower:
            if therapy in eligibility and "prior" in eligibility:
                conflicts.append(f"Prior {therapy} may conflict with trial exclusion criteria")
                risk_flags.append(RiskFlag(
                    flag_type="prior_therapy_conflict",
                    severity="medium",
                    description=f"Prior {therapy} exposure detected. Trial {trial['nct_id']} may exclude patients with prior TKI exposure. Oncologist review required."
                ))

        # PD-L1 check
        if profile.pdl1_tps_percent and profile.pdl1_tps_percent >= 50:
            if "pd-l1" in eligibility or "pembrolizumab" in eligibility:
                matched_on.append(f"PD-L1 TPS {profile.pdl1_tps_percent}%")

        score = _compute_score(matched_on, conflicts, profile)

        matches.append(TrialMatch(
            nct_id=trial["nct_id"],
            trial_title=trial["title"],
            phase=trial.get("phase", "Unknown"),
            match_score=round(score, 2),
            matched_on=matched_on,
            conflicts=conflicts,
            raw_eligibility=trial.get("eligibility", "")
        ))

    matches.sort(key=lambda m: m.match_score, reverse=True)
    return matches, risk_flags


def _get_biomarker_keywords(biomarker_name: str) -> list[str]:
    keyword_map = {
        "egfr exon 19 deletion": ["egfr exon 19", "egfr del19", "egfr deletion", "egfr-mutated"],
        "egfr l858r":            ["egfr l858r", "egfr exon 21", "egfr-mutated"],
        "egfr exon 20 insertion":["egfr exon 20", "egfr ex20ins"],
        "alk rearrangement":     ["alk", "alk-positive", "alk rearrangement", "alk fusion"],
        "ros1 rearrangement":    ["ros1", "ros1-positive", "ros1 rearrangement"],
    }
    for key, keywords in keyword_map.items():
        if key in biomarker_name:
            return keywords
    return [biomarker_name]


def _compute_score(matched_on: list, conflicts: list, profile: MedicalProfileSchema) -> float:
    base = len(matched_on) / max(len(profile.biomarkers), 1)
    penalty = len(conflicts) * 0.15
    return max(0.0, min(1.0, base - penalty))


def _check_biomarker_discordance(profile: MedicalProfileSchema, risk_flags: list[RiskFlag]):
    # Future: compare biomarkers across multiple uploaded files
    # For MVP: flag if the same biomarker appears with conflicting status
    seen = {}
    for b in profile.biomarkers:
        if b.name in seen and seen[b.name] != b.status:
            risk_flags.append(RiskFlag(
                flag_type="biomarker_discordance",
                severity="high",
                description=f"Conflicting results for {b.name}: reported as both {seen[b.name]} and {b.status}. Manual review required before trial matching."
            ))
        seen[b.name] = b.status
```

---

## 7. OCR Pipeline

```python
# backend/services/ocr.py
import pytesseract
import cv2
import numpy as np
from PIL import Image
from pypdf import PdfReader
import io

def extract_text_from_file(file_bytes: bytes, filename: str) -> str:
    if filename.lower().endswith(".pdf"):
        return _extract_from_pdf(file_bytes)
    else:
        return _extract_from_image(file_bytes)

def _extract_from_pdf(file_bytes: bytes) -> str:
    reader = PdfReader(io.BytesIO(file_bytes))
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""

    # If text layer is empty (scanned PDF), fall back to image OCR
    if len(text.strip()) < 50:
        return _pdf_as_image_ocr(file_bytes)
    return text

def _extract_from_image(file_bytes: bytes) -> str:
    np_arr = np.frombuffer(file_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    img = _preprocess(img)
    pil_img = Image.fromarray(img)
    return pytesseract.image_to_string(pil_img, lang="eng")

def _preprocess(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    # Deskew
    coords = np.column_stack(np.where(gray < 200))
    if len(coords):
        angle = cv2.minAreaRect(coords)[-1]
        if angle < -45: angle += 90
        (h, w) = gray.shape
        M = cv2.getRotationMatrix2D((w // 2, h // 2), angle, 1.0)
        gray = cv2.warpAffine(gray, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    # Denoise + threshold
    gray = cv2.fastNlMeansDenoising(gray, h=10)
    _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return binary

def _pdf_as_image_ocr(file_bytes: bytes) -> str:
    # Requires: pip install pdf2image poppler
    from pdf2image import convert_from_bytes
    images = convert_from_bytes(file_bytes, dpi=200)
    text = ""
    for img in images:
        text += pytesseract.image_to_string(np.array(img), lang="eng")
    return text
```

---

## 8. ClinicalTrials.gov Seeding

```python
# backend/db/seed.py
import httpx
import json
import aiosqlite

CTGOV_URL = "https://clinicaltrials.gov/api/v2/studies"

SEED_QUERIES = [
    {"query.cond": "Non-Small Cell Lung Cancer", "query.term": "EGFR mutation"},
    {"query.cond": "Non-Small Cell Lung Cancer", "query.term": "ALK rearrangement"},
    {"query.cond": "Non-Small Cell Lung Cancer", "query.term": "PD-L1"},
]

async def seed_trials():
    async with aiosqlite.connect("./oncopilot.db") as db:
        row = await db.execute_fetchall("SELECT COUNT(*) as c FROM trials_cache")
        if row[0][0] > 0:
            print("[seed] Trials cache already populated, skipping.")
            return

        print("[seed] Fetching trials from ClinicalTrials.gov...")
        seen = set()

        async with httpx.AsyncClient(timeout=30) as client:
            for query in SEED_QUERIES:
                params = {
                    **query,
                    "filter.overallStatus": "RECRUITING",
                    "fields": "NCTId,BriefTitle,EligibilityCriteria,Phase,LocationCity",
                    "pageSize": 10
                }
                try:
                    resp = await client.get(CTGOV_URL, params=params)
                    data = resp.json()
                    for study in data.get("studies", []):
                        nct_id = study["protocolSection"]["identificationModule"]["nctId"]
                        if nct_id in seen:
                            continue
                        seen.add(nct_id)

                        title = study["protocolSection"]["identificationModule"].get("briefTitle", "")
                        phase = study["protocolSection"].get("designModule", {}).get("phases", ["Unknown"])
                        eligibility = study["protocolSection"].get("eligibilityModule", {}).get("eligibilityCriteria", "")
                        locations = study.get("derivedSection", {})

                        await db.execute(
                            "INSERT OR IGNORE INTO trials_cache (nct_id, title, phase, eligibility) VALUES (?, ?, ?, ?)",
                            (nct_id, title, str(phase), eligibility)
                        )
                except Exception as e:
                    print(f"[seed] Query failed: {e}")
                    continue

        await db.commit()
        print(f"[seed] Seeded {len(seen)} trials.")
```

---

## 9. Translation Layer

```python
# backend/services/translation.py
import os
from groq import Groq
from openai import OpenAI
from models.schemas import MedicalProfileSchema, TrialMatch

PLAIN_LANGUAGE_PROMPT = """
You are a compassionate medical communicator helping a patient and their family understand a cancer diagnosis.
Write in warm, simple language avoiding all medical jargon.
When you must use a medical term, immediately explain it in brackets.
Do NOT make recommendations. Do NOT suggest the patient should or should not join a trial.
Present only facts for the patient to discuss with their doctor.
The oncologist has already reviewed and approved this information for patient sharing.
"""

LANGUAGE_INSTRUCTIONS = {
    "en": "Write in simple English.",
    "hi": "Write in simple Hindi (हिंदी). Use Devanagari script.",
    "ta": "Write in simple Tamil (தமிழ்).",
    "kn": "Write in simple Kannada (ಕನ್ನಡ).",
}

def generate_patient_summary(
    profile: MedicalProfileSchema,
    matches: list[TrialMatch],
    language: str = "en"
) -> str:
    lang_instruction = LANGUAGE_INSTRUCTIONS.get(language, LANGUAGE_INSTRUCTIONS["en"])

    content = f"""
{lang_instruction}

Patient profile (approved for sharing by oncologist):
- Cancer type: {profile.cancer_type}, {profile.stage}
- Key findings: {', '.join(b.name for b in profile.biomarkers if b.status == 'positive')}
- PD-L1 expression: {profile.pdl1_tps_percent if profile.pdl1_tps_percent else 'Not reported'}
- Prior treatments: {', '.join(profile.prior_therapies) if profile.prior_therapies else 'None recorded'}

Clinical trials the patient may be eligible for (oncologist to confirm):
{chr(10).join(f'- {m.trial_title} (Phase {m.phase})' for m in matches[:3])}

Write:
1. A 3-sentence plain-language explanation of the diagnosis
2. What the detected gene changes mean in simple terms (use a lock-and-key analogy)
3. Three questions the family should ask the doctor at their next appointment
4. A one-paragraph explanation of what joining a clinical trial involves
"""

    clients = [
        (Groq(api_key=os.getenv("GROQ_API_KEY")), os.getenv("GROQ_MODEL")),
        (OpenAI(base_url=os.getenv("OLLAMA_BASE_URL") + "/v1", api_key="ollama"), os.getenv("OLLAMA_MODEL")),
    ]

    for client, model in clients:
        try:
            resp = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": PLAIN_LANGUAGE_PROMPT},
                    {"role": "user",   "content": content}
                ],
                max_tokens=800
            )
            return resp.choices[0].message.content
        except Exception:
            continue

    return "Summary unavailable. Please ask your oncologist for an explanation."
```

---

## 10. Docker Compose

```yaml
# docker-compose.yml
version: "3.9"

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    volumes:
      - ./oncopilot.db:/app/oncopilot.db
    environment:
      - GROQ_API_KEY=${GROQ_API_KEY}
      - GROQ_MODEL=${GROQ_MODEL}
      - OLLAMA_BASE_URL=http://host.docker.internal:11434
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --reload

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    depends_on:
      - backend
```

---

## 11. Team Division

| Person | Owns | Day 1 deliverable |
|--------|------|-------------------|
| Dev 1 | FastAPI core, OCR pipeline, DB init, seeding script | `POST /api/upload` returning session ID with raw text |
| Dev 2 | Agent 1 (extractor), Agent 2 (matcher), risk flags | `GET /api/patient/{id}` returning full profile + matches |
| Dev 3 | Next.js upload page, oncologist dashboard, trial matrix table | Upload → pipeline progress → dashboard render |
| Dev 4 | Patient portal, translation endpoint, audit trail view, demo polish | Patient summary card + audit log table |

**Shared contract (agree day 1)**: `MedicalProfileSchema` and `TrialMatch` in `backend/models/schemas.py`. Both frontend and backend import from this single source.

---

## 12. Demo Reliability Checklist

- [ ] `DEMO_PATIENT` env flag bypasses upload and loads pre-seeded patient JSON directly
- [ ] Trial cache is pre-seeded before demo starts (`python -m db.seed`)
- [ ] Ollama running locally with `llama3` pulled (`ollama pull llama3`)
- [ ] Groq API key tested and confirmed working
- [ ] `docker compose up` tested from cold start
- [ ] ngrok URL shared with judges before presentation starts
- [ ] Demo patient PDF printed as backup if browser fails
