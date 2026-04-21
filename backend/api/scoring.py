"""
Scoring endpoints — single resume, batch upload, session tracking
"""
import uuid
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Header
from typing import Optional, List
from db.supabase_client import supabase
from services.text_extractor import extract_text
from services.contact_parser import extract_contact_info
from services.ai.router import get_adapter
from services.ai.prompt_builder import SYSTEM_PROMPT, build_user_prompt
from services.ai.response_parser import parse_score_response
from config import settings

router = APIRouter(prefix="/api/v1/scoring", tags=["scoring"])


def _get_user(authorization: Optional[str]) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.replace("Bearer ", "")
    try:
        user = supabase.auth.get_user(token)
        return user.user.id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


async def _score_single(
    file_content: bytes,
    filename: str,
    job: dict,
    session_id: Optional[str] = None,
) -> dict:
    """Core scoring logic — used by both single and batch endpoints."""

    # Extract text
    success, text = extract_text(file_content, filename)
    if not success:
        raise ValueError(text)

    # Extract contact info
    contact = extract_contact_info(text)
    candidate_name = contact.get("name") or _name_from_filename(filename)

    # Build prompts
    user_prompt = build_user_prompt(text, job, candidate_name)

    # Call AI
    adapter = get_adapter()
    raw_response, tokens_used = await adapter.score(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=user_prompt,
        max_tokens=settings.AI_MAX_TOKENS,
        temperature=settings.AI_TEMPERATURE,
    )

    # Parse response
    scored = parse_score_response(raw_response)

    # Upload resume to Supabase Storage
    storage_path = None
    try:
        storage_path = f"{job['id']}/{uuid.uuid4()}_{filename}"
        supabase.storage.from_(settings.RESUME_STORAGE_BUCKET)\
            .upload(storage_path, file_content)
    except Exception:
        pass  # Storage failure shouldn't break scoring

    # Save candidate
    candidate_res = supabase.table("candidates").insert({
        "name": candidate_name,
        "email": contact.get("email"),
        "phone": contact.get("phone"),
        "resume_filename": filename,
        "resume_storage_path": storage_path,
    }).execute()
    candidate_id = candidate_res.data[0]["id"]

    # Save score
    score_res = supabase.table("scores").insert({
        "candidate_id": candidate_id,
        "job_id": job["id"],
        "session_id": session_id,
        "overall_score": scored["overall_score"],
        "recommendation": scored["recommendation"],
        "category_scores": scored["category_scores"],
        "matched_skills": scored["matched_skills"],
        "missing_skills": scored["missing_skills"],
        "red_flags": scored["red_flags"],
        "highlights": scored["highlights"],
        "ai_reasoning": scored["ai_reasoning"],
        "model_used": settings.AI_PROVIDER,
        "tokens_used": tokens_used,
        "resume_raw_text": text[:5000],
    }).execute()
    score_id = score_res.data[0]["id"]

    # Update session stats
    if session_id:
        supabase.rpc("increment_session_completed", {
            "session_id": session_id,
            "tokens": tokens_used
        }).execute()

    return {
        "score_id": score_id,
        "candidate_name": candidate_name,
        "candidate_email": contact.get("email"),
        "candidate_phone": contact.get("phone"),
        "overall_score": scored["overall_score"],
        "recommendation": scored["recommendation"],
        "category_scores": scored["category_scores"],
        "matched_skills": scored["matched_skills"],
        "missing_skills": scored["missing_skills"],
        "red_flags": scored["red_flags"],
        "highlights": scored["highlights"],
        "ai_reasoning": scored["ai_reasoning"],
        "model_used": settings.AI_PROVIDER,
        "tokens_used": tokens_used,
    }


@router.post("/single")
async def score_single(
    file: UploadFile = File(...),
    job_id: str = Form(...),
    authorization: Optional[str] = Header(None),
):
    _get_user(authorization)

    # Fetch JD
    job_res = supabase.table("job_descriptions")\
        .select("*").eq("id", job_id).execute()
    if not job_res.data:
        raise HTTPException(status_code=404, detail="Job not found")
    job = job_res.data[0]

    try:
        content = await file.read()
        result = await _score_single(content, file.filename, job)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch")
async def score_batch(
    files: List[UploadFile] = File(...),
    job_id: str = Form(...),
    batch_name: str = Form(""),
    authorization: Optional[str] = Header(None),
):
    _get_user(authorization)

    # Fetch JD
    job_res = supabase.table("job_descriptions")\
        .select("*").eq("id", job_id).execute()
    if not job_res.data:
        raise HTTPException(status_code=404, detail="Job not found")
    job = job_res.data[0]

    # Create scoring session
    session_res = supabase.table("scoring_sessions").insert({
        "job_id": job_id,
        "batch_name": batch_name or f"Batch {len(files)} resumes",
        "total_resumes": len(files),
        "completed": 0,
        "failed": 0,
        "model_used": settings.AI_PROVIDER,
    }).execute()
    session_id = session_res.data[0]["id"]

    results = []
    errors = []

    for file in files:
        try:
            content = await file.read()
            result = await _score_single(content, file.filename, job, session_id)
            results.append(result)
        except Exception as e:
            errors.append({"filename": file.filename, "error": str(e)})
            # Update session failed count
            supabase.table("scoring_sessions")\
                .update({"failed": len(errors)})\
                .eq("id", session_id).execute()

    # Mark session complete
    supabase.table("scoring_sessions")\
        .update({"completed_at": "now()"})\
        .eq("id", session_id).execute()

    return {
        "session_id": session_id,
        "total": len(files),
        "scored": len(results),
        "failed": len(errors),
        "results": results,
        "errors": errors,
    }


def _name_from_filename(filename: str) -> str:
    import os
    base = os.path.splitext(filename)[0]
    name = base.replace("_", " ").replace("-", " ").strip()
    words = [w for w in name.split()
             if w.lower() not in ("resume", "cv", "curriculum", "vitae")]
    return " ".join(words).title() or "Unknown"
