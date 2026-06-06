# OncopilotAI — Unified Frontend (Cursor Prompt v2)

## Project Context

You are rebuilding the frontend for **OncoPilot**, a clinical AI platform for lung cancer. The system has two portals:

- **View 1 — Oncologist Dashboard**: Runs the full pipeline. Input patient data → match against TCGA database → view similar cases → generate/approve documents → share with patient.
- **View 2 — Patient Portal**: Read-only, plain-language view of what the oncologist approved. Never re-runs analysis. Gated by `status = "shared"`.

The backend is a **FastAPI** app (`app.py` / `backend/`) already built. You are only building the **Next.js frontend**.

---

## Design System — CRITICAL, READ FIRST

**Style reference**: https://dribbble.com/shots/26300721-Website-Design-for-Healthcare-Platform (Conceptzilla healthcare platform)

Implement this design language faithfully:
- **Background**: Pure white `#FFFFFF` throughout — no dark mode, no grey backgrounds
- **Typography**: `Inter` for body, `Syne` for headings/display. Clean, generous line-height.
- **Accent color**: Soft teal/mint `#0EA5A0` for CTAs, active states, progress indicators
- **Secondary**: Light grey `#F4F4F5` for cards, `#71717A` for secondary text
- **Borders**: `1px solid #E4E4E7` — subtle, never heavy
- **Shadows**: `0 1px 3px rgba(0,0,0,0.06)` — barely-there elevation
- **Buttons**: Rounded `rounded-lg`, solid teal for primary, white+border for secondary
- **Cards**: White, rounded-xl, thin border, minimal shadow
- **Layout**: Generous whitespace, max-width containers, left sidebar nav on dashboard pages
- **No gradients, no purple, no glassmorphism, no dark panels**

### Hero section (Doctor Dashboard only)
The Dribbble reference has a large hero with a doctor image. **Replace that image with the interactive 3D Lung Model** (`Lungs3DModel.tsx`). The lung model sits in the right half of the hero, the left half has the patient input form or a welcome message. Clean white background behind the model.

### DNA Helix Model (Genomics page only)
On the Match Results / Genomics page, place the **DNA Helix 3D model** (from `frontend-from-test/components/view1/`) in the right panel alongside the genomic parameters comparison table.

---

## Tech Stack

```
Next.js 14 (App Router)
TypeScript
Tailwind CSS
shadcn/ui components
Zustand (global state)
React Three Fiber + @react-three/drei (3D models)
React Dropzone (file upload)
Recharts (charts in patient portal)
```

---

## Folder Structure

```
/app
  /login                          ← Dual-tab login (Doctor + Patient)
  /doctor
    /dashboard                    ← Hero + Patient Input Form
    /results/[sessionId]          ← Top-5 TCGA match results
    /ai-rationale/[sessionId]     ← Claude AI explanation
    /editor/[sessionId]           ← Document editor (from frontend-from-test)
  /patient
    /[sessionId]                  ← Patient portal (approval-gated)

/components
  /auth
    LoginPage.tsx
  /doctor
    PatientInputForm.tsx          ← 4-section form: pathology/genomics/imaging/clinical
    WeightSliders.tsx             ← 4 sliders for match weights
    MatchResultCard.tsx           ← Single TCGA case result card
    ParameterComparisonTable.tsx  ← Green/amber/red parameter rows
    AIRationalePanel.tsx          ← Claude response display
    DocumentEditor.tsx            ← From frontend-from-test, keep as-is
  /patient
    PatientSummaryCard.tsx        ← Plain-language section card
    LanguageToggle.tsx            ← en / hi / ta / kn
    PortalLockedState.tsx         ← "Doctor is reviewing" screen
    SymptomTracker.tsx            ← From frontend-from-test
    MedAdherence.tsx              ← From frontend-from-test
  /shared
    Lungs3DModel.tsx              ← Copy from frontend-from-test/components/view1/
    DNAHelixModel.tsx             ← Copy from frontend-from-test/components/view1/
    Sidebar.tsx
    TopNav.tsx

/lib
  api.ts                          ← All fetch calls
  store.ts                        ← Zustand store
  types.ts                        ← Shared TypeScript types

/data
  users/                          ← user copy 2.json, user copy 3.json, etc.
```

---

## 1. Login Page `/app/login/page.tsx`

Single white page. Two tabs: **"Oncologist"** and **"Patient"**.

### Visual layout
```
┌──────────────────────────────────────┐
│         OncoPilot                    │
│    [Oncologist]  [Patient]  ← tabs   │
│                                      │
│   Username  ________________         │
│   Password  ________________         │
│                                      │
│        [ Sign In → ]                 │
└──────────────────────────────────────┘
```

