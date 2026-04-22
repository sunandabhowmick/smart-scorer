'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [signupDone, setSignupDone] = useState(false)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.login(email, password)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (signupPassword !== confirm) { setError('Passwords do not match'); return }
    if (signupPassword.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: { data: { name } }
      })
      if (error) throw error
      setSignupDone(true)
    } catch (err: any) {
      setError(err.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F2D52] via-[#1B4F8A] to-[#2E6DB5] flex flex-col items-center justify-center px-4">

      {/* Brand */}
      <div className="text-center mb-10">
        <div className="mb-3">
          <span className="text-white text-4xl font-black tracking-tight">Scor</span>
          <span className="text-[#60A5FA] text-4xl font-black tracking-tight">Q</span>
          <span className="ml-3 text-white/40 text-lg font-light">by HYROI Solutions</span>
        </div>
        <p className="text-white/60 text-sm tracking-wide">
          AI-powered resume scoring
        </p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

        {/* Tabs */}
        <div className="flex">
          {(['signin', 'signup'] as const).map(m => (
            <button key={m}
              onClick={() => { setMode(m); setError('') }}
              className={`flex-1 py-3.5 text-sm font-semibold transition-all ${
                mode === m
                  ? 'text-[#1B4F8A] bg-blue-50 border-b-2 border-[#1B4F8A]'
                  : 'text-gray-400 hover:text-gray-600 border-b border-gray-100'
              }`}>
              {m === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        <div className="px-7 py-7">

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-5 text-xs">
              {error}
            </div>
          )}

          {/* Sign In */}
          {mode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4F8A] focus:ring-2 focus:ring-blue-100 transition"
                  placeholder="you@company.com" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4F8A] focus:ring-2 focus:ring-blue-100 transition"
                  placeholder="••••••••" required />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-[#1B4F8A] text-white py-3 rounded-lg font-semibold text-sm hover:bg-[#133A66] disabled:opacity-50 transition mt-2">
                {loading ? 'Signing in...' : 'Sign In →'}
              </button>
            </form>
          )}

          {/* Sign Up */}
          {mode === 'signup' && (
            <>
              {signupDone ? (
                <div className="text-center py-6">
                  <div className="text-5xl mb-4">🎉</div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Welcome to ScorQ!</h3>
                  <p className="text-gray-400 text-sm mb-6">Your account is ready.</p>
                  <button
                    onClick={() => { setMode('signin'); setSignupDone(false); setError('') }}
                    className="w-full bg-[#1B4F8A] text-white py-3 rounded-lg font-semibold text-sm hover:bg-[#133A66] transition">
                    Sign In Now →
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Full Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4F8A] focus:ring-2 focus:ring-blue-100 transition"
                      placeholder="Your full name" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email</label>
                    <input type="email" value={signupEmail} onChange={e => setSignupEmail(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4F8A] focus:ring-2 focus:ring-blue-100 transition"
                      placeholder="you@company.com" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Password</label>
                    <input type="password" value={signupPassword} onChange={e => setSignupPassword(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4F8A] focus:ring-2 focus:ring-blue-100 transition"
                      placeholder="Min 6 characters" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Confirm Password</label>
                    <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4F8A] focus:ring-2 focus:ring-blue-100 transition"
                      placeholder="Repeat password" required />
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full bg-[#1B4F8A] text-white py-3 rounded-lg font-semibold text-sm hover:bg-[#133A66] disabled:opacity-50 transition mt-2">
                    {loading ? 'Creating account...' : 'Create Account →'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>

      <p className="text-white/30 text-xs mt-8">© 2024 HYROI Solutions</p>
    </div>
  )
}
