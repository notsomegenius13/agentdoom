'use client'

import { useState, useEffect, useCallback } from 'react'

interface RevenueData {
  period: string
  generatedAt: string
  metrics: {
    mrrCents: number
    mrrFormatted: string
    totalRevenueCents: number
    totalRevenueFormatted: string
    platformFeeCents: number
    platformFeeFormatted: string
    totalPurchases: number
    avgOrderCents: number
    avgOrderFormatted: string
    arpuCents: number
    arpuFormatted: string
    churnRate: string
    churnedUsers: number
  }
  pro: {
    total: number
    new24h: number
    new7d: number
    new30d: number
    timeline: { day: string; signups: number }[]
  }
  funnel: {
    waitlistSignups: number
    totalUsers: number
    creators: number
    paidCreators: number
    buyers: number
    proSubscribers: number
    connectAccounts: number
  }
  conversionRates: {
    signupToCreator: string
    signupToBuyer: string
    signupToPro: string
    newUsers: number
    newCreators: number
    newBuyers: number
    newPro: number
  }
  dailyRevenue: { day: string; purchases: number; grossCents: number; platformCents: number }[]
  hourlyRevenue: { hour: string; purchases: number; grossCents: number }[]
  topSelling: {
    id: string; slug: string; title: string; category: string
    priceCents: number; sales: number; revenueCents: number; platformFeeCents: number
  }[]
  recentPurchases: {
    id: string; amountCents: number; platformFeeCents: number
    toolTitle: string; toolSlug: string; buyerUsername: string; createdAt: string
  }[]
}

