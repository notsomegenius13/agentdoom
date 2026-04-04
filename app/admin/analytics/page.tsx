'use client'

import { useState, useEffect, useCallback } from 'react'

interface Analytics {
  period: string
  overview: {
    totalTools: number
    totalUsers: number
    totalWaitlist: number
    totalEvents: number
    totalGenerations: number
  }
  generation: {
    total: number
    succeeded: number
    failed: number
    successRate: string
    avgLatencyMs: number
    totalCostCents: number
  }
  generationTimeline: { day: string; total: number; succeeded: number; failed: number }[]
  events: {
    breakdown: { type: string; count: number }[]
    timeline: { day: string; type: string; count: number }[]
  }
  remix: {
    total: number
    uniqueSources: number
    remixRate: string
  }
  waitlist: {
    total: number
    periodSignups: number
    timeline: { day: string; signups: number }[]
  }
  revenue: {
    totalPurchases: number
    grossRevenueCents: number
    platformFeeCents: number
  }
  funnel: {
    generationAttempts: number
    toolsCreated: number
    toolsWithViews: number
    toolsWithUses: number
    toolsWithRemixes: number
    toolsWithShares: number
  }
  shareRate: string
  topTools: {
    id: string
    slug: string
    title: string
    category: string
    views: number
    uses: number
    remixes: number
    shares: number
    likes: number
    score: number
  }[]
  categories: { category: string; count: number }[]
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-doom-dark p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-500">{sub}</p>}
    </div>
  )
}

function FunnelBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 text-xs text-gray-400 shrink-0 text-right">{label}</span>
      <div className="flex-1 h-6 bg-doom-gray rounded-md overflow-hidden relative">
        <div
          className="h-full bg-doom-accent rounded-md transition-all duration-500"
          style={{ width: `${Math.max(pct, 1)}%` }}
        />
        <span className="absolute inset-0 flex items-center px-2 text-xs font-mono text-white">
          {value.toLocaleString()} ({pct.toFixed(1)}%)
        </span>
      </div>
    </div>
  )
}

