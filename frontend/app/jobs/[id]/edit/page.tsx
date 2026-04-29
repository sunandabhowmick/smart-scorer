'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
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

export default function EditJobPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [reScoring, setReScoring] = useState(false)
  const [error, setError] = useState('')
  const [activePreset, setActivePreset] = useState('Custom')
  const [existingScoreCount, setExistingScoreCount] = useState(0)
  const [showReScorePrompt, setShowReScorePrompt] = useState(false)
  const [savedJobData, setSavedJobData] = useState<any>(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    experience_min: 0,
    experience_max: 10,
    education_required: '',
    custom_instructions: '',
    scoring_weights: { technical:35, experience:25, education:10, soft_skills:15, stability:15 },
    shortlist_threshold: 75,
    review_threshold: 55,
    minimum_technical_score: '' as string | number,
    required_skills: [] as { skill: string; importance: string }[],
    nice_to_have_skills: [] as string[],
    skill_importance: {} as Record<string, string>,
  })

  const [skillInput, setSkillInput] = useState('')

  // Calculate next version number dynamically from title
  const currentVersion = parseInt(form.title.match(/\(v(\d+)\)$/)?.[1] || '1')
  const newVersion = currentVersion + 1

  useEffect(() => {
    const loadJob = async () => {
      try {
        const jobs = await api.getJobs()
        const job = jobs.find((j: any) => j.id === jobId)
        if (!job) { router.push('/jobs'); return }

        const w = job.scoring_weights || {}
        setForm({
          title: job.title || '',
          description: job.description || '',
          experience_min: job.experience_min || 0,
          experience_max: job.experience_max || 10,
          education_required: job.education_required || '',
          custom_instructions: job.custom_instructions || '',
          scoring_weights: {
            technical:  w.technical  ?? 35,
            experience: w.experience ?? 25,
            education:  w.education  ?? 10,
            soft_skills:w.soft_skills?? 15,
            stability:  w.stability  ?? 10,
          },
          shortlist_threshold: job.shortlist_threshold ?? w.shortlist_threshold ?? 75,
          review_threshold: job.review_threshold ?? w.review_threshold ?? 55,
          minimum_technical_score: job.minimum_technical_score ?? '',
          required_skills: job.required_skills || [],
          nice_to_have_skills: job.nice_to_have_skills || [],
          skill_importance: job.skill_importance || {},
        })

        // Count existing scores
        const results = await api.getResults(jobId)
        setExistingScoreCount(results.length)
      } finally {
        setLoading(false)
      }
    }
    loadJob()
  }, [jobId])

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

    setSaving(true)
    setError('')
    try {
      const minTech = form.minimum_technical_score === '' ? null : Number(form.minimum_technical_score)
      
      if (existingScoreCount > 0) {
        // Create new JD version instead of overwriting
        const newJob = await api.createJob({
          ...form,
          minimum_technical_score: minTech,
          title: form.title.replace(/ \(v\d+\)$/, '') + ` (v${newVersion})`,
        })
        router.push(`/jobs/${newJob.id}`)
      } else {
        // No existing scores — safe to update in place
        await api.updateJob(jobId, { ...form, minimum_technical_score: minTech })
        router.push(`/jobs/${jobId}`)
      }
    } catch (e: any) {
      setError(e.response?.data?.detail || e.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleSkipReScore = () => {
    router.push(`/jobs/${jobId}`)
  }

  const weightTotal = Object.values(form.scoring_weights).reduce((a, b) => a + b, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F4F8]">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400">Loading job...</p>
        </div>
      </div>
    )
  }

  // Re-score prompt modal
  if (showReScorePrompt) {
    return (
      <div className="min-h-screen bg-[#F0F4F8]">
        <Navbar />
        <div className="max-w-lg mx-auto px-6 py-16">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-lg">
            <div className="text-5xl mb-4">⚖️</div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              Re-score existing resumes?
            </h2>
            <p className="text-gray-500 text-sm mb-2">
              You have <span className="font-semibold text-gray-800">{existingScoreCount} scored resume{existingScoreCount > 1 ? 's' : ''}</span> for this job.
            </p>
            <p className="text-gray-500 text-sm mb-6">
              Your changes to weights, thresholds, or skills may affect their scores.
              Re-scoring will update all existing results with the new configuration.
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-800 mb-6">
              ⚠️ Re-scoring uses AI tokens (~{existingScoreCount} API calls). Previous scores will be overwritten.
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSkipReScore}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 font-medium">
                Keep old scores
              </button>
              <button
                disabled={false}
                onClick={() => router.push(`/jobs/${jobId}`)}
                className="flex-1 px-4 py-3 bg-[#1B4F8A] text-white rounded-lg text-sm font-semibold hover:bg-[#133A66]">
                📤 Go to Job — Re-upload to Re-score
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              💡 <strong>Option 1:</strong> Keep old scores → go back and re-upload resumes manually.<br/>
              💡 <strong>Option 2:</strong> Save as New JD → creates a copy with new settings, old JD preserved.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-sm">← Back</button>
          <h1 className="text-2xl font-bold text-gray-900">Edit Job Description</h1>
          {existingScoreCount > 0 && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-medium">
              ⚠️ {existingScoreCount} existing score{existingScoreCount > 1 ? 's' : ''} — changing weights affects results
            </span>
          )}
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
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4F8A]" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Min Exp (yrs)</label>
                <input type="number" value={form.experience_min}
                  onChange={e => setForm(f => ({ ...f, experience_min: Number(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4F8A]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Max Exp (yrs)</label>
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
          </div>

          {/* Skills */}
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-5 space-y-4">
            <div>
              <h2 className="font-semibold text-[#1B4F8A]">💡 Required Skills</h2>
              <p className="text-xs text-gray-400 mt-1">Must Have skills are scored strictly — missing one caps the technical score.</p>
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
                  <p className="text-xs text-gray-400">{preset.desc}</p>
                </button>
              ))}
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Weights <span className={`ml-1 font-bold ${weightTotal === 100 ? 'text-green-600' : 'text-red-600'}`}>(Total: {weightTotal}%)</span>
              </p>
              <WeightSliders
                value={form.scoring_weights}
                onChange={w => { setForm(f => ({ ...f, scoring_weights: w })); setActivePreset('Custom') }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-xl border border-green-200 p-4">
                <label className="block text-xs font-semibold text-green-700 mb-2">✅ Shortlist above</label>
                <div className="flex items-center gap-3">
                  <input type="range" min={50} max={95} step={5} value={form.shortlist_threshold}
                    onChange={e => setForm(f => ({ ...f, shortlist_threshold: Number(e.target.value) }))}
                    className="flex-1 accent-green-600" />
                  <span className="text-lg font-bold text-green-700 w-12 text-right">{form.shortlist_threshold}%</span>
                </div>
              </div>
              <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4">
                <label className="block text-xs font-semibold text-yellow-700 mb-2">⚠️ Review above</label>
                <div className="flex items-center gap-3">
                  <input type="range" min={30} max={80} step={5} value={form.review_threshold}
                    onChange={e => setForm(f => ({ ...f, review_threshold: Number(e.target.value) }))}
                    className="flex-1 accent-yellow-600" />
                  <span className="text-lg font-bold text-yellow-700 w-12 text-right">{form.review_threshold}%</span>
                </div>
              </div>
            </div>

            <div className="bg-red-50 rounded-xl border border-red-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-semibold text-red-700">🎯 Minimum Technical Score (optional)</label>
                  <p className="text-xs text-red-500 mt-0.5">Candidates below this in technical are auto ❌ Pass</p>
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" min={0} max={100}
                    value={form.minimum_technical_score}
                    onChange={e => setForm(f => ({ ...f, minimum_technical_score: e.target.value }))}
                    placeholder="e.g. 60"
                    className="w-20 border border-red-200 rounded-lg px-3 py-2 text-sm font-bold text-red-700 text-center focus:outline-none" />
                  <span className="text-red-600 font-bold">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Custom Instructions */}
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-5 space-y-3">
            <h2 className="font-semibold text-[#1B4F8A]">🤖 Custom AI Instructions</h2>
            <textarea value={form.custom_instructions}
              onChange={e => setForm(f => ({ ...f, custom_instructions: e.target.value }))}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4F8A]"
              placeholder='e.g. "Prefer candidates from product companies."' />
          </div>

          <div className="flex justify-end gap-3 pb-8">
            <button onClick={() => router.back()}
              className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="px-8 py-2.5 bg-[#1B4F8A] text-white rounded-lg text-sm font-semibold hover:bg-[#133A66] disabled:opacity-50 transition">
              {saving ? 'Saving...' : '💾 Save Changes'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
