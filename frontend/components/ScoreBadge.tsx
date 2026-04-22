interface Props {
  score: number
  size?: 'sm' | 'md' | 'lg'
}

export default function ScoreBadge({ score, size = 'md' }: Props) {
  const color = score >= 75
    ? 'bg-green-100 text-green-800 border-green-200'
    : score >= 50
    ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
    : 'bg-red-100 text-red-800 border-red-200'

  const sizeClass = size === 'lg'
    ? 'text-2xl font-bold px-4 py-2'
    : size === 'sm'
    ? 'text-xs px-2 py-0.5'
    : 'text-sm font-semibold px-3 py-1'

  return (
    <span className={`inline-block rounded-full border ${color} ${sizeClass}`}>
      {score}%
    </span>
  )
}
