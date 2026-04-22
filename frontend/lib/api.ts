import axios from 'axios'
import { supabase } from './supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function getToken(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token || ''
}

export const api = {
  // Auth
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },

  async logout() {
    await supabase.auth.signOut()
  },

  // Jobs
  async getJobs() {
    const token = await getToken()
    const res = await axios.get(`${API_URL}/api/v1/jobs`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.data.jobs
  },

  async createJob(data: any) {
    const token = await getToken()
    const res = await axios.post(`${API_URL}/api/v1/jobs`, data, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.data.job
  },

  async updateJob(id: string, data: any) {
    const token = await getToken()
    const res = await axios.put(`${API_URL}/api/v1/jobs/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.data.job
  },

  async deleteJob(id: string) {
    const token = await getToken()
    await axios.delete(`${API_URL}/api/v1/jobs/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
  },

  // Scoring
  async scoreBatch(jobId: string, files: File[], batchName: string = '') {
    const token = await getToken()
    const form = new FormData()
    form.append('job_id', jobId)
    form.append('batch_name', batchName)
    files.forEach(f => form.append('files', f))
    const res = await axios.post(`${API_URL}/api/v1/scoring/batch`, form, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.data
  },

  // Results
  async getResults(jobId?: string, recommendation?: string) {
    const token = await getToken()
    const params: any = {}
    if (jobId) params.job_id = jobId
    if (recommendation) params.recommendation = recommendation
    const res = await axios.get(`${API_URL}/api/v1/results`, {
      headers: { Authorization: `Bearer ${token}` },
      params
    })
    return res.data.results
  },

  async deleteResult(id: string) {
    const token = await getToken()
    await axios.delete(`${API_URL}/api/v1/results/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
  },

  getExportUrl(jobId?: string, shortlistedOnly = false) {
    const params = new URLSearchParams()
    if (jobId) params.set('job_id', jobId)
    if (shortlistedOnly) params.set('shortlisted_only', 'true')
    return `${API_URL}/api/v1/results/export/excel?${params}`
  }
}
