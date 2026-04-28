'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'
import { Plus, Trash2, Upload, Pencil } from 'lucide-react'

export default function JobsPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getJobs().then(setJobs).finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Archive this job?')) return
    await api.deleteJob(id)
    setJobs(jobs.filter(j => j.id !== id))
  }

  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Job Descriptions</h1>
          <button onClick={() => router.push('/jobs/new')}
            className="flex items-center gap-2 bg-[#1B4F8A] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#133A66] transition">
            <Plus size={16} /> New Job
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
            <p className="text-gray-400 mb-4">No jobs yet</p>
            <button onClick={() => router.push('/jobs/new')}
              className="bg-[#1B4F8A] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#133A66]">
              Create your first JD
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {jobs.map(job => (
              <div key={job.id}
                className="bg-white rounded-xl border border-gray-200 px-6 py-5 flex items-center justify-between hover:shadow-sm transition cursor-pointer"
                onClick={() => router.push(`/jobs/${job.id}`)}>
                <div>
                  <h3 className="font-semibold text-gray-900">{job.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {job.experience_min}–{job.experience_max} years ·{' '}
                    {job.education_required || 'Any education'} ·{' '}
                    {(job.required_skills || []).length} skills
                    {job.minimum_technical_score && (
                      <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                        Min tech: {job.minimum_technical_score}%
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={e => { e.stopPropagation(); router.push(`/jobs/${job.id}`) }}
                    className="flex items-center gap-1.5 text-[#1B4F8A] border border-[#1B4F8A] px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-50 transition">
                    <Upload size={13} /> Score Resumes
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); router.push(`/jobs/${job.id}/edit`) }}
                    className="flex items-center gap-1.5 text-gray-600 border border-gray-300 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-50 transition">
                    <Pencil size={13} /> Edit
                  </button>
                  <button
                    onClick={e => handleDelete(job.id, e)}
                    className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
