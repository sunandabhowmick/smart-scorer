'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'
import WeightSliders from '@/components/WeightSliders'

const PRESETS = [
  { name: 'Balanced',        icon: '⚖️', desc: 'General hiring',
    weights: { technical:35, experience:25, education:10, soft_skills:15, stability:15 },
    thresholds: { shortlist:75, review:55 } },
  { name: 'Technical Focus', icon: '💻', desc: 'Engineering / data / DevOps',
    weights: { technical:55, experience:20, education:10, soft_skills:10, stability:5 },
    thresholds: { shortlist:75, review:55 } },
  { name: 'Leadership',      icon: '🎯', desc: 'Managers / directors',
    weights: { technical:20, experience:30, education:10, soft_skills:30, stability:10 },
    thresholds: { shortlist:70, review:50 } },
  { name: 'Sales & BD',      icon: '📈', desc: 'Sales / business development',
    weights: { technical:10, experience:30, education:5, soft_skills:40, stability:15 },
    thresholds: { shortlist:70, review:50 } },
  { name: 'Senior / Expert', icon: '🏆', desc: 'Senior ICs / principals — high bar',
    weights: { technical:45, experience:35, education:5, soft_skills:10, stability:5 },
    thresholds: { shortlist:80, review:65 } },
  { name: 'Fresh Graduate',  icon: '🎓', desc: 'Entry level / campus hiring',
    weights: { technical:30, experience:10, education:30, soft_skills:20, stability:10 },
    thresholds: { shortlist:65, review:45 } },
]

const DEFAULT_WEIGHTS = { technical:35, experience:25, education:10, soft_skills:15, stability:15 }

