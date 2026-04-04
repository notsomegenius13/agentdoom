export default function MarketplaceLoading() {
  return (
    <main className="min-h-screen bg-doom-black text-white">
      {/* Header skeleton */}
      <div className="border-b border-gray-800 bg-doom-dark/50 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="h-7 w-28 rounded bg-gray-800 animate-pulse" />
          <div className="flex gap-3">
            <div className="h-8 w-20 rounded-lg bg-gray-800 animate-pulse" />
            <div className="h-8 w-24 rounded-lg bg-gray-800 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Category filter skeleton */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <div className="flex gap-2 mb-6">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-8 w-20 rounded-full bg-gray-800 animate-pulse" />
          ))}
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-800 bg-doom-dark overflow-hidden">
              <div className="h-40 bg-gray-800 animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-5 w-3/4 rounded bg-gray-800 animate-pulse" />
                <div className="h-3 w-full rounded bg-gray-800/60 animate-pulse" />
                <div className="h-3 w-2/3 rounded bg-gray-800/60 animate-pulse" />
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-gray-800 animate-pulse" />
                    <div className="h-3 w-16 rounded bg-gray-800 animate-pulse" />
                  </div>
                  <div className="h-3 w-12 rounded bg-gray-800 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
