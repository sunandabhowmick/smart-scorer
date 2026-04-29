"""
Scorer — main orchestrator.

Pipeline:
  1. Extract text
  2. Run rule engine (technical, experience, education, stability)
  3. Call AI (reasoning + experience adjustment + soft skills)
  4. Merge and enforce rules
  5. Return final result
"""
from __future__ import annotations
from typing import Optional

from services.rule_engine import (
    score_technical,
    score_experience,
    score_education,
    score_stability,
)
from services.ai.prompt_builder import SYSTEM_PROMPT, build_user_prompt
from services.ai.response_parser import parse_ai_response, build_final_scores
from services.ai.router import get_adapter
from services.resume_compressor import compress_resume
from config import settings


async def score_resume(
    resume_text: str,
    job: dict,
    candidate_name: str = "Unknown",
) -> dict:
    """
    Full scoring pipeline. Returns final scored result dict.
    """

    # ── Layer 1: Rule Engine ──────────────────────────────────────────────────
    required_skills  = job.get("required_skills", [])
    no_skills_defined = len(required_skills) == 0
    skill_importance = job.get("skill_importance", {})
    exp_min  = int(job.get("experience_min", 0))
    exp_max  = int(job.get("experience_max", 99))
    edu_req  = job.get("education_required", "")

    tech_result  = score_technical(resume_text, required_skills, skill_importance)
    # If no skills defined, set neutral score — AI will assess freely
    if no_skills_defined:
        tech_result["score"] = 50
        tech_result["found"] = []
        tech_result["missing"] = []
        tech_result["must_have_missing"] = 0
    exp_result   = score_experience(resume_text, exp_min, exp_max)
    edu_result   = score_education(resume_text, edu_req)
    stab_result  = score_stability(resume_text)

    rule_scores = {
        "technical":  tech_result,
        "experience": exp_result,
        "education":  edu_result,
        "stability":  stab_result,
    }

    must_have_missing = tech_result["must_have_missing"]

    # ── Layer 2: AI (reasoning + experience quality + soft skills) ────────────
    compressed = compress_resume(resume_text)
    user_prompt = build_user_prompt(
        resume_text       = compressed,
        jd                = job,
        candidate_name    = candidate_name,
        rule_scores       = rule_scores,
        technical_detail  = tech_result,
    )

    adapter = get_adapter()
    raw_response, tokens_used = await adapter.score(
        system_prompt = SYSTEM_PROMPT,
        user_prompt   = user_prompt,
        max_tokens    = settings.AI_MAX_TOKENS,
        temperature   = settings.AI_TEMPERATURE,
    )

    ai_response = parse_ai_response(raw_response)

    # ── Merge + enforce rules ─────────────────────────────────────────────────
    final = build_final_scores(
        rule_scores       = rule_scores,
        ai_response       = ai_response,
        job               = job,
        must_have_missing = must_have_missing,
    )

    final["tokens_used"]    = tokens_used
    final["rule_scores"]    = rule_scores    # for debugging
    final["model_used"]     = settings.AI_PROVIDER

    return final