export default function NewJobPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [activePreset, setActivePreset] = useState('Balanced')

  const [form, setForm] = useState({
    title: '',
    description: '',
    experience_min: 0,
    experience_max: 10,
    education_required: '',
    custom_instructions: '',
    scoring_weights: DEFAULT_WEIGHTS,
    shortlist_threshold: 75,
    review_threshold: 55,
    minimum_technical_score: '' as string | number,
    required_skills: [] as { skill: string; importance: string }[],
    nice_to_have_skills: [] as string[],
    skill_importance: {} as Record<string, string>,
  })

  const [skillInput, setSkillInput] = useState('')

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setActivePreset(preset.name)
    setForm(f => ({
      ...f,
      scoring_weights: preset.weights,
      shortlist_threshold: preset.thresholds.shortlist,
      review_threshold: preset.thresholds.review,
    }))
  }

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
      skill_importance: Object.fromEntries(
        Object.entries(f.skill_importance).filter(([k]) => k !== skill)
      )
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
    if (form.shortlist_threshold <= form.review_threshold) {
      setError('Shortlist threshold must be higher than Review threshold')
      return
    }
    const minTech = form.minimum_technical_score === '' ? null : Number(form.minimum_technical_score)
    if (minTech !== null && (minTech < 0 || minTech > 100)) {
      setError('Minimum technical score must be between 0 and 100')
      return
    }
    setSaving(true)
    setError('')
    try {
      const job = await api.createJob({
        ...form,
        minimum_technical_score: minTech,
      })
      router.push(`/jobs/${job.id}`)
    } catch (e: any) {
      setError(e.response?.data?.detail || e.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const weightTotal = Object.values(form.scoring_weights).reduce((a, b) => a + b, 0)

  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-sm">← Back</button>
          <h1 className="text-2xl font-bold text-gray-900">New Job Description</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-5 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-5">

          {/* Basic Info */}
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-5 space-y-4">
            <h2 className="font-semibold text-[#1B4F8A]">📋 Basic Information</h2>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Job Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4F8A]"
                placeholder="e.g. Senior Python Developer" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Min Experience (yrs)</label>
                <input type="number" value={form.experience_min}
                  onChange={e => setForm(f => ({ ...f, experience_min: Number(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4F8A]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Max Experience (yrs)</label>
                <input type="number" value={form.experience_max}
                  onChange={e => setForm(f => ({ ...f, experience_max: Number(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4F8A]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Education</label>
                <select value={form.education_required}
                  onChange={e => setForm(f => ({ ...f, education_required: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4F8A]">
                  {['','High School','Diploma',"Bachelor's",'B.Tech',"Master's",'MBA','PhD']
                    .map(o => <option key={o} value={o}>{o || 'Any'}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Full JD Text (optional)</label>
              <textarea value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4F8A]"
                placeholder="Paste the full job description..." />
            </div>
          </div>

          {/* Required Skills */}
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-5 space-y-4">
            <div>
              <h2 className="font-semibold text-[#1B4F8A]">💡 Required Skills</h2>
              <p className="text-xs text-gray-400 mt-1">
                Must Have skills are scored strictly — missing one caps the technical score. Be precise with names.
              </p>
            </div>
            <div className="flex gap-2">
              <input value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSkill()}
                className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4F8A]"
                placeholder="Type exact skill name and press Enter" />
              <button onClick={addSkill}
                className="bg-[#1B4F8A] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#133A66]">
                Add
              </button>
            </div>

            {/* Importance legend */}
            <div className="flex gap-3 text-xs">
              <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-semibold">Must Have — caps score if missing</span>
              <span className="bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full font-semibold">Good to Have — deducts 8pts if missing</span>
              <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-semibold">Bonus — adds pts if present</span>
            </div>

            {form.required_skills.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-800">
                ⚠️ No skills added yet. Adding required skills significantly improves scoring accuracy. Without skills, technical scoring will be based on AI judgment only.
              </div>
            )}
            {form.required_skills.length > 0 && (
              <div className="space-y-2">
                {form.required_skills.map(({ skill, importance }) => (
                  <div key={skill} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
                    <span className="flex-1 text-sm font-medium text-gray-800">{skill}</span>
                    <div className="flex gap-1">
                      {(['must','good','bonus'] as const).map(opt => (
                        <button key={opt} onClick={() => updateImportance(skill, opt)}
                          className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                            importance === opt
                              ? opt === 'must'  ? 'bg-red-100 text-red-700'
                              : opt === 'good'  ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                              : 'bg-white border border-gray-200 text-gray-400 hover:bg-gray-100'
                          }`}>
                          {opt === 'must' ? 'Must Have' : opt === 'good' ? 'Good to Have' : 'Bonus'}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => removeSkill(skill)}
                      className="text-red-400 hover:text-red-600 text-xs font-bold">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Scoring Config */}
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-5 space-y-5">
            <h2 className="font-semibold text-[#1B4F8A]">⚖️ Scoring Configuration</h2>

            {/* Presets */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Presets</p>
              <div className="grid grid-cols-3 gap-2">
                {PRESETS.map(preset => (
                  <button key={preset.name} onClick={() => applyPreset(preset)}
                    className={`text-left p-3 rounded-xl border-2 transition ${
                      activePreset === preset.name
                        ? 'border-[#1B4F8A] bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span>{preset.icon}</span>
                      <span className={`text-sm font-semibold ${activePreset === preset.name ? 'text-[#1B4F8A]' : 'text-gray-800'}`}>
                        {preset.name}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 leading-snug">{preset.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Weights */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Scoring Weights
                <span className={`ml-2 font-bold ${weightTotal === 100 ? 'text-green-600' : 'text-red-600'}`}>
                  (Total: {weightTotal}%)
                </span>
              </p>
              <WeightSliders
                value={form.scoring_weights}
                onChange={w => { setForm(f => ({ ...f, scoring_weights: w })); setActivePreset('Custom') }}
              />
            </div>

            {/* Thresholds */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Recommendation Thresholds
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-xl border border-green-200 p-4">
                  <label className="block text-xs font-semibold text-green-700 mb-2">✅ Shortlist above</label>
                  <div className="flex items-center gap-3">
                    <input type="range" min={50} max={95} step={5}
                      value={form.shortlist_threshold}
                      onChange={e => setForm(f => ({ ...f, shortlist_threshold: Number(e.target.value) }))}
                      className="flex-1 accent-green-600" />
                    <span className="text-lg font-bold text-green-700 w-12 text-right">{form.shortlist_threshold}%</span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">Candidates scoring {form.shortlist_threshold}%+ are shortlisted</p>
                </div>
                <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4">
                  <label className="block text-xs font-semibold text-yellow-700 mb-2">⚠️ Review above</label>
                  <div className="flex items-center gap-3">
                    <input type="range" min={30} max={80} step={5}
                      value={form.review_threshold}
                      onChange={e => setForm(f => ({ ...f, review_threshold: Number(e.target.value) }))}
                      className="flex-1 accent-yellow-600" />
                    <span className="text-lg font-bold text-yellow-700 w-12 text-right">{form.review_threshold}%</span>
                  </div>
                  <p className="text-xs text-yellow-600 mt-1">Below {form.review_threshold}% is automatically passed</p>
                </div>
              </div>
            </div>

            {/* Minimum Technical Score — NEW */}
            <div className="bg-red-50 rounded-xl border border-red-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <label className="block text-xs font-semibold text-red-700">
                    🎯 Minimum Technical Score (optional)
                  </label>
                  <p className="text-xs text-red-500 mt-0.5">
                    Candidates below this technical score are automatically ❌ Pass — even if their overall score is high
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0} max={100}
                    value={form.minimum_technical_score}
                    onChange={e => setForm(f => ({ ...f, minimum_technical_score: e.target.value }))}
                    placeholder="e.g. 60"
                    className="w-20 border border-red-200 rounded-lg px-3 py-2 text-sm font-bold text-red-700 text-center focus:outline-none focus:border-red-400"
                  />
                  <span className="text-red-600 font-bold">%</span>
                </div>
              </div>
              {form.minimum_technical_score !== '' && Number(form.minimum_technical_score) > 0 && (
                <p className="text-xs text-red-600 font-medium mt-2 bg-red-100 rounded px-2 py-1">
                  ⚠️ Any candidate scoring below {form.minimum_technical_score}% in technical skills will be marked ❌ Pass regardless of their other scores
                </p>
              )}
            </div>
          </div>

          {/* Custom Instructions */}
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-5 space-y-3">
            <div>
              <h2 className="font-semibold text-[#1B4F8A]">🤖 Custom AI Instructions</h2>
              <p className="text-xs text-gray-400 mt-1">
                Additional context for the AI. Examples: "Prefer product company experience." "Penalise more than 3 jobs in 4 years."
              </p>
            </div>
            <textarea value={form.custom_instructions}
              onChange={e => setForm(f => ({ ...f, custom_instructions: e.target.value }))}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4F8A]"
              placeholder='e.g. "Prefer candidates from product companies. Value open source contributions."' />
          </div>

          {/* Save */}
          <div className="flex justify-end gap-3 pb-8">
            <button onClick={() => router.back()}
              className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="px-8 py-2.5 bg-[#1B4F8A] text-white rounded-lg text-sm font-semibold hover:bg-[#133A66] disabled:opacity-50 transition">
              {saving ? 'Saving...' : '💾 Save Job'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
