from __future__ import annotations
import re
from datetime import datetime
from typing import Optional, List, Tuple

_MONTH_MAP = {
    "jan":1,"feb":2,"mar":3,"apr":4,"may":5,"jun":6,
    "jul":7,"aug":8,"sep":9,"oct":10,"nov":11,"dec":12,
    "january":1,"february":2,"march":3,"april":4,"june":6,
    "july":7,"august":8,"september":9,"october":10,
    "november":11,"december":12,
}
_CURRENT = {"present","current","now","till date","to date","ongoing"}

_PATTERNS = [
    r"(\w+\s+\d{4})\s*[–\-—to]+\s*(\w+(?:\s+\d{4})?)",
    r"\b(\d{4})\s*[–\-—to]+\s*(\d{4}|present|current|now)\b",
    r"(\d{1,2})[/\-](\d{4})\s*[–\-—to]+\s*(\d{1,2})[/\-](\d{4})",
]


def _parse_date(token: str) -> Optional[datetime]:
    t = token.strip().lower()
    if t in _CURRENT:
        return datetime.now()
    m = re.match(r"(\w+)\s+(\d{4})", t)
    if m:
        month = _MONTH_MAP.get(m.group(1).lower())
        if month:
            return datetime(int(m.group(2)), month, 1)
    m = re.match(r"^(\d{4})$", t)
    if m:
        return datetime(int(m.group(1)), 1, 1)
    m = re.match(r"(\d{1,2})[/\-](\d{4})", t)
    if m:
        return datetime(int(m.group(2)), int(m.group(1)), 1)
    return None


def extract_experience_years(resume_text: str) -> float:
    text = resume_text.lower()
    ranges: List[Tuple[datetime, datetime]] = []

    for pattern in _PATTERNS:
        for m in re.finditer(pattern, text, re.IGNORECASE):
            g = m.groups()
            try:
                if len(g) == 2:
                    start, end = _parse_date(g[0]), _parse_date(g[1])
                elif len(g) == 4:
                    start = _parse_date(f"{g[0]}/{g[1]}")
                    end   = _parse_date(f"{g[2]}/{g[3]}")
                else:
                    continue
                if start and end and start < end:
                    yrs = (end - start).days / 365.25
                    if 0 < yrs <= 20:
                        ranges.append((start, end))
            except (ValueError, TypeError):
                continue

    if not ranges:
        for m in re.finditer(
            r"(\d+(?:\.\d+)?)\s*\+?\s*years?\s+(?:of\s+)?(?:experience|exp)",
            text, re.IGNORECASE
        ):
            try:
                return float(m.group(1))
            except ValueError:
                pass
        return 0.0

    ranges.sort(key=lambda r: r[0])
    merged = [ranges[0]]
    for s, e in ranges[1:]:
        ls, le = merged[-1]
        if s <= le:
            merged[-1] = (ls, max(le, e))
        else:
            merged.append((s, e))

    return round(sum((e-s).days for s,e in merged) / 365.25, 1)


def score_experience(resume_text: str, exp_min: int = 0, exp_max: int = 99) -> dict:
    years = extract_experience_years(resume_text)

    if years == 0:
        score, reasoning = 30, "Could not determine experience from resume dates."
    elif years < exp_min:
        shortfall = exp_min - years
        score = 70 if shortfall <= 1 else (50 if shortfall <= 2 else 30)
        reasoning = f"{years} years found; {exp_min} years required."
    elif years > exp_max and exp_max < 99:
        score, reasoning = 80, f"{years} years (overqualified for {exp_max} year max)."
    else:
        fit = (years - exp_min) / max(exp_max - exp_min, 1) if exp_max > exp_min else 1.0
        score = int(70 + fit * 25)
        reasoning = f"{years} years experience within the {exp_min}–{exp_max} year requirement."

    return {"score": max(0, min(100, score)), "years": years, "reasoning": reasoning}
