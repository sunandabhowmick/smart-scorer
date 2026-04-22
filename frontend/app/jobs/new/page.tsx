'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'
import WeightSliders from '@/components/WeightSliders'

const DEFAULT_WEIGHTS = {
  technical: 40, experience: 25, education: 10,
  soft_skills: 15, stability: 10
}

const IMPORTANCE_OPTIONS = ['must', 'good', 'bonus'] as const

export default function NewJobPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [pasteMode, setPasteMode] = useState(false)
  const [pasteText, setPasteText] = useState('')

  const [form, setForm] = useState({
    title: '',
    description: '',
    experience_min: 0,
    experience_max: 10,
    education_required: '',
    custom_instructions: '',
    scoring_weights: DEFAULT_WEIGHTS,
    required_skills: [] as { skill: string; importance: string }[],
    nice_to_have_skills: [] as string[],
    skill_importance: {} as Record<string, string>,
  })

  const [skillInput, setSkillInput] = useState('')

  const addSkill = () => {
    if (!skillInput.trim()) return
    const skill = skillInput.trim()
    setForm(f => ({
      ...f,
      required_skills: [...f.required_skills, { skill, importance: 'must' }],
      skill_importance: { ...f.skill_importance, [skill]: 'must' }
    }))
    setSkillInput('')
  }

  const removeSkill = (skill: string) => {
    setForm(f => ({
      ...f,
      required_skills: f.required_skills.filter(s => s.skill !== skill),
    }))
  }

  const updateImportance = (skill: string, importance: string) => {
    setForm(f => ({
      ...f,
      required_skills: f.required_skills.map(s =>
        s.skill === skill ? { ...s, importance } : s
      ),
      skill_importance: { ...f.skill_importance, [skill]: importance }
    }))
  }

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Job title is required'); return }
    const total = Object.values(form.scoring_weights).reduce((a, b) => a + b, 0)
    if (total !== 100) { setError(`Weights must total 100% (currently ${total}%)`); return }

    setSaving(true)
    setError('')
    try {
      const job = await api.createJob(form)
      router.push(`/jobs/${job.id}`)
    } catch (e: any) {
      setError(e.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 text-sm">← Back</button>
          <h1 className="text-2xl font-bold text-gray-900">New Job Description</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-5 space-y-4">
            <h2 className="font-semibold text-[#1B4F8A]">Basic Information</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4F8A]"
                placeholder="e.g. Senior Python Developer"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Experience (yrs)</label>
                <input type="number" value={form.experience_min}
                  onChange={e => setForm(f => ({ ...f, experience_min: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4F8A]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Experience (yrs)</label>
                <input type="number" value={form.experience_max}
                  onChange={e => setForm(f => ({ ...f, experience_max: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4F8A]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Education Required</label>
              <select value={form.education_required}
                onChange={e => setForm(f => ({ ...f, education_required: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4F8A]"
              >
                {["", "High School", "Diploma", "Bachelor's", "B.Tech", "Master's", "MBA", "PhD"]
                  .map(o => <option key={o} value={o}>{o || "Any"}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full JD Text (optional)</label>
              <textarea value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4F8A]"
                placeholder="Paste the full job description here..."
              />
            </div>
          </div>

          {/* Required Skills */}
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-5 space-y-4">
            <h2 className="font-semibold text-[#1B4F8A]">Required Skills</h2>

            <div className="flex gap-2">
              <input
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSkill()}
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4F8A]"
                placeholder="Type skill and press Enter or Add"
              />
              <button onClick={addSkill}
                className="bg-[#1B4F8A] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#133A66]">
                Add
              </button>
            </div>

            {form.required_skills.length > 0 && (
              <div className="space-y-2">
                {form.required_skills.map(({ skill, importance }) => (
                  <div key={skill} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
                    <span className="flex-1 text-sm text-gray-800">{skill}</span>
                    <div className="flex gap-1">
                      {IMPORTANCE_OPTIONS.map(opt => (
                        <button key={opt}
                          onClick={() => updateImportance(skill, opt)}
                          className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                            importance === opt
                              ? opt === 'must' ? 'bg-red-100 text-red-700'
                                : opt === 'good' ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-green-100 text-green-700'
                              : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-100'
                          }`}>
                          {opt === 'must' ? 'Must Have' : opt === 'good' ? 'Good to Have' : 'Bonus'}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => removeSkill(skill)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Scoring Weights */}
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-5 space-y-4">
            <div>
              <h2 className="font-semibold text-[#1B4F8A]">Scoring Weights</h2>
              <p className="text-xs text-gray-500 mt-1">Define what matters most for this role. Must total 100%.</p>
            </div>
            <WeightSliders
              value={form.scoring_weights}
              onChange={w => setForm(f => ({ ...f, scoring_weights: w }))}
            />
          </div>

          {/* Custom Instructions */}
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-5 space-y-3">
            <div>
              <h2 className="font-semibold text-[#1B4F8A]">Custom AI Instructions</h2>
              <p className="text-xs text-gray-500 mt-1">
                Tell the AI what to prioritize. This becomes part of the scoring rubric.
              </p>
            </div>
            <textarea
              value={form.custom_instructions}
              onChange={e => setForm(f => ({ ...f, custom_instructions: e.target.value }))}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4F8A]"
              placeholder='e.g. "Prefer candidates from product companies. Penalize more than 3 jobs in 4 years."'
            />
          </div>

          {/* Save */}
          <div className="flex justify-end gap-3">
            <button onClick={() => router.back()}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="px-6 py-2.5 bg-[#1B4F8A] text-white rounded-lg text-sm font-medium hover:bg-[#133A66] disabled:opacity-50">
              {saving ? 'Saving...' : '💾 Save Job'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
