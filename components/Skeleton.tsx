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
    <div className="flex flex-col h-screen bg-black text-white lg:ml-64">
      {/* Header */}
      <div className="safe-top px-6 lg:px-12 pt-8 lg:pt-12 pb-6">
        <Skeleton className="h-10 w-24 mb-3" />
        <Skeleton className="h-4 w-40" />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 border-b border-white/10 px-6 lg:px-12">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="px-4 py-4">
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto pb-40 px-6 lg:px-12 py-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 lg:gap-4 py-5 lg:py-6 border-b border-white/5">
            <Skeleton className="w-1 h-10 rounded-full" />
            <Skeleton className="w-7 h-7 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CalendarPageSkeleton() {
  return (
    <div className="flex flex-col h-screen bg-[#1a1a1a] text-white lg:ml-64">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="flex items-center justify-between px-4 lg:px-8 py-3 lg:py-4">
          <div className="flex items-center gap-2 lg:gap-4">
            <Skeleton className="h-8 w-16 rounded-lg" />
            <div className="flex gap-1">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="w-8 h-8 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
        <div className="flex items-center justify-between px-4 lg:px-8 pb-3 lg:pb-4">
          <Skeleton className="h-6 w-40" />
          <div className="flex gap-1 bg-white/5 rounded-lg p-1">
            <Skeleton className="h-7 w-12 rounded" />
            <Skeleton className="h-7 w-12 rounded" />
            <Skeleton className="h-7 w-12 rounded" />
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-hidden p-4">
        {/* Day headers */}
        <div className="flex border-b border-white/10 pb-2 mb-2">
          <div className="w-14 lg:w-16" />
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex-1 text-center">
              <Skeleton className="h-4 w-8 mx-auto mb-1" />
              <Skeleton className="h-8 w-8 rounded-full mx-auto" />
            </div>
          ))}
        </div>

        {/* Time grid */}
        <div className="flex">
          <div className="w-14 lg:w-16 space-y-12 pt-2">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-3 w-8 ml-auto" />
            ))}
          </div>
          <div className="flex-1 grid grid-cols-7 gap-px bg-white/5 rounded-lg overflow-hidden">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="bg-[#1a1a1a] min-h-[400px]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
