# Oncopilot AI

Oncologist-first clinical decision support: upload reports → extract → retrieve similar cases & trials → RAG-grounded drafts → oncologist dashboard (View 1) → optional patient portal (View 2).

See [s.md](./s.md) for the full system blueprint.

---

## Run locally (recommended)

Uses **`frontend-from-test/`** (UI from the `test` branch) + **`backend/`** (your API).

### Prerequisites

- Python 3.11+
- Node.js 20+
- A [Groq API key](https://console.groq.com/) (recommended), or [Ollama](https://ollama.com/) as fallback

### 1. Environment

From the project root:

```powershell
copy .env.example .env
```

Edit `.env` and set:

```env
GROQ_API_KEY=gsk_your_key_here
```

LLM priority: **Groq → Ollama → template fallbacks**.

Do **not** clear the key when starting the server (avoid `$env:GROQ_API_KEY=""` in PowerShell).

### 2. Backend (port 8001)

```powershell
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8001 --reload
```

- API: http://localhost:8001  
- Docs: http://localhost:8001/docs  
- Health: http://localhost:8001/health  

> **Why 8001?** Port 8000 may have stuck processes from earlier runs. Use 8001, or reboot to free 8000.

### 3. Frontend (port 3001)

In a **second terminal**:

```powershell
cd frontend-from-test
npm install
npm run dev -- -p 3001
```

Create or verify `frontend-from-test/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8001
```

Restart the frontend after changing `.env.local` (Next.js reads it at startup).

- App: http://localhost:3001  

### 4. Try it

1. Open http://localhost:3001/login → choose **Doctor** → any email/password  
2. Pick a **Safe Demo Case** from the dropdown → **Run Demo Case**  
3. Wait ~15–25s → dashboard loads with cohort matches, trials, documents  

**Upload instead of demo:** use `.txt`, `.md`, or `.json` files (e.g. `backend/db/mock_data/demo_patient.json`).

| Demo case | Expected top cohort |
|-----------|---------------------|
| Case 1 — EGFR Exon 19 | SYN-018 / SYN-001 (~94–95%) |
| Case 2 — KRAS G12C | SYN-003 (~91%) |

### 5. Quick API smoke test (optional)

With the backend running:

```powershell
cd backend
python scripts/run_integrated_demo.py http://127.0.0.1:8001
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Failed to fetch` in browser | Backend not running, wrong port in `.env.local`, or CORS — frontend must be on **3000 or 3001** (both allowed in `backend/config.py`) |
| LLM shows `fallback` or `mistral` | Add `GROQ_API_KEY` to `.env` and restart backend without clearing the env var |
| Demo dropdown shows one case | Restart backend with `--reload` so `/api/cases` picks up both preset cases |
| Port already in use | Use another port (e.g. 8002) and update `NEXT_PUBLIC_API_URL` to match |

---

## Docker (alternative)

```bash
cp .env.example .env
# fill GROQ_API_KEY

docker compose up --build
```

- Backend: http://localhost:8000  
- Frontend: http://localhost:3000  

---

## Project layout

```
oncopilot-ai/
├── backend/              # FastAPI API, agents, similarity engine
├── frontend-from-test/   # Integrated UI (use this for local dev)
├── frontend/             # Original frontend (unchanged)
├── .env                  # Groq key + backend config
└── oncopilot.db          # SQLite (created on first run)
```

---

## Team ownership

| Area | Owner |
|------|-------|
| Platform, OCR, pipeline, dashboard/audit API | BE Dev 1 |
| Agent 1, similarity, trials, knowledge, prognosis | BE Dev 2 |
| Agent 2, documents, patient API, translation | BE Dev 3 |
| Frontend (View 1 ★, View 2 stretch) | FE Dev |
| `models/schemas.py` + `frontend/lib/types.ts` | All 4 — Day 0 |

More API details for frontend wiring: [frontend-integration-backend-changes.md](./frontend-integration-backend-changes.md)
