'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } }
      })
      if (error) throw error
      setDone(true)
    } catch (err: any) {
      setError(err.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F0F4F8]">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md overflow-hidden">
        <div className="bg-[#1B4F8A] px-8 py-5 flex items-center gap-4">
          <Image src="/assets/hyroi-logo.png" alt="HYROI" width={40} height={40}
            className="rounded-lg bg-white p-0.5" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-lg">HYROI</span>
              <span className="text-blue-300 text-sm">Solutions</span>
              <span className="text-blue-400 text-sm">|</span>
              <span className="text-white font-bold text-lg">Scorq</span>
            </div>
            <p className="text-blue-200 text-xs">AI-powered resume scoring</p>
          </div>
        </div>

        <div className="px-8 py-8">
          {done ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-4">✅</div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Account created!</h2>
              <p className="text-gray-500 text-sm mb-6">You can now sign in.</p>
              <button onClick={() => router.push('/login')}
                className="w-full bg-[#1B4F8A] text-white py-2.5 rounded-lg font-medium text-sm hover:bg-[#133A66]">
                Go to Login
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-gray-800 text-xl font-semibold mb-6">Create account</h2>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4F8A]"
                    placeholder="Your name" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4F8A]"
                    placeholder="you@company.com" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4F8A]"
                    placeholder="Min 6 characters" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4F8A]"
                    placeholder="Repeat password" required />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-[#1B4F8A] text-white py-2.5 rounded-lg font-medium text-sm hover:bg-[#133A66] disabled:opacity-50">
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>
              <p className="text-center text-sm text-gray-500 mt-6">
                Already have an account?{' '}
                <a href="/login" className="text-[#1B4F8A] hover:underline font-medium">Sign in</a>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
