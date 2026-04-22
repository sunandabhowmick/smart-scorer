'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'
import { Briefcase, Users, TrendingUp, Plus } from 'lucide-react'

export default function Dashboard() {
  const router = useRouter()
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push('/login')
    })
    api.getJobs().then(setJobs).finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">AI-powered resume scoring</p>
          </div>
          <button
            onClick={() => router.push('/jobs/new')}
            className="flex items-center gap-2 bg-[#1B4F8A] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#133A66] transition"
          >
            <Plus size={16} /> New Job
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Active Jobs', value: jobs.length, icon: Briefcase, color: 'text-blue-600' },
            { label: 'Total Scored', value: '—', icon: Users, color: 'text-green-600' },
            { label: 'Avg Score', value: '—', icon: TrendingUp, color: 'text-purple-600' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
                </div>
                <Icon size={28} className={color} />
              </div>
            </div>
          ))}
        </div>

        {/* Jobs list */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Active Jobs</h2>
            <a href="/jobs" className="text-[#1B4F8A] text-sm hover:underline">View all</a>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center text-gray-400">Loading...</div>
          ) : jobs.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400">
              No jobs yet.{' '}
              <a href="/jobs/new" className="text-[#1B4F8A] hover:underline">Create your first JD</a>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {jobs.map(job => (
                <div key={job.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/jobs/${job.id}`)}
                >
                  <div>
                    <p className="font-medium text-gray-900">{job.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {job.experience_min}–{job.experience_max} yrs ·{' '}
                      {(job.required_skills || []).length} required skills
                    </p>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                    Active
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
