# Oncopilot AI

Oncologist-first clinical decision support: upload reports → extract → retrieve similar cases & trials → RAG-grounded drafts → oncologist dashboard (View 1) → optional patient portal (View 2).

See [s.md](./s.md) for the full system blueprint.

## Quick start

```bash
cp .env.example .env
# fill GROQ_API_KEY

docker compose up --build
```

- Backend: http://localhost:8000
- Frontend: http://localhost:3000
- API docs: http://localhost:8000/docs

## Team ownership

| Area | Owner |
|------|-------|
| Platform, OCR, pipeline, dashboard/audit API | BE Dev 1 |
| Agent 1, similarity, trials, knowledge, prognosis | BE Dev 2 |
| Agent 2, documents, patient API, translation | BE Dev 3 |
| Frontend (View 1 ★, View 2 stretch) | FE Dev |
| `models/schemas.py` + `frontend/lib/types.ts` | All 4 — Day 0 |
