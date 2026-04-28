"""
Response Parser — parses AI JSON and merges with rule scores.

Flow:
  1. Parse AI JSON (experience_adjustment, soft_skills, reasoning)
  2. Apply experience adjustment to rule experience score
  3. Apply technical ceiling (based on must_have_missing from rule engine)
  4. Recalculate overall as weighted average
  5. Derive recommendation from thresholds
"""
from __future__ import annotations
import json
import re
from typing import Dict, List, Optional

CATEGORIES = ["technical", "experience", "education", "soft_skills", "stability"]
DEFAULT_WEIGHTS = {
    "technical": 50, "experience": 25, "education": 10,
    "soft_skills": 5, "stability": 10,
}


def parse_ai_response(raw_text: str) -> Dict:
    """Parse AI JSON — extract adjustment and reasoning."""
    try:
        cleaned = raw_text.strip()
        cleaned = re.sub(r'^```json\s*', '', cleaned)
        cleaned = re.sub(r'^```\s*', '', cleaned)
        cleaned = re.sub(r'\s*```$', '', cleaned)
        data = json.loads(cleaned)
        return {
            "experience_adjustment": _clamp_adj(data.get("experience_adjustment", 0)),
            "soft_skills_score":     _clamp(data.get("soft_skills_score", 50)),
            "category_reasoning":    data.get("category_reasoning", {}),
            "highlights":            list(data.get("highlights") or []),
            "red_flags":             list(data.get("red_flags") or []),
            "ai_reasoning":          data.get("ai_reasoning", "") or "",
        }
    except Exception as e:
        return {
            "experience_adjustment": 0,
            "soft_skills_score":     50,
            "category_reasoning":    {},
            "highlights":            [],
            "red_flags":             [f"AI response parse error: {str(e)}"],
            "ai_reasoning":          "Could not parse AI assessment.",
        }


def build_final_scores(
    rule_scores: Dict,
    ai_response: Dict,
    job: Dict,
    must_have_missing: int,
) -> Dict:
    """
    Merge rule scores + AI response into final scored result.
    Python is the source of truth for all numbers.
    """
    weights     = job.get("scoring_weights") or DEFAULT_WEIGHTS
    shortlist_t = int(job.get("shortlist_threshold") or 75)
    review_t    = int(job.get("review_threshold") or 55)
    min_tech    = job.get("minimum_technical_score")
    if min_tech is not None:
        try:    min_tech = int(min_tech)
        except: min_tech = None

    ai_reasoning   = ai_response.get("category_reasoning", {})
    rule_technical = rule_scores.get("technical", {})
    rule_exp       = rule_scores.get("experience", {})
    rule_edu       = rule_scores.get("education", {})
    rule_stab      = rule_scores.get("stability", {})

    # ── Compute final category scores ────────────────────────────────────────

    # Technical — rule only, no AI touch
    tech_score = _clamp(rule_technical.get("score", 0))

    # Experience — rule base + AI quality adjustment
    exp_base   = _clamp(rule_exp.get("score", 50))
    exp_adj    = _clamp_adj(ai_response.get("experience_adjustment", 0))
    exp_score  = _clamp(exp_base + exp_adj)

    # Education — rule only
    edu_score  = _clamp(rule_edu.get("score", 50))

    # Soft Skills — AI only
    soft_score = _clamp(ai_response.get("soft_skills_score", 50))

    # Stability — rule only
    stab_score = _clamp(rule_stab.get("score", 60))

    # ── Apply Must Have ceiling to technical AFTER AI ─────────────────────────
    from services.rule_engine.technical_scorer import apply_must_have_ceiling
    tech_score = apply_must_have_ceiling(tech_score, must_have_missing)

    # ── Build category scores with reasoning ─────────────────────────────────
    category_scores = {
        "technical": {
            "score": tech_score,
            "reasoning": _build_tech_reasoning(rule_technical, ai_reasoning),
        },
        "experience": {
            "score": exp_score,
            "reasoning": ai_reasoning.get("experience") or rule_exp.get("reasoning", ""),
        },
        "education": {
            "score": edu_score,
            "reasoning": ai_reasoning.get("education") or rule_edu.get("reasoning", ""),
        },
        "soft_skills": {
            "score": soft_score,
            "reasoning": ai_reasoning.get("soft_skills", ""),
        },
        "stability": {
            "score": stab_score,
            "reasoning": ai_reasoning.get("stability") or rule_stab.get("reasoning", ""),
        },
    }

    # ── Overall score ─────────────────────────────────────────────────────────
    overall = _weighted_overall(category_scores, weights)

    # ── Recommendation ────────────────────────────────────────────────────────
    recommendation = _recommend(overall, tech_score, shortlist_t, review_t, min_tech)

    return {
        "overall_score":   overall,
        "recommendation":  recommendation,
        "category_scores": category_scores,
        "matched_skills":  rule_technical.get("found", []),
        "missing_skills":  rule_technical.get("missing", []),
        "partial_skills":  rule_technical.get("partial", []),
        "highlights":      ai_response.get("highlights", []),
        "red_flags":       ai_response.get("red_flags", []),
        "ai_reasoning":    ai_response.get("ai_reasoning", ""),
    }


