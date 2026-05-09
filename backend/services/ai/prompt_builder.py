"""
Prompt Builder — AI handles reasoning and experience quality adjustment.
4 categories only: Technical, Experience, Education, Stability.
Soft Skills removed.
"""
from typing import Dict, List, Optional


SYSTEM_PROMPT = """You are an expert HR assistant helping evaluate candidates for job roles.

You have been given RULE-COMPUTED SCORES for Technical Skills, Education, and Stability.
These are calculated deterministically. Do NOT change them.

Your responsibilities:
1. Adjust EXPERIENCE score by at most ±15 based on quality signals:
   - Adjust UP for: product company, leadership role, domain expertise, fast career growth
   - Adjust DOWN for: service company only, no ownership, irrelevant domain
2. Write clear professional reasoning for ALL 4 categories
3. Write a concise overall AI assessment (3-4 sentences)

IMPORTANT:
- Write in plain English a recruiter can understand
- Never use jargon like "ceiling rule", "capped", "deterministic", "Python override"
- If skills are missing, say: "[skill names] were not found in this resume"
- Be specific — mention actual skills, companies, years
- For education: if candidate has higher degree than required, note this positively

Return ONLY this JSON, no markdown:
{
  "experience_adjustment": <integer -15 to +15>,
  "category_reasoning": {
    "technical":  "<what skills were found/missing, depth of expertise>",
    "experience": "<quality signals: company type, growth, domain fit, leadership>",
    "education":  "<degree match explanation, note if higher than required>",
    "stability":  "<tenure pattern, job hopping assessment>"
  },
  "highlights": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "red_flags": ["<concern 1>"],
  "ai_reasoning": "<3-4 sentence overall assessment. Lead with technical skill match. End with clear hiring recommendation rationale.>"
}"""


def build_user_prompt(
    resume_text: str,
    jd: dict,
    candidate_name: str = "Unknown",
    rule_scores: Optional[Dict] = None,
    technical_detail: Optional[Dict] = None,
    no_skills: bool = False,
) -> str:

    skill_importance = jd.get("skill_importance", {})
    required_skills  = jd.get("required_skills", [])

    must_have, good_to_have, bonus = [], [], []
    for skill in required_skills:
        name = skill.get("skill", skill) if isinstance(skill, dict) else skill
        imp  = skill_importance.get(name, "must")
        if imp == "must":       must_have.append(name)
        elif imp == "good":     good_to_have.append(name)
        else:                   bonus.append(name)

    rs = rule_scores or {}
    tech  = rs.get("technical",  {})
    exp   = rs.get("experience", {})
    edu   = rs.get("education",  {})
    stab  = rs.get("stability",  {})

    td      = technical_detail or {}
    found   = td.get("found",   [])
    partial = td.get("partial", [])
    missing = td.get("missing", [])

    exp_score  = exp.get("score")
    edu_score  = edu.get("score")
    tech_score = tech.get("score", 50)
    stab_score = stab.get("score", 60)

    custom = jd.get("custom_instructions", "").strip()
    exp_min = jd.get("experience_min", 0)
    exp_max = jd.get("experience_max", 0)

    prompt = f"""CANDIDATE: {candidate_name}
JOB TITLE: {jd.get('title', 'Not specified')}

REQUIRED SKILLS:
  Must Have:    {', '.join(must_have) if must_have else 'None defined'}
  Good to Have: {', '.join(good_to_have) if good_to_have else 'None'}
  Bonus:        {', '.join(bonus) if bonus else 'None'}

EXPERIENCE REQUIRED: {f"{exp_min}–{exp_max} years" if exp_min or exp_max else "Not specified"}
EDUCATION REQUIRED: {jd.get('education_required', 'Not specified')}

RULE-COMPUTED SCORES (do not change technical, education, stability):
  Technical Skills: {f"{tech_score}/100" if not no_skills else "No skills defined — assess freely based on JD and resume"}
    Found in resume:  {', '.join(found) if found else 'None'}
    Partial match:    {', '.join(partial) if partial else 'None'}
    Not found:        {', '.join(missing) if missing else 'None'}
  Education:  {f"{edu_score}/100" if edu_score is not None else "Not scored (not found or no requirement)"}
  Stability:  {stab_score}/100

EXPERIENCE BASE SCORE: {f"{exp_score}/100" if exp_score is not None else "Not scored (no requirement set)"}
  You may adjust this by ±15 for quality signals.
  Candidate years: {exp.get('years', 'unknown')}
"""

    if custom:
        prompt += f"\nHIRING MANAGER INSTRUCTIONS:\n{custom}\n"

    prompt += f"""
RESUME:
{resume_text}

Return JSON only."""

    return prompt
