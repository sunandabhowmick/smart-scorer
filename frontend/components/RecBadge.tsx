interface Props {
  recommendation: 'SHORTLIST' | 'REVIEW' | 'PASS'
}

const config = {
  SHORTLIST: { label: '✅ Shortlist', cls: 'bg-green-100 text-green-800 border-green-200' },
  REVIEW:    { label: '⚠️ Review',    cls: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  PASS:      { label: '❌ Pass',      cls: 'bg-red-100 text-red-800 border-red-200' },
}

export default function RecBadge({ recommendation }: Props) {
  const { label, cls } = config[recommendation] || config.PASS
  return (
    <span className={`inline-block rounded-full border text-xs font-semibold px-3 py-1 ${cls}`}>
      {label}
    </span>
  )
}