### Rules — NO INPUT CONSTRAINTS
- No `@` required in username
- No `Dr.` prefix required
- No regex validation on any field
- Only show error if credentials don't match
- Patient User ID = plain number (1, 2, 3…). Load `/data/users/user copy {id}.json`
- On patient login success → redirect `/patient/{sessionId}` (sessionId comes from the user JSON or can be the userId itself)
- On doctor login success → redirect `/doctor/dashboard`

### Patient user ID system
```typescript
// /data/users/user copy 2.json → userId = "2"
// userId IS the sessionId for patient routing
const userData = await import(`@/data/users/user copy ${userId}.json`)
```

---

## 2. Doctor Dashboard `/app/doctor/dashboard`

### Hero Section (full-width, white bg)
```
┌─────────────────────────────────────────────────────┐
│  Left half:                    Right half:           │
│                                                      │
│  "Find Similar                 [ 3D Lung Model ]     │
│   Cancer Cases"                  Lungs3DModel.tsx    │
│                                  interactive,        │
│  Brief subtitle                  rotatable,          │
│  [ Start Analysis → ]            white background    │
└─────────────────────────────────────────────────────┘
```

The `Lungs3DModel.tsx` here is **decorative / introductory** — it rotates slowly, no data attached yet. Copy it from `frontend-from-test/components/view1/Lungs3DModel.tsx`.

### Patient Input Form (below hero, white card)

Four collapsible sections matching the `/api/match` payload exactly:

#### Pathology
```typescript
subtype: string          // e.g. "Adenocarcinoma"
tumor_grade: string      // e.g. "G2"
mitotic_index: string    // e.g. "Low"
surgical_margin: string  // "Negative" | "Positive"
tumor_size_mm: number    // numeric input
```

#### Genomics
```typescript
driver_mutation: string     // e.g. "EGFR"
secondary_mutation: string  // e.g. "TP53"
tmb: number                 // tumor mutational burden
pdl1_percent: number        // 0-100
cnv: string                 // e.g. "Amplification"
```

#### Imaging
```typescript
lobe: string                // e.g. "Right Upper"
density: string             // e.g. "Solid"
n_stage: string             // e.g. "N1"
pleural_invasion: string    // "Yes" | "No"
metastasis_sites: string[]  // multi-select or comma input
```

#### Clinical
```typescript
age: number
sex: string                 // "Male" | "Female"
smoking_history: string     // "Never" | "Former" | "Current"
ecog_status: number         // 0-4
co_morbidities: string[]    // multi-select
```

### Weight Sliders
Four sliders (Pathology / Genomics / Imaging / Clinical), default 25 each, auto-normalize to 100%.

### Submit
`POST /api/match` with `{ patient: formData, weights }`. On success → navigate to `/doctor/results/{sessionId}`.

---

## 3. Match Results Page `/app/doctor/results/[sessionId]`

### Layout: Split panel
```
┌─────────────────────────┬──────────────────────────┐
│  Left: Results List     │  Right: DNA Helix Model  │
│                         │   DNAHelixModel.tsx       │
│  Top-5 TCGA cases       │   (decorative, rotates)  │
│  sorted by similarity   │                          │
│                         │                          │
│  [Case card × 5]        │  + Selected case detail  │
└─────────────────────────┴──────────────────────────┘
```

### Match Result Card
Each card shows:
- `patient_id` — TCGA case ID
- `similarity_score` — large number, colored (green >75, amber 50-75, red <50)
- `stage` — pill badge
- `outcome` — e.g. "Partial Response"
- `treatment_history` — condensed list
- Expand button → shows `ParameterComparisonTable`

### Parameter Comparison Table
One row per parameter (20 total across 4 domains). Columns: Parameter | Your Patient | This Case | Match

Color coding from API response:
- `"green"` → `✓` green dot
- `"amber"` → `~` amber dot  
- `"red"` → `✗` red dot

### Action buttons
- **"Generate AI Rationale"** → calls `/api/ai-rationale`, navigates to `/doctor/ai-rationale/{sessionId}`
- **"Open Document Editor"** → navigates to `/doctor/editor/{sessionId}`

---

## 4. AI Rationale Page `/app/doctor/ai-rationale/[sessionId]`

Calls `POST /api/ai-rationale` with a structured prompt built from the top match result:

```typescript
const prompt = `
You are an oncology clinical decision support AI.
A patient has been matched to TCGA case ${topMatch.patient_id} with ${topMatch.similarity_score}% similarity.

