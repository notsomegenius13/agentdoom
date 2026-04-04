export default function CreatorProfileLoading() {
  return (
    <main className="min-h-screen bg-doom-black text-white">
      {/* Header skeleton */}
      <div className="border-b border-gray-800 bg-doom-dark/50 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="h-7 w-28 rounded bg-gray-800 animate-pulse" />
          <div className="h-8 w-20 rounded-lg bg-gray-800 animate-pulse" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile header skeleton */}
        <div className="flex items-start gap-5 mb-8">
          <div className="h-20 w-20 rounded-full bg-gray-800 animate-pulse shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="h-7 w-40 rounded bg-gray-800 animate-pulse" />
            <div className="h-4 w-24 rounded bg-gray-800/60 animate-pulse" />
            <div className="h-4 w-64 rounded bg-gray-800/60 animate-pulse" />
            <div className="flex gap-6 pt-1">
              <div className="h-4 w-16 rounded bg-gray-800 animate-pulse" />
              <div className="h-4 w-16 rounded bg-gray-800 animate-pulse" />
              <div className="h-4 w-16 rounded bg-gray-800 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Tools grid skeleton */}
        <div className="h-6 w-24 rounded bg-gray-800 animate-pulse mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-800 bg-doom-dark overflow-hidden">
              <div className="h-36 bg-gray-800 animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-5 w-3/4 rounded bg-gray-800 animate-pulse" />
                <div className="h-3 w-full rounded bg-gray-800/60 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
