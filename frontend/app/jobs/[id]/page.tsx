'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'
import ScoreCard from '@/components/ScoreCard'
import BatchSummary from '@/components/BatchSummary'
import { Upload, Download, Copy } from 'lucide-react'

export default function JobDetailPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params.id as string

  const [job, setJob] = useState<any>(null)
  const [results, setResults] = useState<any[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [scoring, setScoring] = useState(false)
  const [filter, setFilter] = useState('ALL')
  const [toast, setToast] = useState('')

  useEffect(() => {
    api.getJobs().then(jobs => {
      const found = jobs.find((j: any) => j.id === jobId)
      if (found) setJob(found)
    })
    loadResults()
  }, [jobId])

  const loadResults = () => {
    api.getResults(jobId).then(setResults)
  }

  const handleFiles = (accepted: File[]) => {
    setFiles(prev => [...prev, ...accepted])
  }

  const handleScore = async () => {
    if (!files.length) return
    setScoring(true)
    try {
      const res = await api.scoreBatch(jobId, files)
      setFiles([])
      loadResults()
      showToast(`✅ Scored ${res.scored} resume(s)`)
    } catch (e: any) {
      showToast('❌ ' + (e.message || 'Scoring failed'))
    } finally {
      setScoring(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this result?')) return
    await api.deleteResult(id)
    setResults(r => r.filter(x => x.id !== id))
  }

  const handleCopyAll = () => {
    const headers = ['Rank','Name','Email','Score','Status',
      'Technical','Experience','Education','Soft Skills','Stability',
      'Matched Skills','Missing Skills','AI Summary']
    const rows = filtered.map((r, i) => [
      i + 1,
      r.candidates?.name || 'Unknown',
      r.candidates?.email || '',
      r.overall_score + '%',
      r.recommendation,
      (r.category_scores?.technical?.score || 0) + '%',
      (r.category_scores?.experience?.score || 0) + '%',
      (r.category_scores?.education?.score || 0) + '%',
      (r.category_scores?.soft_skills?.score || 0) + '%',
      (r.category_scores?.stability?.score || 0) + '%',
      (r.matched_skills || []).join(', '),
      (r.missing_skills || []).join(', '),
      r.ai_reasoning || '',
    ].join('\t'))
    navigator.clipboard.writeText([headers.join('\t'), ...rows].join('\n'))
    showToast('📋 Copied — paste into Excel or Google Sheets')
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const filtered = filter === 'ALL' ? results
    : results.filter(r => r.recommendation === filter)

  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      <Navbar />

      {toast && (
        <div className="fixed top-4 right-4 bg-gray-900 text-white px-5 py-3 rounded-xl text-sm shadow-lg z-50 flex items-center gap-2">
          {toast}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <button onClick={() => router.push('/jobs')}
              className="text-gray-400 hover:text-gray-600 text-sm flex items-center gap-1 mb-1">
              ← Back to Jobs
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {job?.title || 'Loading...'}
            </h1>
            {job && (
              <p className="text-sm text-gray-500 mt-0.5">
                {job.experience_min}–{job.experience_max} yrs experience ·{' '}
                {job.education_required || 'Any education'} ·{' '}
                {(job.required_skills || []).length} required skills
              </p>
            )}
          </div>
        </div>

        {/* Upload zone */}
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
          <h2 className="font-semibold text-[#1B4F8A] mb-4 flex items-center gap-2">
            <Upload size={18} /> Upload Resumes
          </h2>

          <div
            className="border-2 border-dashed border-gray-200 rounded-xl py-10 text-center cursor-pointer hover:border-[#1B4F8A] hover:bg-blue-50 transition group"
            onClick={() => document.getElementById('file-input')?.click()}
            onDrop={e => { e.preventDefault(); handleFiles(Array.from(e.dataTransfer.files)) }}
            onDragOver={e => e.preventDefault()}
          >
            <div className="text-4xl mb-2">📁</div>
            <p className="text-gray-500 text-sm font-medium group-hover:text-[#1B4F8A]">
              Drag & drop resumes here or click to browse
            </p>
            <p className="text-gray-400 text-xs mt-1">PDF and DOCX supported · Multiple files allowed</p>
            <input id="file-input" type="file" multiple accept=".pdf,.docx"
              className="hidden"
              onChange={e => handleFiles(Array.from(e.target.files || []))} />
          </div>

          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-gray-700">
                {files.length} file{files.length > 1 ? 's' : ''} ready to score
              </p>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {files.map((f, i) => (
                  <div key={i}
                    className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                    <span className="text-gray-700 flex items-center gap-2">
                      <span>📄</span> {f.name}
                      <span className="text-gray-400 text-xs">
                        ({(f.size / 1024).toFixed(0)} KB)
                      </span>
                    </span>
                    <button onClick={() => setFiles(files.filter((_, j) => j !== i))}
                      className="text-red-400 hover:text-red-600 text-xs">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={handleScore} disabled={scoring}
                className="w-full mt-2 bg-[#1B4F8A] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#133A66] disabled:opacity-50 flex items-center justify-center gap-2 transition">
                {scoring
                  ? <><span className="animate-spin">⏳</span> Scoring resumes...</>
                  : `🔍 Score ${files.length} Resume${files.length > 1 ? 's' : ''} with AI`}
              </button>
            </div>
          )}
        </div>

        {/* Batch Summary */}
        {results.length > 0 && <BatchSummary results={results} />}

        {/* Results */}
        {results.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200">

            {/* Results toolbar */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="font-semibold text-gray-900">
                  Candidates
                  <span className="text-gray-400 font-normal ml-1 text-sm">
                    ({filtered.length} of {results.length})
                  </span>
                </h2>
                <div className="flex gap-1">
                  {[
                    { key: 'ALL',       label: 'All' },
                    { key: 'SHORTLIST', label: '✅ Shortlist' },
                    { key: 'REVIEW',    label: '⚠️ Review' },
                    { key: 'PASS',      label: '❌ Pass' },
                  ].map(({ key, label }) => (
                    <button key={key} onClick={() => setFilter(key)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                        filter === key
                          ? 'bg-[#1B4F8A] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <button onClick={handleCopyAll}
                  className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50 transition">
                  <Copy size={13} /> Copy All
                </button>
                <a href={api.getExportUrl(jobId)} target="_blank"
                  className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50 transition">
                  <Download size={13} /> Export Excel
                </a>
                <a href={api.getExportUrl(jobId, true)} target="_blank"
                  className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-700 transition">
                  <Download size={13} /> Shortlisted Only
                </a>
              </div>
            </div>

            {/* Score cards */}
            <div className="p-4 space-y-3">
              {filtered.length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">
                  No candidates match this filter
                </p>
              ) : (
                filtered.map((result, i) => (
                  <ScoreCard
                    key={result.id}
                    result={result}
                    rank={i + 1}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