Patient profile: ${JSON.stringify(sessionData.patient)}
Matched case: Stage ${topMatch.stage}, Outcome: ${topMatch.outcome}
Treatment: ${topMatch.treatment_history.join(', ')}
Guideline: ${topMatch.guideline_citation}

Provide a concise clinical rationale (3-4 paragraphs) explaining:
1. Why this case is a strong match
2. Treatment implications based on the matched outcome
3. Any caveats or differences to consider
4. Recommended next steps
`
```

Display response in a clean white card. Show streaming text if possible (SSE). Include a **"Approve & Share with Patient"** button at the bottom that:
1. Sets `status = "shared"` on the session
2. Snapshots `approved_documents`
3. Returns the shareable link `/patient/{sessionId}`
4. Shows a copy-link modal

---

## 5. Document Editor `/app/doctor/editor/[sessionId]`

**Copy this exactly from `frontend-from-test` — do not modify it.** Just wire it to receive `sessionId` from the URL param and load session data from Zustand store or API. Keep all existing editor functionality, layout, and styling.

---

## 6. Patient Portal `/app/patient/[sessionId]`

### Source
Rebuild from `frontend-from-test/components/view2/PatientDashboard.tsx`. This is the authoritative working prototype. Copy its structure faithfully.

### Gate check (run first on page load)
```typescript
const res = await fetch(`/api/patient/${sessionId}?lang=${lang}`)
if (res.status === 403) → show <PortalLockedState />
```

`PortalLockedState` shows: "Your doctor is reviewing your results. You'll be notified when they're ready." — clean white card, no error styling.

### After approval — main portal layout
White background, clean card grid:

```
┌─────────────────────────────────────────────────────┐
│  OncoPilot  |  Your Care Summary        [en▼]       │
├─────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────────────┐ │
│  │ What We Found    │  │ What This Means          │ │
│  │ (plain language) │  │ (treatment context)      │ │
│  └──────────────────┘  └──────────────────────────┘ │
│  ┌──────────────────┐  ┌──────────────────────────┐ │
│  │ Side Effects     │  │ Questions for Doctor     │ │
│  │ to Expect        │  │ (suggested list)         │ │
│  └──────────────────┘  └──────────────────────────┘ │
│  ┌───────────────────────────────────────────────┐   │
│  │ Clinical Trials  (if available, simplified)  │   │
│  └───────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Language toggle
Buttons: `EN` `हि` `த` `ಕ` — on switch, call `POST /api/patient/{sessionId}/summary?lang={code}` and re-render cards.

### Sections map to API response
```typescript
interface PatientPortalResponse {
  what_we_found: string
  what_this_means: string
  side_effects: string
  trials?: string
  questions_for_doctor: string[]
}
```

### Extra components (from frontend-from-test/view2, keep as-is)
- `SymptomTracker` — simple daily symptom log
- `MedAdherence` — medication checklist
- These are below the main summary cards

### Patient data source
Patient portal reads from the **backend API only** (`/api/patient/{sessionId}`). It does NOT read from `user copy {n}.json`. Those JSON files are only used for patient login authentication to resolve which sessionId belongs to which patient.

---

## 7. API Layer `/lib/api.ts`

```typescript
// Doctor
export const matchPatient = (payload: MatchRequest) =>
  fetch('/api/match', { method: 'POST', body: JSON.stringify(payload) })

export const getAIRationale = (prompt: string) =>
  fetch('/api/ai-rationale', { method: 'POST', body: JSON.stringify({ prompt }) })

// Patient
export const getPatientPortal = (sessionId: string, lang = 'en') =>
  fetch(`/api/patient/${sessionId}?lang=${lang}`)

export const regenerateSummary = (sessionId: string, lang: string) =>
  fetch(`/api/patient/${sessionId}/summary?lang=${lang}`, { method: 'POST' })

// Next.js API proxy routes (to avoid CORS)
// /app/api/match/route.ts         → proxy to http://localhost:8001/api/match
// /app/api/ai-rationale/route.ts  → proxy to http://localhost:8001/api/ai-rationale
// /app/api/patient/[...path]/route.ts → proxy to http://localhost:8001/api/patient/...
```

---

## 8. Zustand Store `/lib/store.ts`

```typescript
interface AppStore {
  // Auth
  role: 'doctor' | 'patient' | null
  sessionId: string | null
  patientUserId: string | null

  // Doctor workflow
  currentPatientInput: PatientPayload | null
  weights: { pathology: number; genomics: number; imaging: number; clinical: number }
  matchResults: MatchResult[]
  selectedMatch: MatchResult | null
  aiRationale: string | null

