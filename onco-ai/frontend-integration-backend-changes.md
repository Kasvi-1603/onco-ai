# Backend changes — preset cases + .txt/.json upload

For frontend teammate. **No frontend changes were committed** — wire these when ready.

---

## Summary

| Track | User action | API | Agent 1? |
|-------|-------------|-----|----------|
| Safe Demo dropdown | Pick preset case → Process | `GET /api/cases` + `POST /api/demo?case_id=` | No (profile pre-loaded) |
| Legacy demo button | Demo Patient | `POST /api/demo` (default `egfr-exon19`) | No |
| File upload | Upload `.txt` / `.md` / `.json` | `POST /api/upload` (multipart) | Only if plain text (no JSON profile) |

Then for all tracks: `POST /api/analyze/{session_id}` → `GET /api/dashboard/{session_id}`

---

## New / changed API endpoints

### `GET /api/cases`

List preset cases for dropdown.

**Response `200`:**
```json
[
  {
    "case_id": "egfr-exon19",
    "label": "Case 1: TCGA-LUAD EGFR Exon 19 (SYN-001 ~94% match)",
    "description": "...",
    "target_cohort": "SYN-001"
  },
  {
    "case_id": "kras-g12c",
    "label": "Case 2: KRAS G12C LUAD (SYN-003 ~91% match)",
    "description": "...",
    "target_cohort": "SYN-003"
  }
]
```

---

### `POST /api/demo?case_id={id}`

**Query param:** `case_id` optional, default `egfr-exon19`

**Examples:**
- `POST /api/demo` → Case 1 EGFR (same as before, `demo=true`, session may be `demo-patient-001`)
- `POST /api/demo?case_id=kras-g12c` → Case 2 KRAS (new session id `case-xxxxxxxxxx`)

**Response `201`:** `UploadResponse` (extended fields below)

---

### `POST /api/upload`

**Was:** Ignored files, always returned demo patient.  
**Now:** Real multipart upload.

**Request:** `multipart/form-data`, field name **`files`** (can be multiple)

**Allowed extensions:** `.txt`, `.md`, `.json` only (not PDF yet)

**Behavior:**
| File content | What happens |
|--------------|--------------|
| Plain text report | Stored as `raw_text` → Agent 1 extracts on analyze |
| JSON with `patient_profile` | Profile saved → **skips Agent 1** on analyze (same shape as `demo_patient.json`) |
| JSON full case pack | Both `patient_profile` + `raw_ocr_text` supported |

**JSON upload format** (copy of `backend/db/mock_data/demo_patient.json` or `cases/case_kras_g12c.json`):
```json
{
  "case_id": "optional",
  "label": "optional display name",
  "patient_profile": { "pathology": {}, "genomic": {}, "imaging": {}, "clinical": {} },
  "raw_ocr_text": "optional report text for display / Agent 1 fallback"
}
```

**Errors:**
- `400` — no files, unsupported extension, empty content
- `422` — missing `files` field

---

### `POST /api/analyze/{session_id}` (unchanged URL, fixed logic)

**New routing:**
1. If session already has a **complete** `patient_profile` (stage + driver mutation) → skip Agent 1, run similarity + RAG
2. Else if legacy `demo-patient-001` → old demo pipeline
3. Else if `raw_text` on session → Agent 1 extract → pipeline
4. Else `400`

**Fix:** KRAS-only JSON uploads now work (previously only skipped Agent 1 when `egfr` was set).

---

## Extended `UploadResponse` schema

Add to frontend `types.ts` when integrating:

```typescript
export interface CaseSummary {
  case_id: string;
  label: string;
  description?: string | null;
  target_cohort?: string | null;
}

export interface UploadResponse {
  session_id: string;
  status: "uploaded";
  file_count: number;
  ocr_preview?: string | null;
  demo: boolean;
  raw_text?: string | null;
  case_id?: string | null;
  case_label?: string | null;
}
```

---

## Frontend integration checklist (for teammate)

### Home page `/`

1. **On mount:** `GET /api/cases` → populate dropdown
2. **Safe Demo track:**
   - `<select>` bound to `case_id`
   - Button "Process Case" → `POST /api/demo?case_id={selected}` → `POST /api/analyze/{session_id}` → redirect `/dashboard/{session_id}`
3. **Upload track:**
   - File input `accept=".txt,.md,.json"`
   - `FormData` append each file as `files`
   - `POST /api/upload` → analyze → dashboard
4. **Optional:** Keep "Demo Patient" as shortcut for `case_id=egfr-exon19`

### `lib/api.ts` additions

```typescript
export function listCases(): Promise<CaseSummary[]> {
  return request("/api/cases");
}

export function createDemoSession(caseId = "egfr-exon19"): Promise<UploadResponse> {
  return request(`/api/demo?case_id=${encodeURIComponent(caseId)}`, { method: "POST" });
}

// uploadFiles — keep multipart, field name must be "files"
files.forEach((f) => form.append("files", f));
```

### Do not yet

- PDF upload (returns 400 if you send `.pdf`)
- Change dashboard / patient / audit pages — they already consume `SessionPayload`

---

## New backend files

| File | Purpose |
|------|---------|
| `backend/services/cases.py` | Case registry, parse upload content, `profile_is_ready()` |
| `backend/db/mock_data/cases/case_kras_g12c.json` | Case 2 preset (~91% SYN-003) |
| `backend/tests/test_cases_upload.py` | Tests for cases + upload |

## Modified backend files

| File | Change |
|------|--------|
| `backend/routers/upload.py` | Real upload, `GET /api/cases`, demo `case_id` query param |
| `backend/routers/analyze.py` | Skip Agent 1 when profile ready (not EGFR-only) |
| `backend/models/schemas.py` | `CaseSummary`, extended `UploadResponse` |
| `backend/db/mock_data/demo_patient.json` | Added `case_id`, `label` |
| `backend/tests/test_api_edge_cases.py` | Upload-without-files test updated |

---

## Sample files for upload demo

**Plain text:** export `raw_ocr_text` from `demo_patient.json` to a `.txt` file and upload.

**JSON:** upload `demo_patient.json` or `cases/case_kras_g12c.json` directly.

**Expected top cohort after analyze:**
- Case 1 EGFR → SYN-018 / SYN-001 (~94–95%)
- Case 2 KRAS → SYN-003 (~91%)

---

## Env / run (unchanged)

```env
GROQ_API_KEY=...
OLLAMA_MODEL=mistral
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Restart backend after `.env` changes.
