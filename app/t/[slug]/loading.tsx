export default function ToolDetailLoading() {
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
        {/* Preview skeleton */}
        <div className="rounded-2xl border border-gray-800 bg-doom-dark overflow-hidden mb-6">
          <div className="aspect-video bg-gray-800 animate-pulse" />
        </div>

        {/* Title + meta */}
        <div className="space-y-4 mb-8">
          <div className="h-8 w-2/3 rounded bg-gray-800 animate-pulse" />
          <div className="h-4 w-full rounded bg-gray-800/60 animate-pulse" />
          <div className="h-4 w-3/4 rounded bg-gray-800/60 animate-pulse" />

          {/* Creator row */}
          <div className="flex items-center gap-3 pt-2">
            <div className="h-10 w-10 rounded-full bg-gray-800 animate-pulse" />
            <div className="space-y-1">
              <div className="h-4 w-24 rounded bg-gray-800 animate-pulse" />
              <div className="h-3 w-16 rounded bg-gray-800/60 animate-pulse" />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <div className="h-10 w-28 rounded-xl bg-gray-800 animate-pulse" />
            <div className="h-10 w-28 rounded-xl bg-gray-800 animate-pulse" />
            <div className="h-10 w-20 rounded-xl bg-gray-800 animate-pulse" />
          </div>
        </div>
      </div>
    </main>
  );
}
