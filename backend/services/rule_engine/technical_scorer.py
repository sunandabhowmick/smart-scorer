from __future__ import annotations
import re
from typing import Dict, List
from services.rule_engine.skill_taxonomy import SKILL_ALIASES, SKILL_EQUIVALENTS, DEPTH_SIGNALS

PRESENCE_WEIGHT = 0.60
DEPTH_WEIGHT    = 0.40
IMPORTANCE_WEIGHTS = {"must": 3.0, "good": 1.5, "bonus": 0.5}
_WINDOW = 120


def _aliases_for(skill: str) -> List[str]:
    key = (skill or "").strip().lower()
    return SKILL_ALIASES.get(key, [key])


def _contains(haystack: str, needle: str) -> bool:
    n = needle.lower()
    if re.fullmatch(r"[a-z0-9][a-z0-9 .]*[a-z0-9]|[a-z0-9]", n):
        if re.search(r"\b" + re.escape(n) + r"\b", haystack):
            return True
    idx = 0
    while True:
        pos = haystack.find(n, idx)
        if pos == -1:
            return False
        before = pos == 0 or not haystack[pos-1].isalnum()
        end = pos + len(n)
        after = end == len(haystack) or not haystack[end].isalnum()
        if before and after:
            return True
        idx = pos + 1


def _skill_present(haystack: str, skill: str) -> bool:
    return any(_contains(haystack, a) for a in _aliases_for(skill))


def _equivalent_credit(haystack: str, skill: str) -> float:
    key = (skill or "").strip().lower()
    best = 0.0
    for equiv_name, credit in SKILL_EQUIVALENTS.get(key, []):
        for alias in _aliases_for(equiv_name):
            if _contains(haystack, alias):
                best = max(best, credit)
                break
    return best


def _depth_score_for_skill(haystack: str, skill: str) -> int:
    aliases = _aliases_for(skill)
    depth = 0
    seen: List[int] = []
    for alias in aliases:
        idx = 0
        while True:
            pos = haystack.find(alias.lower(), idx)
            if pos == -1:
                break
            if any(abs(pos - p) < _WINDOW for p in seen):
                idx = pos + 1
                continue
            seen.append(pos)
            window = haystack[max(0, pos-_WINDOW): pos+_WINDOW+len(alias)]
            for signal, pts in DEPTH_SIGNALS.items():
                if signal.lower() in window:
                    depth += pts
            idx = pos + 1
    return max(-15, min(25, depth))


def score_technical(
    resume_text: str,
    required_skills: List[Dict],
    skill_importance: Dict[str, str],
) -> Dict:
    haystack = (resume_text or "").lower()
    must_have, good_to_have, bonus = [], [], []

    for skill in (required_skills or []):
        name = skill.get("skill", skill) if isinstance(skill, dict) else skill
        imp  = skill_importance.get(name, "must")
        if imp == "must":       must_have.append(name)
        elif imp == "good":     good_to_have.append(name)
        else:                   bonus.append(name)

    all_skills = (
        [(n, "must")  for n in must_have] +
        [(n, "good")  for n in good_to_have] +
        [(n, "bonus") for n in bonus]
    )

    found, partial, missing = [], [], []
    max_presence = earned_presence = 0.0
    total_depth = depth_count = 0.0

    for name, importance in all_skills:
        weight = IMPORTANCE_WEIGHTS[importance]
        max_presence += weight

        if _skill_present(haystack, name):
            found.append(name)
            earned_presence += weight
            depth = _depth_score_for_skill(haystack, name)
            total_depth += depth
            depth_count += 1
        else:
            credit = _equivalent_credit(haystack, name)
            if credit > 0:
                partial.append(name)
                earned_presence += weight * credit
                total_depth += _depth_score_for_skill(haystack, name) * 0.5
                depth_count += 0.5
            else:
                missing.append(name)

    presence_score = (earned_presence / max_presence * 100) if max_presence > 0 else 0

    if depth_count > 0:
        avg_depth = total_depth / depth_count
        depth_score = max(0, min(100, 50 + avg_depth * 2))
    else:
        depth_score = 30

    raw = presence_score * PRESENCE_WEIGHT + depth_score * DEPTH_WEIGHT
    score = max(0, min(100, int(round(raw))))
    must_have_missing = sum(1 for n in must_have if n in missing)

    return {
        "score":             score,
        "found":             found,
        "partial":           partial,
        "missing":           missing,
        "must_have_missing": must_have_missing,
        "presence_score":    int(round(presence_score)),
        "depth_score":       int(round(depth_score)),
    }


def apply_must_have_ceiling(score: int, must_have_missing: int) -> int:
    ceilings = {1: 75, 2: 55, 3: 35}
    ceiling = ceilings.get(must_have_missing, 20 if must_have_missing >= 4 else None)
    if ceiling is None:
        return score
    return min(score, ceiling)
