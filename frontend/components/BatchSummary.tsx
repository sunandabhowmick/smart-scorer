'use client'

interface Props {
  results: any[]
}

export default function BatchSummary({ results }: Props) {
  if (!results.length) return null

  const total = results.length
  const shortlisted = results.filter(r => r.recommendation === 'SHORTLIST').length
  const review = results.filter(r => r.recommendation === 'REVIEW').length
  const pass = results.filter(r => r.recommendation === 'PASS').length
  const avgScore = Math.round(results.reduce((a, r) => a + r.overall_score, 0) / total)
  const topScore = Math.max(...results.map(r => r.overall_score))

  // Score distribution buckets
  const buckets = [
    { label: '90-100', count: results.filter(r => r.overall_score >= 90).length, color: 'bg-green-500' },
    { label: '75-89',  count: results.filter(r => r.overall_score >= 75 && r.overall_score < 90).length, color: 'bg-green-400' },
    { label: '60-74',  count: results.filter(r => r.overall_score >= 60 && r.overall_score < 75).length, color: 'bg-yellow-400' },
    { label: '45-59',  count: results.filter(r => r.overall_score >= 45 && r.overall_score < 60).length, color: 'bg-orange-400' },
    { label: '0-44',   count: results.filter(r => r.overall_score < 45).length, color: 'bg-red-400' },
  ]
  const maxBucket = Math.max(...buckets.map(b => b.count), 1)

  return (
    <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
      <h3 className="font-semibold text-gray-900 mb-4">Batch Summary</h3>

      {/* Stat cards */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total',       value: total,      color: 'text-gray-900',  bg: 'bg-gray-50'   },
          { label: 'Shortlisted', value: shortlisted, color: 'text-green-700', bg: 'bg-green-50'  },
          { label: 'Review',      value: review,      color: 'text-yellow-700',bg: 'bg-yellow-50' },
          { label: 'Pass',        value: pass,        color: 'text-red-700',   bg: 'bg-red-50'    },
          { label: 'Avg Score',   value: avgScore + '%', color: 'text-blue-700', bg: 'bg-blue-50' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} rounded-xl p-3 text-center`}>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Score distribution chart */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Score Distribution
        </h4>
        <div className="flex items-end gap-2 h-24">
          {buckets.map(({ label, count, color }) => (
            <div key={label} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs font-semibold text-gray-700">
                {count > 0 ? count : ''}
              </span>
              <div className="w-full flex items-end" style={{ height: '64px' }}>
                <div
                  className={`w-full rounded-t-md ${color} transition-all duration-500`}
                  style={{ height: count > 0 ? `${(count / maxBucket) * 64}px` : '4px',
                           opacity: count > 0 ? 1 : 0.2 }}
                />
              </div>
              <span className="text-xs text-gray-400">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Shortlist rate */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <span className="text-sm text-gray-500">Shortlist rate</span>
        <div className="flex items-center gap-3">
          <div className="w-32 bg-gray-100 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full"
              style={{ width: `${total > 0 ? (shortlisted / total) * 100 : 0}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-green-700">
            {total > 0 ? Math.round((shortlisted / total) * 100) : 0}%
          </span>
        </div>
      </div>
    </div>
  )
}
