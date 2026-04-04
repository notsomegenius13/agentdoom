export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-doom-black text-white">
      {/* Header skeleton */}
      <div className="border-b border-gray-800 bg-doom-dark/50 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="h-7 w-28 rounded bg-gray-800 animate-pulse" />
          <div className="h-8 w-24 rounded-xl bg-gray-800 animate-pulse" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Title skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-48 rounded bg-gray-800 animate-pulse" />
          <div className="h-4 w-64 rounded bg-gray-800/60 animate-pulse" />
        </div>

        {/* Stats cards skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-800 bg-doom-dark p-5 space-y-3">
              <div className="h-3 w-20 rounded bg-gray-800 animate-pulse" />
              <div className="h-7 w-24 rounded bg-gray-800 animate-pulse" />
            </div>
          ))}
        </div>

        {/* Tools list skeleton */}
        <div className="space-y-3">
          <div className="h-6 w-32 rounded bg-gray-800 animate-pulse" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-800 bg-doom-dark p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-gray-800 animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 rounded bg-gray-800 animate-pulse" />
                <div className="h-3 w-24 rounded bg-gray-800/60 animate-pulse" />
              </div>
              <div className="h-5 w-16 rounded bg-gray-800 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
