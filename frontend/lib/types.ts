export interface Job {
  id: string
  title: string
  description: string
  required_skills: { skill: string; importance: 'must' | 'good' | 'bonus' }[]
  nice_to_have_skills: string[]
  skill_importance: Record<string, string>
  experience_min: number
  experience_max: number
  education_required: string
  scoring_weights: {
    technical: number
    experience: number
    education: number
    soft_skills: number
    stability: number
  }
  custom_instructions: string
  status: string
  created_at: string
}

export interface CategoryScore {
  score: number
  reasoning: string
}

export interface ScoreResult {
  id: string
  overall_score: number
  recommendation: 'SHORTLIST' | 'REVIEW' | 'PASS'
  category_scores: Record<string, CategoryScore>
  matched_skills: string[]
  missing_skills: string[]
  red_flags: string[]
  highlights: string[]
  ai_reasoning: string
  model_used: string
  tokens_used: number
  scored_at: string
  candidates: {
    name: string
    email: string
    phone: string
  }
}
