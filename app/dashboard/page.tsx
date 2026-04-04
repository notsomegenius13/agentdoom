'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface EarningsSummary {
  totalSales: number
  totalEarningsCents: number
  avgEarningCents: number
  totalRoyaltiesCents: number
  royaltyCount: number
}

interface TopTool {
  id: string
  slug: string
  title: string
  priceCents: number
  salesCount: number
  earningsCents: number
}

interface Transaction {
  id: string
  amountCents: number
  platformFeeCents: number
  remixRoyaltyCents: number
  netEarningsCents: number
  status: string
  createdAt: string
  tool: { id: string; slug: string; title: string }
  buyerUsername: string | null
}

interface ConnectStatus {
  accountId: string | null
  chargesEnabled: boolean
  payoutsEnabled: boolean
}

interface MyTool {
  id: string
  slug: string
  title: string
  description: string
  category: string
  pricing: 'free' | 'paid'
  priceCents: number
  previewHtml: string | null
  publishedAt: string
  viewsCount: number
  likesCount: number
  remixesCount: number
}

type Period = 'all' | '30d' | '7d' | 'today'

// Mock data for demo — used when no real API data is available
const MOCK_SUMMARY: EarningsSummary = {
  totalSales: 47,
  totalEarningsCents: 38250,
  avgEarningCents: 814,
  totalRoyaltiesCents: 4200,
  royaltyCount: 12,
}

const MOCK_TOP_TOOLS: TopTool[] = [
  { id: 'mock-1', slug: 'freelance-rate-calculator', title: 'Freelance Rate Calculator', priceCents: 999, salesCount: 18, earningsCents: 15282 },
  { id: 'mock-2', slug: 'subscription-tracker', title: 'Subscription Tracker', priceCents: 499, salesCount: 14, earningsCents: 5936 },
  { id: 'mock-3', slug: 'invoice-generator', title: 'Invoice Generator', priceCents: 1499, salesCount: 8, earningsCents: 10192 },
]

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 'tx-1', amountCents: 999, platformFeeCents: 150, remixRoyaltyCents: 0, netEarningsCents: 849, status: 'completed', createdAt: '2026-03-30T14:22:00Z', tool: { id: 'mock-1', slug: 'freelance-rate-calculator', title: 'Freelance Rate Calculator' }, buyerUsername: 'designpro' },
  { id: 'tx-2', amountCents: 499, platformFeeCents: 75, remixRoyaltyCents: 50, netEarningsCents: 374, status: 'completed', createdAt: '2026-03-29T09:15:00Z', tool: { id: 'mock-2', slug: 'subscription-tracker', title: 'Subscription Tracker' }, buyerUsername: 'jkimtools' },
  { id: 'tx-3', amountCents: 1499, platformFeeCents: 225, remixRoyaltyCents: 0, netEarningsCents: 1274, status: 'completed', createdAt: '2026-03-28T18:03:00Z', tool: { id: 'mock-3', slug: 'invoice-generator', title: 'Invoice Generator' }, buyerUsername: null },
]

