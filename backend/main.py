"""FastAPI app entry."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from config import settings
from db.database import init_db, seed_if_empty
from routers import analyze, audit, dashboard, patient, upload


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    seed_if_empty()
    yield


app = FastAPI(
    title="Oncopilot AI",
    version="0.1.0",
    description="Simulated-data NSCLC decision support API. Use POST /api/demo to start.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)
app.include_router(analyze.router)
app.include_router(dashboard.router)
app.include_router(patient.router)
app.include_router(audit.router)


@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url="/docs")


@app.get("/health")
async def health():
    return {"status": "ok", "mode": "simulated", "demo_patient": settings.demo_patient}
