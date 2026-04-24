'use client'
import { useState } from 'react'
import { ScoreResult } from '@/lib/types'
import { ChevronDown, ChevronUp, Trash2, Download } from 'lucide-react'
import { downloadScorecard } from '@/lib/scorecard-pdf'

interface Props {
  result: ScoreResult
  rank: number
  onDelete: (id: string) => void
}

const CAT_LABELS: Record<string, string> = {
  technical:  'Technical Skills',
  experience: 'Experience',
  education:  'Education',
  soft_skills:'Soft Skills',
  stability:  'Stability',
}

const CAT_ICONS: Record<string, string> = {
  technical:  '💻',
  experience: '📅',
  education:  '🎓',
  soft_skills:'🤝',
  stability:  '📊',
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div className={`h-2 rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-600 w-8 text-right">{score}%</span>
    </div>
  )
}

function getBarColor(score: number) {
  return score >= 75 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-400' : 'bg-red-400'
}

function getScoreStyle(score: number) {
  if (score >= 75) return 'border-green-400 text-green-700 bg-green-50'
  if (score >= 50) return 'border-yellow-400 text-yellow-700 bg-yellow-50'
  return 'border-red-400 text-red-700 bg-red-50'
}

function RecBadge({ rec }: { rec: string }) {
  const cfg: Record<string, { cls: string; label: string }> = {
    SHORTLIST: { cls: 'bg-green-100 text-green-800 border-green-200',  label: '✅ Shortlist' },
    REVIEW:    { cls: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: '⚠️ Review' },
    PASS:      { cls: 'bg-red-100 text-red-800 border-red-200',        label: '❌ Pass' },
  }
  const { cls, label } = cfg[rec] || cfg.PASS
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${cls}`}>
      {label}
    </span>
  )
}

export default function ScoreCard({ result, rank, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false)
  const candidate = result.candidates || {}
  const cats = result.category_scores || {}

  return (
    <div className={`bg-white rounded-xl border-2 overflow-hidden transition-shadow hover:shadow-md ${
      result.recommendation === 'SHORTLIST' ? 'border-green-200' :
      result.recommendation === 'REVIEW'    ? 'border-yellow-200' : 'border-gray-200'
    }`}>

      {/* Summary Row */}
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition"
        onClick={() => setExpanded(!expanded)}>

        {/* Rank */}
        <div className="bg-[#1B4F8A] text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center shrink-0">
          {rank}
        </div>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate text-sm">
            {(candidate as any).name || 'Unknown'}
          </p>
          <p className="text-xs text-gray-400 truncate">
            {(candidate as any).email || '—'}
          </p>
        </div>

        {/* Score ring */}
        <div className={`w-12 h-12 rounded-full border-4 flex flex-col items-center justify-center shrink-0 ${getScoreStyle(result.overall_score)}`}>
          <span className="text-sm font-bold leading-none">{result.overall_score}</span>
          <span className="text-xs leading-none">%</span>
        </div>

        {/* Rec badge */}
        <RecBadge rec={result.recommendation} />

        {/* Mini bars */}
        <div className="hidden lg:flex flex-col gap-1 w-36 shrink-0">
          {Object.entries(cats).slice(0, 3).map(([key, cat]) => (
            <div key={key} className="flex items-center gap-1">
              <span className="text-xs text-gray-400 w-8 truncate capitalize">
                {key === 'soft_skills' ? 'Soft' : key.slice(0, 4)}
              </span>
              <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                <div className={`h-1.5 rounded-full ${getBarColor((cat as any).score)}`}
                  style={{ width: `${(cat as any).score}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={e => { e.stopPropagation(); downloadScorecard(result) }}
            className="text-blue-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition"
            title="Download Scorecard"
          >
            <Download size={15} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete(result.id) }}
            className="text-red-300 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition"
            title="Delete"
          >
            <Trash2 size={15} />
          </button>
          <div className="text-gray-300 ml-1">
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </div>
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="border-t-2 border-dashed border-gray-100 bg-gray-50">

          {/* Contact */}
          <div className="flex items-center gap-6 px-6 py-3 bg-white border-b border-gray-100 text-sm text-gray-500">
            {(candidate as any).email && <span>📧 {(candidate as any).email}</span>}
            {(candidate as any).phone && <span>📞 {(candidate as any).phone}</span>}
            <span className="ml-auto text-xs text-gray-400">
              {result.model_used} · {result.tokens_used} tokens
            </span>
          </div>

          <div className="px-6 py-5 space-y-5">

            {/* Score breakdown */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Score Breakdown
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(cats).map(([key, cat]) => (
                  <div key={key} className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{CAT_ICONS[key]}</span>
                        <span className="text-sm font-semibold text-gray-800">
                          {CAT_LABELS[key] || key}
                        </span>
                      </div>
                      <span className={`text-sm font-bold ${
                        (cat as any).score >= 75 ? 'text-green-600' :
                        (cat as any).score >= 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {(cat as any).score}%
                      </span>
                    </div>
                    <ScoreBar score={(cat as any).score} color={getBarColor((cat as any).score)} />
                    <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                      {(cat as any).reasoning}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {result.matched_skills?.length > 0 && (
                <div className="bg-green-50 rounded-xl border border-green-100 p-4">
                  <h4 className="text-xs font-semibold text-green-700 mb-2">
                    ✅ Matched Skills ({result.matched_skills.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {result.matched_skills.map(s => (
                      <span key={s} className="bg-green-100 text-green-800 text-xs px-2.5 py-1 rounded-full font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {result.missing_skills?.length > 0 && (
                <div className="bg-red-50 rounded-xl border border-red-100 p-4">
                  <h4 className="text-xs font-semibold text-red-700 mb-2">
                    ❌ Missing Skills ({result.missing_skills.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {result.missing_skills.map(s => (
                      <span key={s} className="bg-red-100 text-red-800 text-xs px-2.5 py-1 rounded-full font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* AI Summary */}
            {result.ai_reasoning && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <h4 className="text-xs font-semibold text-blue-700 mb-2">💡 AI Assessment</h4>
                <p className="text-sm text-blue-900 leading-relaxed">{result.ai_reasoning}</p>
              </div>
            )}

            {/* Highlights + Red flags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {result.highlights?.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h4 className="text-xs font-semibold text-gray-600 mb-2">⭐ Highlights</h4>
                  <ul className="space-y-1">
                    {result.highlights.map((h, i) => (
                      <li key={i} className="text-xs text-gray-700 flex gap-2">
                        <span className="text-green-500">•</span>{h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.red_flags?.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h4 className="text-xs font-semibold text-gray-600 mb-2">⚠️ Red Flags</h4>
                  <ul className="space-y-1">
                    {result.red_flags.map((f, i) => (
                      <li key={i} className="text-xs text-gray-700 flex gap-2">
                        <span className="text-red-400">•</span>{f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Download button inside expanded */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => downloadScorecard(result)}
                className="flex items-center gap-2 bg-[#1B4F8A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#133A66] transition"
              >
                <Download size={15} /> Download Scorecard
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
