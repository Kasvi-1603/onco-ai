# Oncopilot AI — Product Requirements Document (PRD)

## 1. Executive Summary

Oncopilot AI is a human-in-the-loop clinical trial optimization platform for oncology. It ingests unstructured patient clinical documents, extracts structured biomarker profiles using a two-agent AI pipeline, and surfaces ranked clinical trial matches for oncologist review.

The system never makes clinical decisions. Every AI output is presented as data for the oncologist to evaluate, approve, or dismiss. The oncologist is the decision-maker at every step.

Target context: Indian tertiary cancer centers, initially scoped to Non-Small Cell Lung Cancer (NSCLC).

---

## 2. Problem Statement

Clinical trials are critical for validating new medical treatments, but face three systemic failures:

**Participant recruitment delays**: 80% of trials fail to meet enrollment timelines. The root cause is manual screening — oncologists lack time to cross-reference complex patient profiles against lengthy eligibility criteria for dozens of trials simultaneously.

**Inefficient data handling**: Patient records arrive as scanned PDFs, handwritten notes, and reports from multiple diagnostic centers in varying formats. No structured extraction layer exists to normalize this data.

**Inadequate risk monitoring and compliance**: Protocol deviations and biomarker discordances are often caught late or missed entirely, with no automated alerting or audit trail for regulatory review.

---

## 3. Goals & Success Metrics

| Goal | Metric | Target |
|------|--------|--------|
| Reduce trial screening time | Time from file upload to ranked trial list | Under 3 minutes |
| Surface all relevant trials | Recall of eligible trials from seeded database | ≥ 90% |
| Zero autonomous clinical decisions | All AI outputs require explicit oncologist review action | 100% |
| Full audit traceability | Every AI step logged with model, input hash, timestamp | 100% of steps |
| Demo reliability | Pipeline completes without failure on demo patient | 100% |

---

## 4. Stakeholder Analysis

### 4.1 Primary User — Oncologist / Clinical Research Coordinator (CRC)

**Context**: Indian tertiary cancer centers see high patient volumes. An oncologist may review 30–50 cases per clinic session. Clinical trial screening is routinely deprioritized due to time pressure.

**Core pain**: Manual eligibility screening takes 20–40 minutes per patient. Oncologists skip trials they know exist simply because they cannot invest the time.

**What they need from the system**:
- Instant, structured snapshot of a patient's biomarker profile on document upload
- A ranked list of trials the patient may be eligible for, with the matching rationale visible
- Explicit alerts when conflicting data is detected (e.g., two reports disagree on mutation status)
- All information traceable back to the source document

**What they must never see**:
- A recommendation, prescription, or autonomous decision made by the AI
- Outputs presented without source provenance
- Any action taken on patient data without their explicit approval

**Primary interface**: Oncologist Strategy Dashboard

---

### 4.2 Secondary User — Patient & Family Unit

**Context**: Medical decisions in India are frequently collective. Families travel long distances from Tier-2 and Tier-3 cities to tertiary centers. Dense medical terminology causes anxiety and reduces informed consent rates for trial participation.

**Core pain**: Families leave appointments confused, unable to ask meaningful questions, and uncertain about what trial participation involves.

**What they need from the system**:
- Plain-language explanation of the patient's diagnosis and what the detected mutations mean
- A short list of questions to bring to the next appointment
- Information about what participating in a matched trial would involve
- Content in their preferred regional language

**What they must never see**:
- Any summary generated before the oncologist has reviewed and approved the profile
- Clinical recommendations presented as coming from an AI system

**Primary interface**: Patient Portal (unlocked after oncologist review)

---

### 4.3 Enterprise Stakeholder — Hospital Administration / Trial Sponsor

**Context**: Regulatory compliance and audit readiness are non-negotiable for trial sponsorship. Manual audit processes are slow and error-prone.

**Core pain**: No automated audit trail of how a patient was screened, what data was used, and what model produced which output.

**What they need from the system**:
- Immutable, append-only log of every automated step
- One-click compliance report export per patient session
- Clear traceability from AI output back to source document and timestamp

**Primary interface**: Audit Trail View

---

## 5. Disease Scope

### Non-Small Cell Lung Cancer (NSCLC) — Primary Focus

The matching engine targets these biomarkers:

| Biomarker | Clinical Significance | Trial Routing Logic |
|-----------|----------------------|---------------------|
| EGFR Exon 19 deletion | Sensitizing mutation | → First-line TKI trials (Osimertinib class) |
| EGFR L858R | Sensitizing mutation | → First-line TKI trials |
| EGFR Exon 20 insertion | Rare, TKI-resistant | → Insertion-specific trial protocols only |
| ALK rearrangement | Fusion driver | → ALK inhibitor trials (Alectinib class) |
| ROS1 rearrangement | Fusion driver | → ROS1 inhibitor trials |
| PD-L1 ≥ 50%, no driver mutation | Immune checkpoint target | → Immunotherapy monotherapy trials |
| Prior TKI therapy exposure | Resistance risk | → Exclusion flag on most TKI trials |
| eGFR < 30 or Creatinine elevated | Organ function flag | → Renal exclusion flag on certain trials |

### Oral Lesion Pre-Screening — Secondary (Demo Optional)
A binary CNN classifier for oral lesion images. If confidence ≥ 0.85, routes to specialist queue. Not part of the primary demo flow.

---

## 6. Human-in-the-Loop Design Principles

These are non-negotiable product constraints, not optional features:

1. **No autonomous recommendations**: Trial matches are labeled "Eligible for review" — never "Recommended." Match scores are for sorting purposes only and are not displayed as recommendations.

2. **Explicit approval gates**: The Patient Portal summary is locked until the oncologist explicitly marks the profile as "Reviewed." The system cannot send anything to a patient without this action.

3. **All flags require manual resolution**: Risk alerts (biomarker discordance, organ function flags, eligibility conflicts) are raised by the system and resolved only by the oncologist. The system cannot auto-dismiss them.

4. **Provenance on every data point**: Every extracted biomarker links to the exact sentence in the source document that produced it. Every trial match shows the exact eligibility criterion text that was matched.

5. **Uncertainty is surfaced, not hidden**: When the extraction model cannot confidently extract a field, it is shown as "Not found in report — manual entry required" rather than omitted or guessed.

---

## 7. Out of Scope (Hackathon MVP)

- User authentication and multi-user session management
- Real EHR integration (HL7 FHIR, Epic, etc.)
- Patient history across multiple visits
- Trial enrollment workflow beyond the matching step
- Oral lesion CNN (secondary feature, include only if time permits)
- Mobile native app
- Billing or insurance logic

---

## 8. Constraints

- **No autonomous AI decisions**: All outputs are advisory only, presented to the oncologist for review
- **Demo reliability over feature completeness**: Pre-seeded trial cache, demo patient bypass, Ollama fallback are mandatory
- **Free-tier infrastructure only**: Groq API (free tier), SQLite, local Ollama — no paid cloud services
- **Single-command startup**: `docker compose up` must bring the full stack live in under 60 seconds
