export function Skeleton({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`bg-white/[0.02] rounded-lg loading-shimmer ${className}`}
      style={{ minHeight: '20px', ...style }}
    />
  );
}

export function StatsPageSkeleton() {
  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Header */}
      <div className="safe-top px-6 pt-8 pb-6">
        <Skeleton className="h-10 w-32 mb-3" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-20 px-6">
        {/* Today's stats */}
        <div className="mb-12">
          <Skeleton className="h-3 w-20 mb-6" />
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
              <Skeleton className="h-12 w-16 mb-3" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
              <Skeleton className="h-12 w-16 mb-3" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>

        {/* Week chart */}
        <div className="mb-12">
          <Skeleton className="h-3 w-24 mb-6" />
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
            <div className="flex items-end justify-between h-48 gap-2">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                  <Skeleton className="w-full mb-3" style={{ height: `${Math.random() * 60 + 20}%` }} />
                  <Skeleton className="h-3 w-3" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TasksPageSkeleton() {
  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Header */}
      <div className="safe-top px-6 pt-8 pb-6">
        <Skeleton className="h-10 w-24 mb-3" />
        <Skeleton className="h-4 w-40" />
      </div>

      {/* Filter tabs */}
      <div className="flex border-b border-white/10 px-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex-1 py-4">
            <Skeleton className="h-4 w-16 mx-auto" />
          </div>
        ))}
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto pb-40 px-6 py-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-5 border-b border-white/5">
            <Skeleton className="w-1 h-10 rounded-full" />
            <Skeleton className="w-7 h-7 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
