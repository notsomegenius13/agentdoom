'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import type { FeedTool } from '@/lib/feed/types'

interface ToolDetail extends FeedTool {
  creatorId?: string
  creator: FeedTool['creator'] & {
    stripeAccountId?: string | null
    isPro?: boolean
  }
}

const PLATFORM_FEE_PERCENT = 15

export default function CheckoutPage() {
  const { toolId } = useParams<{ toolId: string }>()
  const [tool, setTool] = useState<ToolDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    const fetchTool = async () => {
      const res = await fetch(`/api/tools/${toolId}`)
      if (res.ok) {
        setTool((await res.json()) as ToolDetail)
      }
      setLoading(false)
    }
    fetchTool()
  }, [toolId])

  const handleCheckout = async () => {
    if (!tool || processing) return
    setProcessing(true)

    try {
      const buyerId = localStorage.getItem('agentdoom_buyer_id') || crypto.randomUUID()
      localStorage.setItem('agentdoom_buyer_id', buyerId)

      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'tool',
          toolId: tool.id,
          toolTitle: tool.title,
          toolSlug: tool.slug,
          priceCents: tool.priceCents,
          creatorStripeAccountId: tool.creator.stripeAccountId ?? null,
          creatorIsPro: tool.creator.isPro ?? false,
          buyerId,
        }),
      })

      if (res.ok) {
        const { url } = await res.json()
        if (url) {
          window.location.href = url
          return
        }
      }
    } catch {
      // checkout failed
    }
    setProcessing(false)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-doom-black flex items-center justify-center">
        <div className="h-6 w-6 rounded-full border-2 border-doom-accent border-t-transparent animate-spin" />
      </main>
    )
  }

  if (!tool) {
    return (
      <main className="min-h-screen bg-doom-black text-white flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400">Tool not found</p>
        <Link href="/marketplace" className="text-doom-accent hover:underline text-sm">
          Back to Marketplace
        </Link>
      </main>
    )
  }

  const priceDollars = (tool.priceCents / 100).toFixed(2)
  const creatorEarnings = ((tool.priceCents * (100 - PLATFORM_FEE_PERCENT)) / 10000).toFixed(2)

  return (
    <main className="min-h-screen bg-doom-black text-white flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="rounded-2xl border border-gray-800 bg-doom-dark overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-800">
            <Link href="/marketplace" className="text-sm font-bold tracking-tight">
              <span className="text-doom-accent">Agent</span>Doom
            </Link>
            <h1 className="mt-3 text-xl font-bold">Checkout</h1>
          </div>

          {/* Tool Summary */}
          <div className="px-6 py-5 border-b border-gray-800">
            <div className="flex items-start gap-4">
              {tool.previewHtml ? (
                <div className="h-16 w-16 rounded-xl overflow-hidden bg-white shrink-0">
                  <iframe
                    srcDoc={tool.previewHtml}
                    className="w-full h-full pointer-events-none"
                    sandbox=""
                    title={tool.title}
                  />
                </div>
              ) : (
                <div className="h-16 w-16 rounded-xl bg-doom-gray shrink-0" />
              )}
              <div className="min-w-0">
                <h2 className="font-semibold truncate">{tool.title}</h2>
                <p className="text-xs text-gray-400 mt-1">
                  by {tool.creator.displayName || tool.creator.username}
                </p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {tool.description}
                </p>
              </div>
            </div>
          </div>

          {/* What You Get */}
          <div className="px-6 py-5 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">What you get</h3>
            <ul className="space-y-2">
              {[
                'Full access to tool',
                'No attribution required',
                'Commercial license',
                'Fork & customize freely',
                'Future updates included',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-gray-400">
                  <span className="text-doom-green text-xs">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Price Breakdown */}
          <div className="px-6 py-5 border-b border-gray-800 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Tool price</span>
              <span className="text-white">${priceDollars}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Creator receives</span>
              <span className="text-gray-500">${creatorEarnings}</span>
            </div>
            <div className="pt-2 border-t border-gray-800 flex items-center justify-between">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-lg font-bold text-white">${priceDollars}</span>
            </div>
          </div>

          {/* Checkout Button (Stripe Stub) */}
          <div className="px-6 py-5">
            <button
              onClick={handleCheckout}
              disabled={processing}
              className="w-full rounded-xl bg-doom-accent px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-doom-accent-light disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {processing ? 'Redirecting to Stripe...' : `Pay $${priceDollars}`}
            </button>
            <p className="mt-3 text-center text-xs text-gray-600">
              Powered by Stripe Connect. Secure payment processing.
            </p>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-4 text-center">
          <Link
            href={`/t/${tool.slug}`}
            className="text-sm text-gray-500 hover:text-white transition-colors"
          >
            ← Back to tool
          </Link>
        </div>
      </motion.div>
    </main>
  )
}
