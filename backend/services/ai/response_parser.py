"""
Response Parser — validates and parses AI JSON response.
Handles malformed responses gracefully.
"""
import json
import re
from typing import Dict


DEFAULT_CATEGORY = {"score": 50, "reasoning": "Could not parse AI response for this category."}


def parse_score_response(raw_text: str) -> Dict:
    """
    Parse AI response into structured dict.
    Returns a safe default if parsing fails.
    """
    try:
        # Strip any accidental markdown code fences
        cleaned = raw_text.strip()
        cleaned = re.sub(r'^```json\s*', '', cleaned)
        cleaned = re.sub(r'^```\s*', '', cleaned)
        cleaned = re.sub(r'\s*```$', '', cleaned)

        data = json.loads(cleaned)

        # Validate and sanitise fields
        return {
            "overall_score": _clamp(data.get("overall_score", 50)),
            "recommendation": _valid_rec(data.get("recommendation", "REVIEW")),
            "category_scores": {
                "technical":   _parse_category(data, "technical"),
                "experience":  _parse_category(data, "experience"),
                "education":   _parse_category(data, "education"),
                "soft_skills": _parse_category(data, "soft_skills"),
                "stability":   _parse_category(data, "stability"),
            },
            "matched_skills": data.get("matched_skills", []),
            "missing_skills": data.get("missing_skills", []),
            "red_flags":      data.get("red_flags", []),
            "highlights":     data.get("highlights", []),
            "ai_reasoning":   data.get("ai_reasoning", ""),
        }

    except Exception as e:
        # Return safe default so one bad resume doesn't break a batch
        return {
            "overall_score": 0,
            "recommendation": "PASS",
            "category_scores": {
                cat: DEFAULT_CATEGORY.copy()
                for cat in ["technical", "experience", "education", "soft_skills", "stability"]
            },
            "matched_skills": [],
            "missing_skills": [],
            "red_flags": [f"Failed to parse AI response: {str(e)}"],
            "highlights": [],
            "ai_reasoning": f"Scoring failed: {str(e)}",
        }


def _parse_category(data: Dict, key: str) -> Dict:
    cat = data.get("category_scores", {}).get(key, {})
    return {
        "score": _clamp(cat.get("score", 50)),
        "reasoning": cat.get("reasoning", "No reasoning provided."),
    }


def _clamp(val) -> int:
    try:
        return max(0, min(100, int(val)))
    except (TypeError, ValueError):
        return 50


def _valid_rec(val: str) -> str:
    valid = {"SHORTLIST", "REVIEW", "PASS"}
    return val.upper() if val.upper() in valid else "REVIEW"