  // Patient portal
  portalData: PatientPortalResponse | null
  portalLang: 'en' | 'hi' | 'ta' | 'kn'
  portalStatus: 'locked' | 'shared' | 'loading'

  // Actions
  setRole: (role: 'doctor' | 'patient') => void
  setMatchResults: (results: MatchResult[]) => void
  setPortalData: (data: PatientPortalResponse) => void
  setPortalLang: (lang: string) => void
}
```

---

## 9. Types `/lib/types.ts`

Derive all types directly from `app.py`:

```typescript
export interface PatientPayload {
  pathology: {
    subtype: string; tumor_grade: string; mitotic_index: string
    surgical_margin: string; tumor_size_mm: number
  }
  genomics: {
    driver_mutation: string; secondary_mutation: string
    tmb: number; pdl1_percent: number; cnv: string
  }
  imaging: {
    lobe: string; density: string; n_stage: string
    pleural_invasion: string; metastasis_sites: string[]
  }
  clinical: {
    age: number; sex: string; smoking_history: string
    ecog_status: number; co_morbidities: string[]
  }
}

export interface MatchResult {
  patient_id: string
  similarity_score: number
  treatment_history: string[]
  guideline_citation: string
  outcome: string
  stage: string
  parameters: Parameter[]
  raw_case_data: TCGACase
}

export interface Parameter {
  name: string
  patient: string
  match: string
  score: 'green' | 'amber' | 'red'
}
```

---

## 10. TCGA Dataset Integration

The real dataset is `tcga_cases.json`. It is used **exclusively by the backend** (`app.py` loads it server-side via `load_local_database()`). The frontend never reads this file directly — it only receives processed results from `/api/match`.

However, for development/testing without the backend running, create a mock:
```typescript
// /lib/mock-data.ts
// Export 3-5 sample cases from tcga_cases.json as static fixtures
// Used only when NEXT_PUBLIC_USE_MOCK=true
```

---

## 11. 3D Models — Integration Notes

### Lungs3DModel (Dashboard hero + potentially Genomics)
```typescript
// Copy from: frontend-from-test/components/view1/Lungs3DModel.tsx
// Dependencies: three, @react-three/fiber, @react-three/drei
// Model file: ensure .glb is in /public/models/lungs.glb
// On dashboard: autoRotate, no data props, white scene background
// Props interface:
interface Lungs3DModelProps {
  autoRotate?: boolean           // true on dashboard (decorative)
  highlightRegions?: string[]    // for future genomics integration
  onRegionClick?: (r: string) => void
}
```

### DNAHelixModel (Results page)
```typescript
// Copy from: frontend-from-test/components/view1/ (whichever file has DNA helix)
// On results page: slow rotation, decorative, white background
// Sits in right panel alongside parameter comparison table
```

---

## 12. Page-by-Page Checklist for Cursor

Build in this order:

1. **`/lib/types.ts`** — all TypeScript types from app.py schema
2. **`/lib/api.ts`** — all fetch functions + Next.js proxy routes
3. **`/lib/store.ts`** — Zustand store
4. **`/app/login/page.tsx`** — dual-tab login, no constraints, numeric patient ID
5. **`/app/doctor/dashboard/page.tsx`** — hero with Lungs3DModel + patient input form
6. **`/app/doctor/results/[sessionId]/page.tsx`** — match cards + DNA helix + comparison table
7. **`/app/doctor/ai-rationale/[sessionId]/page.tsx`** — Claude rationale + approve button
8. **`/app/doctor/editor/[sessionId]/page.tsx`** — copy from frontend-from-test as-is
9. **`/app/patient/[sessionId]/page.tsx`** — gated portal, language toggle, plain-language cards
10. **`/components/shared/Sidebar.tsx`** — doctor nav sidebar
11. **`/components/patient/`** — all view2 components from frontend-from-test

---

## Design Checklist (apply to every page)

- [ ] White `#FFFFFF` background — no exceptions
- [ ] `Syne` font for all headings
- [ ] `Inter` font for body text
- [ ] Teal `#0EA5A0` for primary buttons and active nav items
- [ ] Cards use `rounded-xl border border-[#E4E4E7] shadow-sm`
- [ ] No gradients, no dark panels, no purple
- [ ] Generous padding (`p-6` or `p-8` on cards)
- [ ] Sidebar is white with thin right border
- [ ] Active sidebar item has teal left border + teal text
- [ ] All form inputs: `rounded-lg border border-[#E4E4E7] focus:ring-1 focus:ring-[#0EA5A0]`
- [ ] Loading states use a teal spinner, not grey
- [ ] Error states: red text, no red backgrounds