export default function CreatorDashboardPage() {
  const [period, setPeriod] = useState<Period>('30d')
  const [summary, setSummary] = useState<EarningsSummary | null>(null)
  const [topTools, setTopTools] = useState<TopTool[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [connectStatus, setConnectStatus] = useState<ConnectStatus | null>(null)
  const [myTools, setMyTools] = useState<MyTool[]>([])
  const [loading, setLoading] = useState(true)
  const [creatorName, setCreatorName] = useState<string | null>(null)

  useEffect(() => {
    // Load creator profile from localStorage (set during onboarding)
    const creator = localStorage.getItem('agentdoom_creator')
    if (creator) {
      try {
        setCreatorName(JSON.parse(creator).name)
      } catch {}
    }

    // Load user-created tools from localStorage
    const storedTools = localStorage.getItem('agentdoom_tools')
    if (storedTools) {
      try {
        setMyTools(JSON.parse(storedTools))
      } catch {}
    }

    // Use mock data for demo (no real API yet)
    setSummary(MOCK_SUMMARY)
    setTopTools(MOCK_TOP_TOOLS)
    setTransactions(MOCK_TRANSACTIONS)
    setConnectStatus({ accountId: null, chargesEnabled: false, payoutsEnabled: false })
    setLoading(false)
  }, [period])

  const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`

  if (loading) {
    return (
      <main className="min-h-screen bg-doom-black flex items-center justify-center">
        <div className="h-6 w-6 rounded-full border-2 border-doom-accent border-t-transparent animate-spin" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-doom-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-doom-dark/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/marketplace" className="text-xl font-bold tracking-tight">
            <span className="text-doom-accent">Agent</span>Doom
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/create-tool"
              className="rounded-xl bg-doom-accent px-4 py-2 text-sm font-semibold text-white hover:bg-doom-accent-light transition-colors"
            >
              + New Tool
            </Link>
            <span className="text-sm text-gray-400">Creator Dashboard</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-bold">
            {creatorName ? `Welcome back, ${creatorName}` : 'Creator Dashboard'}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage your tools, track earnings, and grow your audience.
          </p>
        </motion.div>

        {/* Stripe Connect Status */}
        {connectStatus && !connectStatus.chargesEnabled && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl border border-yellow-600/40 bg-yellow-900/20 px-5 py-4"
          >
            <p className="text-sm text-yellow-300 font-semibold">Stripe Connect Setup Required</p>
            <p className="text-xs text-yellow-400/80 mt-1">
              Complete your Stripe onboarding to start receiving payouts from tool sales.
            </p>
            <button
              onClick={async () => {
                const res = await fetch('/api/stripe/connect', { method: 'POST' })
                if (res.ok) {
                  const { onboardingUrl } = await res.json()
                  if (onboardingUrl) window.location.href = onboardingUrl
                }
              }}
              className="mt-3 rounded-lg bg-yellow-600 px-4 py-2 text-xs font-semibold text-white hover:bg-yellow-500 transition-colors"
            >
              Complete Stripe Setup
            </button>
          </motion.div>
        )}

        {/* My Tools */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">My Tools</h2>
            <Link href="/create-tool" className="text-sm text-doom-accent hover:text-doom-accent-light transition-colors">
              + Create new
            </Link>
          </div>

          {myTools.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myTools.map((tool) => (
                <div
                  key={tool.id}
                  className="rounded-2xl border border-gray-800 bg-doom-dark overflow-hidden group"
                >
                  {tool.previewHtml ? (
                    <div className="h-32 overflow-hidden bg-white">
                      <iframe
                        srcDoc={tool.previewHtml}
                        className="w-full h-full pointer-events-none"
                        sandbox=""
                        title={tool.title}
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="h-32 bg-doom-gray flex items-center justify-center">
                      <span className="text-gray-600 text-sm">No preview</span>
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="rounded-full bg-doom-accent/20 text-doom-accent-light px-2 py-0.5 text-xs">
                        {tool.category}
                      </span>
                      {tool.pricing === 'paid' ? (
                        <span className="text-xs font-semibold text-doom-green">
                          {fmt(tool.priceCents)}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">Free</span>
                      )}
                    </div>
                    <h3 className="font-semibold text-white truncate">{tool.title}</h3>
                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-600">
                      <span>{tool.viewsCount} views</span>
                      <span>{tool.likesCount} likes</span>
                      <span>{tool.remixesCount} forks</span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Link
                        href={`/dashboard/tools/${tool.id}/edit`}
                        className="flex-1 text-center rounded-lg bg-doom-gray px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/t/${tool.slug}`}
                        className="flex-1 text-center rounded-lg bg-doom-accent/20 px-3 py-1.5 text-xs font-medium text-doom-accent-light hover:bg-doom-accent/30 transition-colors"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-gray-800 border-dashed bg-doom-dark/50 p-10 text-center">
              <div className="text-4xl mb-3 opacity-60">⚡</div>
              <h3 className="text-lg font-semibold text-white mb-2">No tools yet</h3>
              <p className="text-gray-500 text-sm mb-5 max-w-sm mx-auto">
                Describe any tool in plain English and watch it build itself. Your first creation is just a prompt away.
              </p>
              <Link
                href="/create-tool"
                className="inline-block rounded-xl bg-doom-accent px-6 py-2.5 text-sm font-semibold text-white hover:bg-doom-accent-light transition-colors"
              >
                Create Your First Tool
              </Link>
            </div>
          )}
        </motion.div>

        {/* Period Selector */}
        <div className="flex items-center gap-2 mb-6">
          {(['today', '7d', '30d', 'all'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                period === p
                  ? 'bg-doom-accent text-white'
                  : 'bg-doom-dark text-gray-400 hover:text-white'
              }`}
            >
              {p === 'all' ? 'All Time' : p === 'today' ? 'Today' : p === '7d' ? '7 Days' : '30 Days'}
            </button>
          ))}
        </div>

        {/* Summary Cards */}
        {summary && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            <SummaryCard label="Total Earnings" value={fmt(summary.totalEarningsCents)} />
            <SummaryCard label="Total Sales" value={String(summary.totalSales)} />
            <SummaryCard label="Avg per Sale" value={fmt(summary.avgEarningCents)} />
            <SummaryCard label="Remix Royalties" value={fmt(summary.totalRoyaltiesCents)} sub={`${summary.royaltyCount} royalties`} />
          </motion.div>
        )}

        {/* Top Tools */}
        {topTools.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <h2 className="text-lg font-bold mb-4">Top Selling Tools</h2>
            <div className="rounded-xl border border-gray-800 bg-doom-dark overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-500 text-xs">
                    <th className="text-left px-4 py-3 font-medium">Tool</th>
                    <th className="text-right px-4 py-3 font-medium">Price</th>
                    <th className="text-right px-4 py-3 font-medium">Sales</th>
                    <th className="text-right px-4 py-3 font-medium">Earnings</th>
                  </tr>
                </thead>
                <tbody>
                  {topTools.map((tool) => (
                    <tr key={tool.id} className="border-b border-gray-800/50 last:border-0">
                      <td className="px-4 py-3">
                        <Link href={`/t/${tool.slug}`} className="text-doom-accent-light hover:underline">
                          {tool.title}
                        </Link>
                      </td>
                      <td className="text-right px-4 py-3 text-gray-400">{fmt(tool.priceCents)}</td>
                      <td className="text-right px-4 py-3 text-gray-400">{tool.salesCount}</td>
                      <td className="text-right px-4 py-3 text-doom-green font-semibold">{fmt(tool.earningsCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-bold mb-4">Recent Sales</h2>
          {transactions.length > 0 ? (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div key={tx.id} className="rounded-xl border border-gray-800 bg-doom-dark px-4 py-3 flex items-center justify-between">
                  <div>
                    <Link href={`/t/${tx.tool.slug}`} className="text-sm font-medium text-doom-accent-light hover:underline">
                      {tx.tool.title}
                    </Link>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {tx.buyerUsername ? `@${tx.buyerUsername}` : 'Anonymous'} &middot;{' '}
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-doom-green">{fmt(tx.netEarningsCents)}</p>
                    <p className="text-xs text-gray-600">
                      {fmt(tx.amountCents)} - {fmt(tx.platformFeeCents)} fee
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12 rounded-xl border border-gray-800 bg-doom-dark">
              <p>No sales yet for this period</p>
            </div>
          )}
        </motion.div>
      </div>
    </main>
  )
}

function SummaryCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-doom-dark px-5 py-4">
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
    </div>
  )
}
