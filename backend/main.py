"""
HYROI Smart Scorer — FastAPI Backend
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.auth import router as auth_router
from api.jobs import router as jobs_router
from api.scoring import router as scoring_router
from api.results import router as results_router
from api.cleanup import router as cleanup_router

app = FastAPI(
    title="HYROI Smart Scorer API",
    description="AI-powered ATS resume scoring",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(jobs_router)
app.include_router(scoring_router)
app.include_router(results_router)
app.include_router(cleanup_router)

@app.get("/health")
async def health():
    return {"status": "healthy", "version": "2.0.0"}
