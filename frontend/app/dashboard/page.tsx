'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'
import { SkeletonStats, SkeletonJobCard } from '@/components/Skeleton'
import { Briefcase, Users, TrendingUp, Plus, Upload } from 'lucide-react'

export default function Dashboard() {
  const router = useRouter()
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [totalScored, setTotalScored] = useState(0)
  const [avgScore, setAvgScore] = useState(0)

  const loadData = useCallback(async () => {
    try {
      const [jobsData, resultsData] = await Promise.all([
        api.getJobs(),
        api.getResults(),
      ])
      setJobs(jobsData)
      if (resultsData.length > 0) {
        setTotalScored(resultsData.length)
        const avg = Math.round(
          resultsData.reduce((a: number, r: any) => a + r.overall_score, 0) / resultsData.length
        )
        setAvgScore(avg)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push('/login')
      else loadData()
    })
  }, [])

  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 text-sm mt-0.5">Welcome back — ready to score some resumes?</p>
          </div>
          <button onClick={() => router.push('/jobs/new')}
            className="flex items-center gap-2 bg-[#1B4F8A] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#133A66] transition shadow-sm">
            <Plus size={16} /> New Job
          </button>
        </div>

        {/* Stats */}
        {loading ? <SkeletonStats /> : (
          <div className="grid grid-cols-3 gap-6 mb-8">
            {[
              { label: 'Active Jobs',   value: jobs.length,              icon: Briefcase,  color: 'text-blue-600',   bg: 'bg-blue-50'   },
              { label: 'Total Scored',  value: totalScored,              icon: Users,      color: 'text-green-600',  bg: 'bg-green-50'  },
              { label: 'Average Score', value: avgScore ? avgScore + '%' : '—', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 px-6 py-5 hover:shadow-sm transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
                  </div>
                  <div className={`${bg} p-3 rounded-xl`}>
                    <Icon size={24} className={color} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Jobs */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Active Jobs</h2>
            <a href="/jobs" className="text-[#1B4F8A] text-sm hover:underline font-medium">
              View all →
            </a>
          </div>

          {loading ? (
            <div className="p-4 space-y-3">
              {[1,2,3].map(i => <SkeletonJobCard key={i} />)}
            </div>
          ) : jobs.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-gray-500 text-sm mb-4">No jobs yet. Create your first JD to start scoring.</p>
              <button onClick={() => router.push('/jobs/new')}
                className="bg-[#1B4F8A] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#133A66]">
                + Create Job
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {jobs.slice(0, 5).map(job => (
                <div key={job.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => router.push(`/jobs/${job.id}`)}>
                    <p className="font-medium text-gray-900">{job.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {job.experience_min}–{job.experience_max} yrs ·{' '}
                      {(job.required_skills || []).length} skills
                    </p>
                  </div>
                  <button
                    onClick={() => router.push(`/jobs/${job.id}`)}
                    className="flex items-center gap-1.5 text-[#1B4F8A] border border-[#1B4F8A] px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-50 transition ml-4">
                    <Upload size={13} /> Score Resumes
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
