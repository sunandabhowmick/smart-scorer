from services.rule_engine.skill_taxonomy import EDUCATION_RANK

def _detect_degree(text: str):
    text = text.lower()
    best_label, best_rank = "unknown", 0
    for degree, rank in EDUCATION_RANK.items():
        if degree in text and rank > best_rank:
            best_label, best_rank = degree, rank
    return best_label, best_rank

def _required_rank(education_required: str) -> int:
    if not education_required:
        return 0
    req = education_required.lower().strip()
    for degree, rank in EDUCATION_RANK.items():
        if degree in req:
            return rank
    return 0

def score_education(resume_text: str, education_required: str = "") -> dict:
    found_label, found_rank = _detect_degree(resume_text)
    required_rank = _required_rank(education_required)

    if not education_required or required_rank == 0:
        score = 90 if found_rank >= 4 else (70 if found_rank >= 2 else 50)
        reasoning = f"No specific requirement. Candidate has {found_label}." if found_rank > 0 else "Education details not found."
    else:
        gap = required_rank - found_rank
        if gap <= 0:
            score = 100 if gap == 0 else 90
            reasoning = f"Candidate has {found_label}, meets the {education_required} requirement."
        elif gap == 1:
            score, reasoning = 55, f"Candidate has {found_label}, one level below {education_required}."
        elif gap == 2:
            score, reasoning = 30, f"Candidate has {found_label}, below the {education_required} requirement."
        else:
            score, reasoning = 15, f"Candidate education does not meet the {education_required} requirement."

    return {"score": max(0, min(100, score)), "reasoning": reasoning}