function MiniBarChart({ data, maxVal }: { data: { label: string; value: number }[]; maxVal: number }) {
  return (
    <div className="flex items-end gap-0.5 h-20">
      {data.map((d, i) => {
        const h = maxVal > 0 ? (d.value / maxVal) * 100 : 0
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
            <div
              className="w-full bg-doom-accent rounded-t transition-all duration-300 min-h-[2px]"
              style={{ height: `${Math.max(h, 2)}%` }}
              title={`${d.label}: ${d.value}`}
            />
          </div>
        )
      })}
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null)
  const [period, setPeriod] = useState<'24h' | '7d' | '30d'>('7d')
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/analytics?period=${period}`)
      if (res.ok) {
        setData(await res.json())
        setLastRefresh(new Date())
      }
    } catch {
      // silent retry on next interval
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    setLoading(true)
    fetchData()
    const interval = setInterval(fetchData, 30_000) // auto-refresh every 30s
    return () => clearInterval(interval)
  }, [fetchData])

  const periods = ['24h', '7d', '30d'] as const

  if (loading && !data) {
    return (
      <main className="min-h-screen bg-doom-black flex items-center justify-center">
        <div className="h-6 w-6 rounded-full border-2 border-doom-accent border-t-transparent animate-spin" />
      </main>
    )
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-doom-black text-white flex items-center justify-center">
        <p className="text-gray-400">Failed to load analytics</p>
      </main>
    )
  }

  const funnelMax = data.funnel.generationAttempts || 1

  // Aggregate daily generation data for chart
  const genChartData = data.generationTimeline.map((d) => ({
    label: new Date(d.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: d.total,
  }))
  const genChartMax = Math.max(...genChartData.map((d) => d.value), 1)

  // Aggregate daily waitlist data for chart
  const waitlistChartData = data.waitlist.timeline.map((d) => ({
    label: new Date(d.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: d.signups,
  }))
  const waitlistChartMax = Math.max(...waitlistChartData.map((d) => d.value), 1)

  return (
    <main className="min-h-screen bg-doom-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-doom-dark/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">
              <span className="text-doom-accent">Agent</span>Doom Analytics
            </h1>
            {lastRefresh && (
              <p className="text-[10px] text-gray-600">
                Updated {lastRefresh.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="flex gap-1">
            {periods.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  period === p
                    ? 'bg-doom-accent text-white'
                    : 'bg-doom-gray text-gray-400 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
        {/* Overview Stats */}
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard label="Tools" value={data.overview.totalTools} />
            <StatCard label="Users" value={data.overview.totalUsers} />
            <StatCard label="Waitlist" value={data.overview.totalWaitlist} />
            <StatCard label="Events" value={data.overview.totalEvents} sub={`in ${period}`} />
            <StatCard label="Generations" value={data.overview.totalGenerations} sub={`in ${period}`} />
          </div>
        </section>

        {/* Generation Stats */}
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Tool Generation</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Generated" value={data.generation.total} />
            <StatCard
              label="Success Rate"
              value={`${data.generation.successRate}%`}
              sub={`${data.generation.succeeded} ok / ${data.generation.failed} fail`}
            />
            <StatCard label="Avg Latency" value={`${(data.generation.avgLatencyMs / 1000).toFixed(1)}s`} />
            <StatCard
              label="AI Cost"
              value={`$${(data.generation.totalCostCents / 100).toFixed(2)}`}
              sub={`in ${period}`}
            />
          </div>
          {genChartData.length > 1 && (
            <div className="mt-3 rounded-xl border border-gray-800 bg-doom-dark p-4">
              <p className="text-xs text-gray-500 mb-2">Daily generations</p>
              <MiniBarChart data={genChartData} maxVal={genChartMax} />
              <div className="flex justify-between mt-1 text-[10px] text-gray-600">
                <span>{genChartData[0]?.label}</span>
                <span>{genChartData[genChartData.length - 1]?.label}</span>
              </div>
            </div>
          )}
        </section>

        {/* Engagement & Events */}
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Engagement</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {data.events.breakdown.map((e) => (
              <StatCard key={e.type} label={e.type} value={e.count} />
            ))}
          </div>
        </section>

        {/* Remix & Share Rates */}
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Virality</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Remixes" value={data.remix.total} sub={`from ${data.remix.uniqueSources} sources`} />
            <StatCard label="Remix Rate" value={data.remix.remixRate} />
            <StatCard label="Share Rate" value={data.shareRate} />
            <StatCard
              label="Revenue"
              value={`$${(data.revenue.grossRevenueCents / 100).toFixed(2)}`}
              sub={`${data.revenue.totalPurchases} purchases`}
            />
          </div>
        </section>

        {/* Waitlist */}
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Waitlist</h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <StatCard label="Total Signups" value={data.waitlist.total} />
            <StatCard label={`New (${period})`} value={data.waitlist.periodSignups} />
          </div>
          {waitlistChartData.length > 1 && (
            <div className="rounded-xl border border-gray-800 bg-doom-dark p-4">
              <p className="text-xs text-gray-500 mb-2">Daily waitlist signups</p>
              <MiniBarChart data={waitlistChartData} maxVal={waitlistChartMax} />
              <div className="flex justify-between mt-1 text-[10px] text-gray-600">
                <span>{waitlistChartData[0]?.label}</span>
                <span>{waitlistChartData[waitlistChartData.length - 1]?.label}</span>
              </div>
            </div>
          )}
        </section>

        {/* Funnel */}
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Funnel</h2>
          <div className="rounded-xl border border-gray-800 bg-doom-dark p-4 space-y-2">
            <FunnelBar label="Gen Attempts" value={data.funnel.generationAttempts} max={funnelMax} />
            <FunnelBar label="Tools Created" value={data.funnel.toolsCreated} max={funnelMax} />
            <FunnelBar label="Got Views" value={data.funnel.toolsWithViews} max={funnelMax} />
            <FunnelBar label="Got Uses" value={data.funnel.toolsWithUses} max={funnelMax} />
            <FunnelBar label="Got Remixes" value={data.funnel.toolsWithRemixes} max={funnelMax} />
            <FunnelBar label="Got Shares" value={data.funnel.toolsWithShares} max={funnelMax} />
          </div>
        </section>

        {/* Top Tools */}
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Top Tools</h2>
          <div className="rounded-xl border border-gray-800 bg-doom-dark overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-500 text-xs">
                    <th className="text-left px-4 py-2 font-medium">Tool</th>
                    <th className="text-right px-3 py-2 font-medium">Views</th>
                    <th className="text-right px-3 py-2 font-medium">Uses</th>
                    <th className="text-right px-3 py-2 font-medium">Forks</th>
                    <th className="text-right px-3 py-2 font-medium">Shares</th>
                    <th className="text-right px-3 py-2 font-medium">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topTools.map((t, i) => (
                    <tr key={t.id} className="border-b border-gray-800/50 hover:bg-doom-gray/50">
                      <td className="px-4 py-2">
                        <span className="text-gray-600 mr-2">{i + 1}.</span>
                        <span className="text-white">{t.title}</span>
                        <span className="ml-2 text-[10px] text-gray-600 bg-doom-gray px-1.5 py-0.5 rounded">
                          {t.category}
                        </span>
                      </td>
                      <td className="text-right px-3 py-2 text-gray-400 font-mono">{t.views.toLocaleString()}</td>
                      <td className="text-right px-3 py-2 text-gray-400 font-mono">{t.uses.toLocaleString()}</td>
                      <td className="text-right px-3 py-2 text-gray-400 font-mono">{t.remixes.toLocaleString()}</td>
                      <td className="text-right px-3 py-2 text-gray-400 font-mono">{t.shares.toLocaleString()}</td>
                      <td className="text-right px-3 py-2 text-doom-accent font-mono font-bold">{t.score.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="pb-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {data.categories.map((c) => (
              <StatCard key={c.category} label={c.category} value={c.count} sub="tools" />
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
