'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Stats {
  overview: {
    totalTools: number
    uniqueCreators: number
    totalViews: number
    totalForks: number
  }
  leaderboard: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
    isVerified: boolean
    isPro: boolean
    toolsCreated: number
    totalViews: number
    totalRemixes: number
    totalLikes: number
  }[]
  categories: { category: string; count: number }[]
  builtLastHour: number
  engagement: {
    views: number
    uses: number
    forks: number
    shares: number
    likes: number
  }
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return n.toLocaleString()
}

function BigCounter({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="flex flex-col items-center p-6 rounded-2xl border border-gray-800 bg-doom-dark">
      <p className={`text-4xl sm:text-5xl font-bold font-mono ${accent ? 'text-doom-accent' : 'text-white'}`}>
        {formatCount(value)}
      </p>
      <p className="mt-2 text-sm text-gray-400 uppercase tracking-wider">{label}</p>
    </div>
  )
}

const RANK_COLORS = ['text-yellow-400', 'text-gray-300', 'text-amber-600']

const CATEGORY_COLORS = [
  'bg-doom-accent',
  'bg-emerald-500',
  'bg-sky-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-indigo-500',
  'bg-orange-500',
  'bg-cyan-500',
]

export default function StatsPage() {
  const [data, setData] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/stats')
      if (res.ok) setData(await res.json())
    } catch {
      // retry on next interval
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30_000)
    return () => clearInterval(interval)
  }, [fetchData])

  if (loading && !data) {
    return (
      <main className="min-h-screen bg-doom-black flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-doom-accent border-t-transparent animate-spin" />
      </main>
    )
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-doom-black text-white flex items-center justify-center">
        <p className="text-gray-400">Failed to load stats</p>
      </main>
    )
  }

  const totalCategoryTools = data.categories.reduce((sum, c) => sum + c.count, 0) || 1

  return (
    <main className="min-h-screen bg-doom-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-doom-dark/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold">
            <span className="text-doom-accent">Agent</span>Doom Stats
          </h1>
          <p className="mt-2 text-gray-400 text-sm">
            Live platform metrics &bull; Auto-refreshes every 30s
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
        {/* Big Counters */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <BigCounter label="Tools Created" value={data.overview.totalTools} accent />
            <BigCounter label="Creators" value={data.overview.uniqueCreators} />
            <BigCounter label="Total Views" value={data.overview.totalViews} />
            <BigCounter label="Total Forks" value={data.overview.totalForks} />
          </div>
        </section>

        {/* Built in the Last Hour */}
        <section className="text-center">
          <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl border border-doom-accent/30 bg-doom-accent/5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-doom-green opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-doom-green" />
            </span>
            <span className="text-2xl font-bold font-mono text-doom-green">{data.builtLastHour}</span>
            <span className="text-gray-400 text-sm">tools built in the last hour</span>
          </div>
        </section>

        {/* Creator Leaderboard */}
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Top Creators
          </h2>
          <div className="rounded-2xl border border-gray-800 bg-doom-dark overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-500 text-xs">
                    <th className="text-left px-4 py-3 font-medium w-8">#</th>
                    <th className="text-left px-3 py-3 font-medium">Creator</th>
                    <th className="text-right px-3 py-3 font-medium">Tools</th>
                    <th className="text-right px-3 py-3 font-medium">Views</th>
                    <th className="text-right px-3 py-3 font-medium">Forks</th>
                    <th className="text-right px-3 py-3 font-medium">Likes</th>
                  </tr>
                </thead>
                <tbody>
                  {data.leaderboard.map((c, i) => (
                    <tr key={c.id} className="border-b border-gray-800/50 hover:bg-doom-gray/50 transition-colors">
                      <td className={`px-4 py-3 font-bold font-mono ${RANK_COLORS[i] ?? 'text-gray-600'}`}>
                        {i + 1}
                      </td>
                      <td className="px-3 py-3">
                        <Link href={`/u/${c.username}`} className="flex items-center gap-2.5 group">
                          {c.avatarUrl ? (
                            <img
                              src={c.avatarUrl}
                              alt=""
                              className="h-7 w-7 rounded-full object-cover ring-1 ring-gray-700"
                            />
                          ) : (
                            <div className="h-7 w-7 rounded-full bg-doom-gray ring-1 ring-gray-700 flex items-center justify-center text-xs text-gray-500">
                              {(c.displayName || c.username)?.[0]?.toUpperCase()}
                            </div>
                          )}
                          <span className="text-white group-hover:text-doom-accent transition-colors">
                            {c.displayName || c.username}
                          </span>
                          {c.isVerified && (
                            <span className="text-doom-accent text-xs" title="Verified">✓</span>
                          )}
                          {c.isPro && (
                            <span className="text-[10px] bg-doom-accent/20 text-doom-accent-light px-1.5 py-0.5 rounded font-medium">
                              PRO
                            </span>
                          )}
                        </Link>
                      </td>
                      <td className="text-right px-3 py-3 text-gray-400 font-mono">{c.toolsCreated}</td>
                      <td className="text-right px-3 py-3 text-gray-400 font-mono">{formatCount(c.totalViews)}</td>
                      <td className="text-right px-3 py-3 text-gray-400 font-mono">{formatCount(c.totalRemixes)}</td>
                      <td className="text-right px-3 py-3 text-gray-400 font-mono">{formatCount(c.totalLikes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Category Breakdown */}
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Tools by Category
          </h2>
          <div className="rounded-2xl border border-gray-800 bg-doom-dark p-6">
            {/* Donut-style horizontal bar (more practical for SSR/no-lib) */}
            <div className="flex h-6 rounded-full overflow-hidden mb-6">
              {data.categories.map((c, i) => {
                const pct = (c.count / totalCategoryTools) * 100
                return (
                  <div
                    key={c.category}
                    className={`${CATEGORY_COLORS[i % CATEGORY_COLORS.length]} transition-all duration-500`}
                    style={{ width: `${Math.max(pct, 0.5)}%` }}
                    title={`${c.category}: ${c.count} (${pct.toFixed(1)}%)`}
                  />
                )
              })}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {data.categories.map((c, i) => {
                const pct = ((c.count / totalCategoryTools) * 100).toFixed(1)
                return (
                  <div key={c.category} className="flex items-center gap-2">
                    <span className={`h-3 w-3 rounded-sm shrink-0 ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]}`} />
                    <span className="text-sm text-gray-300 truncate">{c.category}</span>
                    <span className="text-xs text-gray-600 font-mono ml-auto">{c.count} ({pct}%)</span>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Platform Engagement */}
        <section className="pb-10">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Platform Engagement
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            <div className="rounded-xl border border-gray-800 bg-doom-dark p-4 text-center">
              <p className="text-2xl font-bold font-mono text-white">{formatCount(data.engagement.views)}</p>
              <p className="mt-1 text-xs text-gray-500 uppercase">Views</p>
            </div>
            <div className="rounded-xl border border-gray-800 bg-doom-dark p-4 text-center">
              <p className="text-2xl font-bold font-mono text-white">{formatCount(data.engagement.uses)}</p>
              <p className="mt-1 text-xs text-gray-500 uppercase">Uses</p>
            </div>
            <div className="rounded-xl border border-gray-800 bg-doom-dark p-4 text-center">
              <p className="text-2xl font-bold font-mono text-white">{formatCount(data.engagement.forks)}</p>
              <p className="mt-1 text-xs text-gray-500 uppercase">Forks</p>
            </div>
            <div className="rounded-xl border border-gray-800 bg-doom-dark p-4 text-center">
              <p className="text-2xl font-bold font-mono text-white">{formatCount(data.engagement.shares)}</p>
              <p className="mt-1 text-xs text-gray-500 uppercase">Shares</p>
            </div>
            <div className="rounded-xl border border-gray-800 bg-doom-dark p-4 text-center">
              <p className="text-2xl font-bold font-mono text-white">{formatCount(data.engagement.likes)}</p>
              <p className="mt-1 text-xs text-gray-500 uppercase">Likes</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
