'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'

export default function EditJobPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params.id as string

  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')
  const [existingScoreCount, setExistingScoreCount] = useState(0)
  const [showReScorePrompt,  setShowReScorePrompt]  = useState(false)
  const [skillInput, setSkillInput] = useState('')

  const [form, setForm] = useState({
    title:               '',
    description:         '',
    experience_min:      0,
    experience_max:      0,
    education_required:  '',
    custom_instructions: '',
    required_skills:     [] as { skill: string; importance: string }[],
    nice_to_have_skills: [] as string[],
    skill_importance:    {} as Record<string, string>,
  })

  const currentVersion = parseInt(form.title.match(/\(v(\d+)\)$/)?.[1] || '1')
  const newVersion = currentVersion + 1

  useEffect(() => {
    const loadJob = async () => {
      try {
        const jobs = await api.getJobs()
        const job = jobs.find((j: any) => j.id === jobId)
        if (!job) { router.push('/jobs'); return }

        setForm({
          title:               job.title || '',
          description:         job.description || '',
          experience_min:      job.experience_min || 0,
          experience_max:      job.experience_max || 0,
          education_required:  job.education_required || '',
          custom_instructions: job.custom_instructions || '',
          required_skills:     job.required_skills || [],
          nice_to_have_skills: job.nice_to_have_skills || [],
          skill_importance:    job.skill_importance || {},
        })

        const results = await api.getResults(jobId)
        setExistingScoreCount(results.length)
      } finally {
        setLoading(false)
      }
    }
    loadJob()
  }, [jobId])

  const addSkill = () => {
    const skill = skillInput.trim()
    if (!skill) return
    if (form.required_skills.find(s => s.skill === skill)) return
    setForm(f => ({
      ...f,
      required_skills:  [...f.required_skills, { skill, importance: 'must' }],
      skill_importance: { ...f.skill_importance, [skill]: 'must' },
    }))
    setSkillInput('')
  }

  const removeSkill = (skill: string) => {
    setForm(f => ({
      ...f,
      required_skills:  f.required_skills.filter(s => s.skill !== skill),
      skill_importance: Object.fromEntries(
        Object.entries(f.skill_importance).filter(([k]) => k !== skill)
      ),
    }))
  }

  const setImportance = (skill: string, importance: string) => {
    setForm(f => ({
      ...f,
      required_skills:  f.required_skills.map(s =>
        s.skill === skill ? { ...s, importance } : s
      ),
      skill_importance: { ...f.skill_importance, [skill]: importance },
    }))
  }

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Job title is required'); return }
    setSaving(true)
    setError('')
    try {
      if (existingScoreCount > 0) {
        setShowReScorePrompt(true)
        setSaving(false)
        return
      }
      await api.updateJob(jobId, { ...form })
      router.push(`/jobs/${jobId}`)
    } catch (e: any) {
      setError(e.response?.data?.detail || e.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAsNew = async () => {
    setSaving(true)
    try {
      const newJob = await api.createJob({
        ...form,
        title: form.title.replace(/ \(v\d+\)$/, '') + ` (v${newVersion})`,
      })
      router.push(`/jobs/${newJob.id}`)
    } catch (e: any) {
      setError(e.response?.data?.detail || e.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleSkipReScore = () => {
    router.push(`/jobs/${jobId}`)
  }

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

  if (showReScorePrompt) {
    return (
      <div className="min-h-screen bg-[#F0F4F8]">
        <Navbar />
        <div className="max-w-lg mx-auto px-6 py-16">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-lg">
            <div className="text-5xl mb-4">⚖️</div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              Save as new version?
            </h2>
            <p className="text-gray-500 text-sm mb-2">
              You have <span className="font-semibold text-gray-800">
                {existingScoreCount} scored resume{existingScoreCount > 1 ? 's' : ''}
              </span> for this job.
            </p>
            <p className="text-gray-500 text-sm mb-6">
              Your changes will be saved as{' '}
              <span className="font-semibold text-[#1B4F8A]">
                "{form.title.replace(/ \(v\d+\)$/, '')} (v{newVersion})"
              </span>.
              The original JD and scores are preserved.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800 mb-6">
              Both versions will appear in your Jobs list.
            </div>
            <div className="flex gap-3">
              <button onClick={handleSkipReScore}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Keep old scores
              </button>
              <button onClick={handleSaveAsNew} disabled={saving}
                className="flex-1 px-4 py-3 bg-[#1B4F8A] text-white rounded-lg text-sm font-semibold hover:bg-[#133A66] disabled:opacity-50">
                {saving ? 'Saving...' : `Save as v${newVersion}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()}
            className="text-gray-400 hover:text-gray-600 text-sm">← Back</button>
          <h1 className="text-2xl font-bold text-gray-900">Edit Job Description</h1>
          {existingScoreCount > 0 && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-medium">
              {existingScoreCount} existing scores
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
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Job Title *
              </label>
              <input value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4F8A]" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Min Experience (yrs)
                </label>
                <input type="number" min={0} value={form.experience_min}
                  onChange={e => setForm(f => ({ ...f, experience_min: Number(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4F8A]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Max Experience (yrs)
                </label>
                <input type="number" min={0} value={form.experience_max}
                  onChange={e => setForm(f => ({ ...f, experience_max: Number(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4F8A]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Minimum Qualification
                </label>
                <select value={form.education_required}
                  onChange={e => setForm(f => ({ ...f, education_required: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4F8A]">
                  <option value="">Not Specified</option>
                  <option value="High School">High School / 12th</option>
                  <option value="Diploma">Diploma / ITI</option>
                  <option value="Bachelor's">Bachelor's / B.Tech / B.E</option>
                  <option value="Master's">Master's / M.Tech / MBA</option>
                  <option value="PhD">PhD / Doctorate</option>
                </select>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-5 space-y-4">
            <h2 className="font-semibold text-[#1B4F8A]">💡 Required Skills</h2>
            <div className="flex gap-2">
              <input value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSkill()}
                className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4F8A]"
                placeholder="Type a skill and press Enter" />
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
                      {(['must', 'good', 'bonus'] as const).map(opt => (
                        <button key={opt} onClick={() => setImportance(skill, opt)}
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

          {/* Custom Instructions */}
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-5 space-y-3">
            <h2 className="font-semibold text-[#1B4F8A]">🤖 Custom AI Instructions</h2>
            <textarea value={form.custom_instructions}
              onChange={e => setForm(f => ({ ...f, custom_instructions: e.target.value }))}
              rows={2}
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