function fmt(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? 'border-green-700 bg-green-950/30' : 'border-gray-800 bg-doom-dark'}`}>
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent ? 'text-green-400' : 'text-white'}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-gray-500">{sub}</p>}
    </div>
  )
}

function FunnelStep({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <span className="w-36 text-xs text-gray-400 shrink-0 text-right">{label}</span>
      <div className="flex-1 h-7 bg-doom-gray rounded-md overflow-hidden relative">
        <div
          className={`h-full rounded-md transition-all duration-700 ${color}`}
          style={{ width: `${Math.max(pct, 1)}%` }}
        />
        <span className="absolute inset-0 flex items-center px-2 text-xs font-mono text-white">
          {value.toLocaleString()} ({pct.toFixed(1)}%)
        </span>
      </div>
    </div>
  )
}

function BarChart({ data, maxVal, formatLabel }: {
  data: { label: string; value: number }[]
  maxVal: number
  formatLabel?: (v: number) => string
}) {
  return (
    <div className="flex items-end gap-0.5 h-24">
      {data.map((d, i) => {
        const h = maxVal > 0 ? (d.value / maxVal) * 100 : 0
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
            <div
              className="w-full bg-green-500 rounded-t transition-all duration-300 min-h-[2px] hover:bg-green-400"
              style={{ height: `${Math.max(h, 2)}%` }}
            />
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-doom-dark border border-gray-700 rounded px-2 py-1 text-[10px] text-white whitespace-nowrap z-10">
              {d.label}: {formatLabel ? formatLabel(d.value) : d.value}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function RevenueDashboard() {
  const [data, setData] = useState<RevenueData | null>(null)
  const [period, setPeriod] = useState<'1h' | '24h' | '7d' | '30d'>('24h')
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/revenue?period=${period}`)
      if (res.ok) {
        setData(await res.json())
        setLastRefresh(new Date())
      }
    } catch {
      // retry on next interval
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    setLoading(true)
    fetchData()
    // Auto-refresh every 15s for launch day real-time monitoring
    const interval = setInterval(fetchData, 15_000)
    return () => clearInterval(interval)
  }, [fetchData])

  const periods = ['1h', '24h', '7d', '30d'] as const

  if (loading && !data) {
    return (
      <main className="min-h-screen bg-doom-black flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 rounded-full border-2 border-green-500 border-t-transparent animate-spin mx-auto" />
          <p className="mt-3 text-sm text-gray-500">Loading revenue data...</p>
        </div>
      </main>
    )
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-doom-black text-white flex items-center justify-center">
        <p className="text-gray-400">Failed to load revenue data</p>
      </main>
    )
  }

  const funnelMax = data.funnel.waitlistSignups || data.funnel.totalUsers || 1

  // Hourly chart data
  const hourlyChartData = data.hourlyRevenue.map((r) => ({
    label: new Date(r.hour).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
    value: r.grossCents,
  }))
  const hourlyMax = Math.max(...hourlyChartData.map((d) => d.value), 1)

  // Daily chart data
  const dailyChartData = data.dailyRevenue.map((r) => ({
    label: new Date(r.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: r.grossCents,
  }))
  const dailyMax = Math.max(...dailyChartData.map((d) => d.value), 1)

  return (
    <main className="min-h-screen bg-doom-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-doom-dark/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">
              <span className="text-green-400">$</span> Revenue Dashboard
            </h1>
            {lastRefresh && (
              <p className="text-[10px] text-gray-600">
                Live — updated {lastRefresh.toLocaleTimeString()} (every 15s)
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-green-400">LIVE</span>
            </div>
            <div className="flex gap-1">
              {periods.map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    period === p
                      ? 'bg-green-600 text-white'
                      : 'bg-doom-gray text-gray-400 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
        {/* Key Revenue Metrics */}
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Revenue Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="MRR" value={data.metrics.mrrFormatted} sub={`${data.pro.total} Pro subscribers`} accent />
            <StatCard
              label={`Revenue (${period})`}
              value={data.metrics.totalRevenueFormatted}
              sub={`${data.metrics.totalPurchases} purchases`}
              accent
            />
            <StatCard label="Platform Fees" value={data.metrics.platformFeeFormatted} sub="our take" accent />
            <StatCard label="Avg Order" value={data.metrics.avgOrderFormatted} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
            <StatCard label="ARPU" value={data.metrics.arpuFormatted} sub="revenue per buyer" />
            <StatCard label="Churn Rate" value={data.metrics.churnRate} sub={`${data.metrics.churnedUsers} churned (30d)`} />
            <StatCard label="Pro (24h)" value={data.pro.new24h} sub="new subscribers" />
            <StatCard label="Pro (30d)" value={data.pro.new30d} sub="new subscribers" />
          </div>
        </section>

        {/* Hourly Revenue — Launch Day */}
        {hourlyChartData.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Hourly Revenue (Last 24h)
            </h2>
            <div className="rounded-xl border border-gray-800 bg-doom-dark p-4">
              <BarChart data={hourlyChartData} maxVal={hourlyMax} formatLabel={fmt} />
              <div className="flex justify-between mt-1 text-[10px] text-gray-600">
                <span>{hourlyChartData[0]?.label}</span>
                <span>{hourlyChartData[hourlyChartData.length - 1]?.label}</span>
              </div>
            </div>
          </section>
        )}

        {/* Daily Revenue — 30d Trend */}
        {dailyChartData.length > 1 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Daily Revenue (30d)
            </h2>
            <div className="rounded-xl border border-gray-800 bg-doom-dark p-4">
              <BarChart data={dailyChartData} maxVal={dailyMax} formatLabel={fmt} />
              <div className="flex justify-between mt-1 text-[10px] text-gray-600">
                <span>{dailyChartData[0]?.label}</span>
                <span>{dailyChartData[dailyChartData.length - 1]?.label}</span>
              </div>
            </div>
          </section>
        )}

        {/* Conversion Funnel */}
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Conversion Funnel
          </h2>
          <div className="rounded-xl border border-gray-800 bg-doom-dark p-4 space-y-2">
            <FunnelStep label="Waitlist Signups" value={data.funnel.waitlistSignups} max={funnelMax} color="bg-blue-500" />
            <FunnelStep label="Registered Users" value={data.funnel.totalUsers} max={funnelMax} color="bg-blue-400" />
            <FunnelStep label="Created Tools" value={data.funnel.creators} max={funnelMax} color="bg-purple-500" />
            <FunnelStep label="Paid Tool Creators" value={data.funnel.paidCreators} max={funnelMax} color="bg-purple-400" />
            <FunnelStep label="Made a Purchase" value={data.funnel.buyers} max={funnelMax} color="bg-green-500" />
            <FunnelStep label="Pro Subscribers" value={data.funnel.proSubscribers} max={funnelMax} color="bg-green-400" />
            <FunnelStep label="Connect Accounts" value={data.funnel.connectAccounts} max={funnelMax} color="bg-yellow-500" />
          </div>
          <div className="grid grid-cols-3 gap-3 mt-3">
            <StatCard
              label="Signup → Creator"
              value={data.conversionRates.signupToCreator}
              sub={`${data.conversionRates.newCreators} of ${data.conversionRates.newUsers} (${period})`}
            />
            <StatCard
              label="Signup → Buyer"
              value={data.conversionRates.signupToBuyer}
              sub={`${data.conversionRates.newBuyers} of ${data.conversionRates.newUsers} (${period})`}
            />
            <StatCard
              label="Signup → Pro"
              value={data.conversionRates.signupToPro}
              sub={`${data.conversionRates.newPro} of ${data.conversionRates.newUsers} (${period})`}
            />
          </div>
        </section>

        {/* Top Selling Tools */}
        {data.topSelling.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Top Selling Tools
            </h2>
            <div className="rounded-xl border border-gray-800 bg-doom-dark overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-500 text-xs">
                      <th className="text-left px-4 py-2 font-medium">Tool</th>
                      <th className="text-right px-3 py-2 font-medium">Price</th>
                      <th className="text-right px-3 py-2 font-medium">Sales</th>
                      <th className="text-right px-3 py-2 font-medium">Revenue</th>
                      <th className="text-right px-3 py-2 font-medium">Platform Fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topSelling.map((t, i) => (
                      <tr key={t.id} className="border-b border-gray-800/50 hover:bg-doom-gray/50">
                        <td className="px-4 py-2">
                          <span className="text-gray-600 mr-2">{i + 1}.</span>
                          <span className="text-white">{t.title}</span>
                          <span className="ml-2 text-[10px] text-gray-600 bg-doom-gray px-1.5 py-0.5 rounded">
                            {t.category}
                          </span>
                        </td>
                        <td className="text-right px-3 py-2 text-gray-400 font-mono">{fmt(t.priceCents)}</td>
                        <td className="text-right px-3 py-2 text-gray-400 font-mono">{t.sales}</td>
                        <td className="text-right px-3 py-2 text-green-400 font-mono">{fmt(t.revenueCents)}</td>
                        <td className="text-right px-3 py-2 text-green-300 font-mono">{fmt(t.platformFeeCents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Recent Purchases — Live Feed */}
        {data.recentPurchases.length > 0 && (
          <section className="pb-8">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Recent Purchases (Live Feed)
            </h2>
            <div className="rounded-xl border border-gray-800 bg-doom-dark overflow-hidden">
              <div className="divide-y divide-gray-800/50">
                {data.recentPurchases.map((p) => (
                  <div key={p.id} className="px-4 py-3 flex items-center justify-between hover:bg-doom-gray/30">
                    <div>
                      <span className="text-white text-sm">{p.toolTitle}</span>
                      <span className="text-gray-600 text-xs ml-2">by @{p.buyerUsername}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-green-400 font-mono text-sm font-bold">{fmt(p.amountCents)}</span>
                      <span className="text-[10px] text-gray-600">
                        {new Date(p.createdAt).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Empty State */}
        {data.metrics.totalPurchases === 0 && data.pro.total === 0 && (
          <section className="text-center py-16">
            <p className="text-4xl mb-3">$0.00</p>
            <p className="text-gray-500 text-sm">
              No revenue yet. Dashboard is ready — waiting for first purchase or Pro subscription.
            </p>
            <p className="text-gray-600 text-xs mt-2">
              Data will populate automatically via Stripe webhooks. Refreshing every 15 seconds.
            </p>
          </section>
        )}
      </div>
    </main>
  )
}
