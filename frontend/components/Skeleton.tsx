export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 bg-gray-200 rounded-full" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-48 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-32" />
        </div>
        <div className="w-14 h-14 bg-gray-200 rounded-full" />
        <div className="w-24 h-7 bg-gray-200 rounded-full" />
      </div>
    </div>
  )
}

export function SkeletonJobCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-6 py-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-5 bg-gray-200 rounded w-48 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-64" />
        </div>
        <div className="w-32 h-8 bg-gray-200 rounded-lg" />
      </div>
    </div>
  )
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-3 gap-6">
      {[1,2,3].map(i => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 px-6 py-5 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
          <div className="h-8 bg-gray-200 rounded w-16" />
        </div>
      ))}
    </div>
  )
}
