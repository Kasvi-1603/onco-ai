from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.db.database import init_db
from backend.db.seed_cohorts import seed_cohorts
from backend.db.seed_trials import seed_trials
from backend.db.seed_knowledge import seed_knowledge

from backend.routers import upload, analyze, dashboard, audit

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    await seed_cohorts()
    await seed_trials()
    await seed_knowledge()
    print("Database ready.")
    yield
    # Shutdown (nothing to clean up)

app = FastAPI(title="Oncopilot AI", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/api")
app.include_router(analyze.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(audit.router, prefix="/api")