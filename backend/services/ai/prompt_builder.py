"""
Prompt Builder — constructs the scoring prompt sent to AI.
This is your scoring rubric. Edit this to change how AI scores.
"""
from typing import Dict, List


SYSTEM_PROMPT = """You are an expert ATS (Applicant Tracking System) scoring assistant for HYROI Solutions.

Your job is to score resumes against job descriptions and return a structured JSON response ONLY.
No conversational text. No markdown. Pure JSON only.

SCORING RULES:
1. Score each category from 0 to 100
2. Apply the weights provided — they define what matters for this specific role
3. Skill importance levels:
   - "must": Missing this skill reduces technical score by minimum 20 points
   - "good": Missing this skill reduces technical score by 8 points
   - "bonus": Having this skill adds up to 5 points bonus
4. For experience: consider quality over quantity
   - Product company experience outweighs service company for same years
   - Leadership and ownership signals count positively
   - Career progression matters more than total years alone
5. For stability: flag if average tenure < 1.5 years AND no clear career progression
6. Be strict on Must Have skills. Be generous on transferable skills.
7. Consider the full context of the resume, not just keyword matches

RETURN THIS EXACT JSON STRUCTURE:
{
  "overall_score": <0-100>,
  "recommendation": "<SHORTLIST|REVIEW|PASS>",
  "category_scores": {
    "technical": {
      "score": <0-100>,
      "reasoning": "<1-2 sentences explaining this score>"
    },
    "experience": {
      "score": <0-100>,
      "reasoning": "<1-2 sentences explaining this score>"
    },
    "education": {
      "score": <0-100>,
      "reasoning": "<1-2 sentences explaining this score>"
    },
    "soft_skills": {
      "score": <0-100>,
      "reasoning": "<1-2 sentences explaining this score>"
    },
    "stability": {
      "score": <0-100>,
      "reasoning": "<1-2 sentences explaining this score>"
    }
  },
  "matched_skills": ["<skill1>", "<skill2>"],
  "missing_skills": ["<skill1>", "<skill2>"],
  "red_flags": ["<flag1>", "<flag2>"],
  "highlights": ["<highlight1>", "<highlight2>"],
  "ai_reasoning": "<3-4 sentences overall summary explaining the score and recommendation>"
}

RECOMMENDATION THRESHOLDS:
- SHORTLIST: overall_score >= 75
- REVIEW: overall_score >= 50
- PASS: overall_score < 50"""


def build_user_prompt(
    resume_text: str,
    jd: Dict,
    candidate_name: str = "Unknown",
) -> str:
    """Build the per-resume user prompt from JD config and resume text."""

    weights = jd.get("scoring_weights", {
        "technical": 40, "experience": 25,
        "education": 10, "soft_skills": 15, "stability": 10
    })

    # Format required skills with importance
    skill_importance = jd.get("skill_importance", {})
    required_skills = jd.get("required_skills", [])

    skills_formatted = []
    for skill in required_skills:
        skill_name = skill.get("skill", skill) if isinstance(skill, dict) else skill
        importance = skill_importance.get(skill_name, "must")
        skills_formatted.append(f"  - {skill_name} [{importance.upper()}]")

    nice_to_have = jd.get("nice_to_have_skills", [])
    nice_formatted = [f"  - {s}" for s in nice_to_have]

    custom = jd.get("custom_instructions", "").strip()

    # Compress resume — cap at 3000 chars to save tokens
    resume_compressed = resume_text[:3000].strip()
    if len(resume_text) > 3000:
        resume_compressed += "\n[... resume truncated for length ...]"

    prompt = f"""CANDIDATE: {candidate_name}

JOB TITLE: {jd.get('title', 'Not specified')}

REQUIRED SKILLS:
{chr(10).join(skills_formatted) if skills_formatted else '  - Not specified'}

NICE TO HAVE:
{chr(10).join(nice_formatted) if nice_formatted else '  - None specified'}

EXPERIENCE REQUIRED: {jd.get('experience_min', 0)} to {jd.get('experience_max', 99)} years

EDUCATION REQUIRED: {jd.get('education_required', 'Not specified')}

SCORING WEIGHTS (must add to 100):
  - Technical Skills: {weights.get('technical', 40)}%
  - Experience: {weights.get('experience', 25)}%
  - Education: {weights.get('education', 10)}%
  - Soft Skills: {weights.get('soft_skills', 15)}%
  - Stability: {weights.get('stability', 10)}%
"""

    if custom:
        prompt += f"\nSPECIAL INSTRUCTIONS FROM HIRING MANAGER:\n{custom}\n"

    prompt += f"""
RESUME TEXT:
{resume_compressed}

Score this candidate now. Return JSON only."""

    return prompt
