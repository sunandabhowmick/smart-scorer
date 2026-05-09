'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'

export default function NewJobPage() {
  const router = useRouter()
  const [saving,     setSaving]     = useState(false)
  const [analysing,  setAnalysing]  = useState(false)
  const [error,      setError]      = useState('')

  // Extracted keywords preview (before adding to required skills)
  const [extracted,  setExtracted]  = useState<string[]>([])
  const [showExtracted, setShowExtracted] = useState(false)

  // Manual skill input
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

  // ── Extract keywords from JD ───────────────────────────────────────────────
  const handleExtract = async () => {
    if (!form.description.trim()) {
      setError('Please paste a JD first')
      return
    }
    setAnalysing(true)
    setError('')
    try {
      const skills = await api.extractSkills(form.description)
      if (skills && skills.length > 0) {
        // Filter out skills already in required list
        const existing = new Set(form.required_skills.map(s => s.skill.toLowerCase()))
        const fresh = skills.filter((s: string) => !existing.has(s.toLowerCase()))
        setExtracted(fresh)
        setShowExtracted(true)
      } else {
        setError('Could not extract keywords. Please add skills manually below.')
      }
    } catch (e: any) {
      console.error('Extraction error:', e?.response?.data || e?.message || e)
      setError(`Extraction failed: ${e?.response?.data?.detail || e?.message || 'Unknown error'}`)
    } finally {
      setAnalysing(false)
    }
  }

  // Remove one keyword from extracted preview
  const removeExtracted = (skill: string) => {
    setExtracted(prev => prev.filter(s => s !== skill))
  }

  // Move confirmed keywords → Required Skills section
  const handleAddToRequired = () => {
    if (extracted.length === 0) return
    const newSkills = extracted.map(skill => ({ skill, importance: 'must' }))
    const newImp: Record<string, string> = {}
    extracted.forEach(s => { newImp[s] = 'must' })

    setForm(f => ({
      ...f,
      required_skills:  [...f.required_skills, ...newSkills],
      skill_importance: { ...f.skill_importance, ...newImp },
    }))
    setExtracted([])
    setShowExtracted(false)
  }

  // ── Manual skill add ───────────────────────────────────────────────────────
  const addSkill = () => {
    const skill = skillInput.trim()
    if (!skill) return
    if (form.required_skills.find(s => s.skill.toLowerCase() === skill.toLowerCase())) {
      setSkillInput('')
      return
    }
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

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.title.trim()) { setError('Job title is required'); return }
    setSaving(true)
    setError('')
    try {
      const job = await api.createJob({ ...form })
      router.push(`/jobs/${job.id}`)
    } catch (e: any) {
      setError(e.response?.data?.detail || e.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const impStyle = (imp: string, active: string) => {
    const isActive = imp === active
    if (!isActive) return 'bg-white border border-gray-200 text-gray-400 hover:bg-gray-50'
    if (imp === 'must')  return 'bg-red-100 text-red-700 border border-red-200'
    if (imp === 'good')  return 'bg-yellow-100 text-yellow-700 border border-yellow-200'
    return 'bg-green-100 text-green-700 border border-green-200'
  }

  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-8">

        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()}
            className="text-gray-400 hover:text-gray-600 text-sm">← Back</button>
          <h1 className="text-2xl font-bold text-gray-900">New Job Description</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-5 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-5">

          {/* ── Basic Info ── */}
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-5 space-y-4">
            <h2 className="font-semibold text-[#1B4F8A]">📋 Basic Information</h2>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Job Title *
              </label>
              <input value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4F8A]"
                placeholder="e.g. Senior Power BI Developer" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Min Experience (yrs)
                </label>
                <input type="number" min={0} value={form.experience_min}
                  onChange={e => setForm(f => ({ ...f, experience_min: Number(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4F8A]" />
                {form.experience_min === 0 && form.experience_max === 0 && (
                  <p className="text-xs text-gray-400 mt-1">0 = any experience accepted</p>
                )}
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

          {/* ── JD Text + Keyword Extraction ── */}
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-5 space-y-4">
            <div>
              <h2 className="font-semibold text-[#1B4F8A]">📄 Job Description (optional)</h2>
              <p className="text-xs text-gray-400 mt-1">
                Paste your JD and click Extract Keywords — or skip and add skills directly below.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  JD Text
                </label>
                <button
                  onClick={handleExtract}
                  disabled={analysing || !form.description.trim()}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-[#1B4F8A] text-white px-3 py-1.5 rounded-lg hover:bg-[#133A66] disabled:opacity-40 transition">
                  {analysing ? '⏳ Extracting...' : '🔍 Extract Keywords'}
                </button>
              </div>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={5}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4F8A] resize-none"
                placeholder="Paste your full job description here..." />
            </div>

            {/* Extracted keywords preview */}
            {showExtracted && extracted.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-blue-900">
                    ✨ {extracted.length} keywords found — remove any you don't want, then add to skills
                  </p>
                  <button
                    onClick={() => { setShowExtracted(false); setExtracted([]) }}
                    className="text-xs text-blue-400 hover:text-blue-600">
                    Dismiss
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {extracted.map(skill => (
                    <span key={skill}
                      className="inline-flex items-center gap-1 bg-white border border-blue-200 text-blue-800 text-xs font-medium px-3 py-1.5 rounded-full">
                      {skill}
                      <button
                        onClick={() => removeExtracted(skill)}
                        className="text-blue-300 hover:text-red-500 font-bold ml-0.5">
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                <button
                  onClick={handleAddToRequired}
                  className="w-full bg-[#1B4F8A] text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-[#133A66] transition">
                  → Add {extracted.length} keyword{extracted.length > 1 ? 's' : ''} to Required Skills
                </button>
              </div>
            )}
          </div>

          {/* ── Required Skills ── */}
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-5 space-y-4">
            <div>
              <h2 className="font-semibold text-[#1B4F8A]">💡 Required Skills</h2>
              <p className="text-xs text-gray-400 mt-1">
                Set importance for each skill. Missing <span className="text-red-600 font-medium">Must Have</span> skills significantly reduce the technical score.
              </p>
            </div>

            {/* Manual add */}
            <div className="flex gap-2">
              <input
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSkill()}
                className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4F8A]"
                placeholder="Type a skill and press Enter (e.g. Power BI, Python, AWS)" />
              <button onClick={addSkill}
                className="bg-[#1B4F8A] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#133A66]">
                Add
              </button>
            </div>

            {/* Skills list */}
            {form.required_skills.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-800">
                ⚠️ No skills added yet. Extract from JD above or add manually.
              </div>
            ) : (
              <div className="space-y-2">
                {form.required_skills.map(({ skill, importance }) => (
                  <div key={skill}
                    className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
                    <span className="flex-1 text-sm font-medium text-gray-800">{skill}</span>
                    <div className="flex gap-1">
                      {(['must', 'good', 'bonus'] as const).map(opt => (
                        <button key={opt}
                          onClick={() => setImportance(skill, opt)}
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

          {/* ── Custom Instructions ── */}
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-5 space-y-3">
            <div>
              <h2 className="font-semibold text-[#1B4F8A]">🤖 Custom AI Instructions</h2>
              <p className="text-xs text-gray-400 mt-1">
                Optional hints for the AI. E.g. "Prefer product company backgrounds."
              </p>
            </div>
            <textarea value={form.custom_instructions}
              onChange={e => setForm(f => ({ ...f, custom_instructions: e.target.value }))}
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4F8A]"
              placeholder='e.g. "Prefer candidates from product companies. Penalise frequent job changes."' />
          </div>

          {/* ── Save ── */}
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
