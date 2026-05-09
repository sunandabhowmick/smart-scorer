'use client'
import { useState, useRef } from 'react'
import { Trash2, Download, ImageIcon, ChevronDown, ChevronUp } from 'lucide-react'
import { downloadScorecard } from '@/lib/scorecard-pdf'
import { captureScorecard } from '@/lib/capture-scorecard'

interface CategoryScore {
  score: number | null
  reasoning?: string
  certifications?: string[]
}

interface ScoreResult {
  id: string
  overall_score: number
  recommendation: string
  category_scores: {
    technical:  CategoryScore
    experience: CategoryScore
    education:  CategoryScore
    stability:  CategoryScore
  }
  matched_skills:  string[]
  missing_skills:  string[]
  partial_skills?: string[]
  highlights:      string[]
  red_flags:       string[]
  ai_reasoning:    string
  model_used:      string
  tokens_used:     number
  candidates?:     any
}

interface Props {
  result:   ScoreResult
  rank:     number
  onDelete: (id: string) => void
}

const CATS = [
  { key: 'technical',  label: 'Tech',       full: 'Technical Skills', icon: '💻', color: '#1B4F8A', bg: '#EFF6FF', border: '#BFDBFE' },
  { key: 'experience', label: 'Exp',        full: 'Experience',       icon: '📅', color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
  { key: 'education',  label: 'Edu',        full: 'Education',        icon: '🎓', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
  { key: 'stability',  label: 'Stab',       full: 'Stability',        icon: '📊', color: '#EA580C', bg: '#FFF7ED', border: '#FED7AA' },
]

function scoreColor(score: number | null): string {
  if (score === null) return '#9CA3AF'
  if (score >= 75) return '#16A34A'
  if (score >= 50) return '#D97706'
  return '#DC2626'
}

function scoreBg(score: number | null): string {
  if (score === null) return '#F9FAFB'
  if (score >= 75) return '#F0FDF4'
  if (score >= 50) return '#FFFBEB'
  return '#FEF2F2'
}

function scoreBorder(score: number | null): string {
  if (score === null) return '#E5E7EB'
  if (score >= 75) return '#86EFAC'
  if (score >= 50) return '#FCD34D'
  return '#FCA5A5'
}

// ── Signal Block — the 4 coloured boxes ────────────────────────────────────
function SignalBlock({ cat, score }: { cat: typeof CATS[0]; score: number | null }) {
  const c = scoreColor(score)
  const bg = scoreBg(score)
  const border = scoreBorder(score)

  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl px-3 py-2.5 min-w-[64px] transition-all"
      style={{ backgroundColor: bg, border: `1.5px solid ${border}` }}>
      <span className="text-xs font-semibold mb-0.5" style={{ color: cat.color }}>
        {cat.label}
      </span>
      <span className="text-base font-bold leading-none" style={{ color: c }}>
        {score !== null ? `${score}%` : '—'}
      </span>
      {score !== null && (
        <div className="w-full mt-1.5 bg-white rounded-full overflow-hidden" style={{ height: 3 }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${score}%`, backgroundColor: c }}
          />
        </div>
      )}
    </div>
  )
}

// ── Full Score Bar ──────────────────────────────────────────────────────────
function ScoreBar({ score }: { score: number | null }) {
  const c = scoreColor(score)
  if (score === null) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-gray-100 rounded-full" />
        <span className="text-sm font-semibold text-gray-400 w-10 text-right">—</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-2 rounded-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: c }}
        />
      </div>
      <span className="text-sm font-bold w-10 text-right" style={{ color: c }}>
        {score}%
      </span>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function ScoreCard({ result, rank, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [copying,  setCopying]  = useState(false)
  const [copyDone, setCopyDone] = useState(false)
  const detailRef = useRef<HTMLDivElement>(null)

  const candidate = result.candidates || {}
  const cats      = result.category_scores || {}
  const techScore = cats.technical?.score ?? null

  const scores: Record<string, number | null> = {
    technical:  cats.technical?.score  ?? null,
    experience: cats.experience?.score ?? null,
    education:  cats.education?.score  ?? null,
    stability:  cats.stability?.score  ?? null,
  }

  const handleCopyImage = async () => {
    if (!detailRef.current) return
    setCopying(true)
    try {
      await captureScorecard(detailRef.current, (candidate as any).name || 'candidate')
      setCopyDone(true)
      setTimeout(() => setCopyDone(false), 3000)
    } catch (e) {
      console.error(e)
    } finally {
      setCopying(false)
    }
  }

  return (
    <div className={`bg-white rounded-2xl overflow-hidden transition-all duration-200 ${
      expanded
        ? 'shadow-lg ring-1 ring-[#1B4F8A]/20'
        : 'shadow-sm hover:shadow-md border border-gray-100'
    }`}>

      {/* ── Collapsed Row ── */}
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}>

        {/* Rank + Technical Score — left anchor */}
        <div className="flex flex-col items-center shrink-0">
          <div className="text-xs font-bold text-gray-400 mb-1">#{rank}</div>
          <div
            className="w-14 h-14 rounded-xl flex flex-col items-center justify-center shadow-sm"
            style={{
              backgroundColor: scoreBg(techScore),
              border: `2px solid ${scoreBorder(techScore)}`,
            }}>
            <span className="text-xl font-black leading-none" style={{ color: scoreColor(techScore) }}>
              {techScore !== null ? techScore : '—'}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5" style={{ color: scoreColor(techScore) }}>
              TECH
            </span>
          </div>
        </div>

        {/* Candidate info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">
            {(candidate as any).name || 'Unknown Candidate'}
          </p>
          <p className="text-xs text-gray-400 truncate mt-0.5">
            {(candidate as any).email || '—'}
          </p>
          {/* Matched skills preview */}
          {result.matched_skills?.length > 0 && (
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {result.matched_skills.slice(0, 4).map(s => (
                <span key={s}
                  className="text-[10px] bg-green-50 text-green-700 border border-green-100 px-1.5 py-0.5 rounded-full font-medium">
                  {s}
                </span>
              ))}
              {result.matched_skills.length > 4 && (
                <span className="text-[10px] text-gray-400 px-1.5 py-0.5">
                  +{result.matched_skills.length - 4} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Signal blocks — the 4 coloured boxes */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          {CATS.map(cat => (
            <SignalBlock key={cat.key} cat={cat} score={scores[cat.key]} />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0 ml-2">
          <button
            onClick={e => { e.stopPropagation(); downloadScorecard(result) }}
            className="p-2 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
            title="Download PDF">
            <Download size={14} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete(result.id) }}
            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
            title="Delete">
            <Trash2 size={14} />
          </button>
          <div className="p-2 text-gray-300">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </div>
      </div>

      {/* ── Expanded Detail ── */}
      {expanded && (
        <div className="border-t border-dashed border-gray-100">

          {/* Contact strip */}
          <div className="flex items-center gap-6 px-6 py-3 bg-gray-50/60 text-xs text-gray-500 border-b border-gray-100">
            {(candidate as any).email && <span>📧 {(candidate as any).email}</span>}
            {(candidate as any).phone && <span>📞 {(candidate as any).phone}</span>}
            <span className="ml-auto opacity-60">{result.model_used} · {result.tokens_used} tokens</span>
          </div>

          {/* Capturable area */}
          <div ref={detailRef} className="p-6 space-y-5 bg-white">

            {/* Score breakdown — full bars */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Score Breakdown
              </p>
              <div className="grid grid-cols-2 gap-3">
                {CATS.map(cat => {
                  const catData = cats[cat.key as keyof typeof cats]
                  const score   = catData?.score ?? null
                  const certs   = (catData as any)?.certifications || []

                  return (
                    <div key={cat.key}
                      className="rounded-xl p-4 transition-all"
                      style={{
                        backgroundColor: cat.bg,
                        border: `1px solid ${cat.border}`,
                      }}>
                      {/* Header */}
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{cat.icon}</span>
                          <span className="text-sm font-semibold text-gray-800">
                            {cat.full}
                          </span>
                        </div>
                        <span className="text-sm font-bold" style={{ color: scoreColor(score) }}>
                          {score !== null ? `${score}%` : '—'}
                        </span>
                      </div>

                      {/* Bar */}
                      <ScoreBar score={score} />

                      {/* Reasoning */}
                      {catData?.reasoning && (
                        <p className="text-xs text-gray-500 mt-2.5 leading-relaxed">
                          {catData.reasoning}
                        </p>
                      )}
                      {score === null && !catData?.reasoning && (
                        <p className="text-xs text-gray-400 mt-2 italic">
                          Not scored for this role.
                        </p>
                      )}

                      {/* Certifications */}
                      {certs.length > 0 && (
                        <div className="mt-2.5 pt-2.5 border-t border-white/60">
                          <p className="text-[10px] font-semibold text-purple-600 uppercase tracking-wide mb-1.5">
                            🏅 Certifications
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {certs.map((c: string) => (
                              <span key={c}
                                className="text-[10px] bg-white text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Skills row */}
            <div className="grid grid-cols-3 gap-3">
              {result.matched_skills?.length > 0 && (
                <div className="bg-green-50 rounded-xl border border-green-100 p-4">
                  <p className="text-xs font-semibold text-green-700 mb-2">
                    ✅ Matched ({result.matched_skills.length})
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {result.matched_skills.map(s => (
                      <span key={s}
                        className="text-xs bg-white text-green-800 border border-green-200 px-2.5 py-1 rounded-full font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(result as any).partial_skills?.length > 0 && (
                <div className="bg-yellow-50 rounded-xl border border-yellow-100 p-4">
                  <p className="text-xs font-semibold text-yellow-700 mb-2">
                    🔄 Partial ({(result as any).partial_skills.length})
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {(result as any).partial_skills.map((s: string) => (
                      <span key={s}
                        className="text-xs bg-white text-yellow-800 border border-yellow-200 px-2.5 py-1 rounded-full font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.missing_skills?.length > 0 && (
                <div className="bg-red-50 rounded-xl border border-red-100 p-4">
                  <p className="text-xs font-semibold text-red-700 mb-2">
                    ❌ Missing ({result.missing_skills.length})
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {result.missing_skills.map(s => (
                      <span key={s}
                        className="text-xs bg-white text-red-800 border border-red-200 px-2.5 py-1 rounded-full font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Highlights + Red Flags */}
            {(result.highlights?.length > 0 || result.red_flags?.length > 0) && (
              <div className="grid grid-cols-2 gap-3">
                {result.highlights?.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <p className="text-xs font-semibold text-gray-500 mb-2">⭐ Highlights</p>
                    <ul className="space-y-1.5">
                      {result.highlights.map((h, i) => (
                        <li key={i} className="text-xs text-gray-700 flex gap-2 leading-relaxed">
                          <span className="text-green-500 shrink-0 mt-0.5">▸</span>{h}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.red_flags?.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <p className="text-xs font-semibold text-gray-500 mb-2">⚠️ Red Flags</p>
                    <ul className="space-y-1.5">
                      {result.red_flags.map((f, i) => (
                        <li key={i} className="text-xs text-gray-700 flex gap-2 leading-relaxed">
                          <span className="text-red-400 shrink-0 mt-0.5">▸</span>{f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* AI Assessment */}
            {result.ai_reasoning && (
              <div className="rounded-xl p-4"
                style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #F5F3FF 100%)', border: '1px solid #BFDBFE' }}>
                <p className="text-xs font-semibold text-blue-700 mb-2">💡 AI Assessment</p>
                <p className="text-sm text-gray-700 leading-relaxed">{result.ai_reasoning}</p>
              </div>
            )}
          </div>

          {/* Action bar */}
          <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              {result.matched_skills?.length || 0} skills matched ·{' '}
              {result.missing_skills?.length || 0} missing
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleCopyImage}
                disabled={copying}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border transition ${
                  copyDone
                    ? 'bg-green-100 text-green-700 border-green-200'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                } disabled:opacity-50`}>
                {copying ? '⏳' : copyDone ? '✅ Copied!' : <><ImageIcon size={12} /> Copy Image</>}
              </button>
              <button
                onClick={() => downloadScorecard(result)}
                className="flex items-center gap-2 bg-[#1B4F8A] text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-[#133A66] transition">
                <Download size={12} /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
