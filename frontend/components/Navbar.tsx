'use client'
import { useRouter, usePathname } from 'next/navigation'
import { api } from '@/lib/api'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    await api.logout()
    router.push('/login')
  }

  const navLink = (href: string, label: string) => (
    <a href={href}
      className={`text-sm transition px-3 py-1.5 rounded-lg ${
        pathname.startsWith(href)
          ? 'bg-white/20 text-white font-medium'
          : 'text-blue-200 hover:text-white hover:bg-white/10'
      }`}>
      {label}
    </a>
  )

  return (
    <header className="bg-[#1B4F8A] shadow-md">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">

        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer"
          onClick={() => router.push('/dashboard')}>
          <div className="flex items-center gap-1">
            <span className="text-white font-black text-xl tracking-tight">Scor</span>
            <span className="text-[#60A5FA] font-black text-xl tracking-tight">Q</span>
          </div>
          <div className="h-4 w-px bg-blue-400/50" />
          <span className="text-blue-300 text-xs">by HYROI Solutions</span>
          <div className="h-4 w-px bg-blue-400/50" />
          <span className="text-blue-200/60 text-xs hidden md:block">
            AI-powered resume scoring
          </span>
        </div>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {navLink('/dashboard', 'Dashboard')}
          {navLink('/jobs', 'Jobs')}
          <button onClick={handleLogout}
            className="text-blue-200 hover:text-white text-sm transition px-3 py-1.5 rounded-lg hover:bg-white/10 ml-2">
            Sign out
          </button>
        </nav>
      </div>
    </header>
  )
}
