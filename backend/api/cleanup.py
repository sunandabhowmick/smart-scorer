"""
Cleanup endpoint — triggered by GitHub Actions daily cron.
Deletes resume files and nulls raw text older than CLEANUP_AFTER_DAYS.
"""
from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from datetime import datetime, timedelta
from db.supabase_client import supabase
from config import settings

router = APIRouter(prefix="/api/v1/cleanup", tags=["cleanup"])


@router.post("")
async def run_cleanup(authorization: Optional[str] = Header(None)):
    # Verify cleanup secret
    if not authorization or authorization != f"Bearer {settings.CLEANUP_SECRET}":
        raise HTTPException(status_code=401, detail="Unauthorized")

    cutoff = (datetime.utcnow() - timedelta(days=settings.CLEANUP_AFTER_DAYS)).isoformat()
    files_deleted = 0
    records_nulled = 0
    errors = []

    try:
        # Find old scores with storage paths
        old_scores = supabase.table("scores")\
            .select("id, resume_raw_text, candidates(resume_storage_path)")\
            .lt("scored_at", cutoff)\
            .is_("cleaned_at", "null")\
            .execute()

        for score in old_scores.data:
            try:
                # Delete file from storage
                candidate = score.get("candidates") or {}
                path = candidate.get("resume_storage_path")
                if path:
                    supabase.storage\
                        .from_(settings.RESUME_STORAGE_BUCKET)\
                        .remove([path])
                    files_deleted += 1

                # Null out raw text + storage path
                supabase.table("scores")\
                    .update({
                        "resume_raw_text": None,
                        "cleaned_at": datetime.utcnow().isoformat()
                    })\
                    .eq("id", score["id"])\
                    .execute()

                supabase.table("candidates")\
                    .update({"resume_storage_path": None})\
                    .eq("id", score.get("candidate_id"))\
                    .execute()

                records_nulled += 1

            except Exception as e:
                errors.append(str(e))

        # Log cleanup run
        supabase.table("cleanup_log").insert({
            "files_deleted": files_deleted,
            "records_nulled": records_nulled,
            "errors": errors,
        }).execute()

        return {
            "status": "completed",
            "files_deleted": files_deleted,
            "records_nulled": records_nulled,
            "errors": errors,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Fix missing import

