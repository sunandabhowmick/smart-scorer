"""
Prompt Builder — AI is the reasoning and quality layer only.

The AI receives rule-computed scores and can:
  - Adjust EXPERIENCE score by ±15 (quality signals)
  - Score SOFT SKILLS 0-100 (pure AI, no rules)
  - Write reasoning for ALL 5 categories
  
The AI CANNOT touch: technical, education, stability scores.
Python always recalculates overall and recommendation.
"""
from typing import Dict, List, Optional


SYSTEM_PROMPT = """You are an expert HR assistant helping evaluate candidates.

You have already been given the RULE-COMPUTED SCORES for Technical Skills,
Education, and Stability. These are calculated deterministically from the
resume. Do NOT change them.

Your job is to:
1. Adjust the EXPERIENCE score by at most ±15 based on quality signals
   (product vs service company, leadership, career progression, domain fit)
2. Score SOFT SKILLS (0-100) based on communication and collaboration
   signals in the resume
3. Write clear, professional reasoning for ALL 5 categories
4. Write a concise overall AI assessment

IMPORTANT LANGUAGE RULES:
- Write in plain English that a recruiter can understand
- Never use technical jargon like "ceiling rule", "capped", "deterministic"
- If skills are missing, say: "[skill names] were not found in this resume"
- Be specific — name the actual skills, companies, years

Return ONLY this JSON structure, no markdown, no extra text:
{
  "experience_adjustment": <integer between -15 and +15>,
  "soft_skills_score": <integer 0-100>,
  "category_reasoning": {
    "technical":   "<clear explanation of what skills were found/missing>",
    "experience":  "<quality of experience: company type, growth, domain fit>",
    "education":   "<degree match explanation>",
    "soft_skills": "<communication, collaboration, leadership signals>",
    "stability":   "<tenure pattern explanation>"
  },
  "highlights": ["<strength 1>", "<strength 2>"],
  "red_flags": ["<concern 1>"],
  "ai_reasoning": "<3-4 sentence overall assessment. Start with technical skill match. End with recommendation rationale.>"
}"""


def build_user_prompt(
    resume_text: str,
    jd: dict,
    candidate_name: str = "Unknown",
    rule_scores: Optional[Dict] = None,
    technical_detail: Optional[Dict] = None,
) -> str:
    """
    Build prompt for AI — includes rule scores so AI knows the baseline.
    AI only adjusts experience and writes reasoning.
    """
    weights = jd.get("scoring_weights", {
        "technical": 50, "experience": 25,
        "education": 10, "soft_skills": 5, "stability": 10
    })

    # Skill lists for context
    skill_importance = jd.get("skill_importance", {})
    required_skills  = jd.get("required_skills", [])

    must_have    = []
    good_to_have = []
    bonus        = []
    for skill in required_skills:
        name = skill.get("skill", skill) if isinstance(skill, dict) else skill
        imp  = skill_importance.get(name, "must")
        if imp == "must":       must_have.append(name)
        elif imp == "good":     good_to_have.append(name)
        else:                   bonus.append(name)

    # Rule scores summary
    rs = rule_scores or {}
    tech_score = rs.get("technical", {}).get("score", 0)
    exp_score  = rs.get("experience", {}).get("score", 50)
    edu_score  = rs.get("education",  {}).get("score", 50)
    stab_score = rs.get("stability",  {}).get("score", 60)

    # Technical detail for AI context
    td = technical_detail or {}
    found   = td.get("found", [])
    partial = td.get("partial", [])
    missing = td.get("missing", [])

    custom = jd.get("custom_instructions", "").strip()

    resume_compressed = resume_text[:3000].strip()
    if len(resume_text) > 3000:
        resume_compressed += "\n[... resume truncated ...]"

    prompt = f"""CANDIDATE: {candidate_name}
JOB TITLE: {jd.get('title', 'Not specified')}

REQUIRED SKILLS:
  Must Have:    {', '.join(must_have) if must_have else 'None'}
  Good to Have: {', '.join(good_to_have) if good_to_have else 'None'}
  Bonus:        {', '.join(bonus) if bonus else 'None'}

EXPERIENCE REQUIRED: {jd.get('experience_min', 0)}–{jd.get('experience_max', 99)} years
EDUCATION REQUIRED: {jd.get('education_required', 'Not specified')}

RULE-COMPUTED SCORES (do not change these):
  Technical Skills: {tech_score}/100
    Skills found:   {', '.join(found) if found else 'None'}
    Partial match:  {', '.join(partial) if partial else 'None'}
    Missing:        {', '.join(missing) if missing else 'None'}
  Education:        {edu_score}/100
  Stability:        {stab_score}/100

EXPERIENCE RULE SCORE: {exp_score}/100 (you may adjust ±15 for quality)
  Adjust UP if:  product company, leadership role, domain expertise, fast growth
  Adjust DOWN if: only service company, no ownership, irrelevant domain

SCORING WEIGHTS (for your context):
  Technical:  {weights.get('technical', 50)}%
  Experience: {weights.get('experience', 25)}%
  Education:  {weights.get('education', 10)}%
  Soft Skills:{weights.get('soft_skills', 5)}%
  Stability:  {weights.get('stability', 10)}%
"""

    if custom:
        prompt += f"\nHIRING MANAGER INSTRUCTIONS:\n{custom}\n"

    prompt += f"""
RESUME:
{resume_compressed}

Instructions:
1. Read the resume carefully
2. Decide experience_adjustment (-15 to +15) based on quality signals
3. Score soft_skills based on what you can observe
4. Write clear reasoning for all 5 categories
5. Return JSON only"""

    return prompt