def _build_tech_reasoning(rule_technical: Dict, ai_reasoning: Dict) -> str:
    """Build clean technical reasoning from rule data."""
    found   = rule_technical.get("found", [])
    partial = rule_technical.get("partial", [])
    missing = rule_technical.get("missing", [])
    parts   = []

    if found:
        parts.append(f"{', '.join(found)} found in resume.")
    if partial:
        parts.append(f"Related skills found (partial match): {', '.join(partial)}.")
    if missing:
        parts.append(
            f"{', '.join(missing)} were not found in this resume. "
            f"Technical score has been adjusted to reflect the missing required skills."
        )
    # Add AI context if available
    ai_tech = ai_reasoning.get("technical", "")
    if ai_tech and not any(s in ai_tech.lower() for s in ["ceiling", "capped", "python"]):
        parts.append(ai_tech)

    return " ".join(parts) if parts else "Technical skills evaluated."


def _weighted_overall(cats: Dict, weights: Dict) -> int:
    total_w, total_s = 0.0, 0.0
    for cat in CATEGORIES:
        w = float(weights.get(cat, DEFAULT_WEIGHTS[cat]) or 0)
        s = float((cats.get(cat) or {}).get("score", 0) or 0)
        total_s += s * w
        total_w += w
    if total_w <= 0:
        return int(round(sum(
            float((cats.get(c) or {}).get("score", 0)) for c in CATEGORIES
        ) / len(CATEGORIES)))
    return int(round(total_s / total_w))


def _recommend(
    overall: int,
    technical: int,
    shortlist: int,
    review: int,
    min_tech: Optional[int],
) -> str:
    if min_tech is not None and technical < min_tech:
        return "PASS"
    if overall >= shortlist: return "SHORTLIST"
    if overall >= review:    return "REVIEW"
    return "PASS"


def _clamp(val) -> int:
    try:    return max(0, min(100, int(round(float(val)))))
    except: return 50

def _clamp_adj(val) -> int:
    try:    return max(-15, min(15, int(round(float(val)))))
    except: return 0


# Keep backward compat for any imports
def parse_score_response(raw_text: str) -> Dict:
    return parse_ai_response(raw_text)

def apply_scoring_rules(parsed: Dict, job: Dict, resume_text: str) -> Dict:
    return parsed

def check_must_have_presence(resume_text: str, must_have_skills: List) -> Dict:
    from services.rule_engine.technical_scorer import (
        _skill_present, _normalise, _aliases_for
    )
    haystack = resume_text.lower()
    found, missing = [], []
    for skill in (must_have_skills or []):
        name = skill.get("skill", skill) if isinstance(skill, dict) else skill
        if _skill_present(haystack, name):
            found.append(name)
        else:
            missing.append(name)
    return {"found": found, "missing": missing}
