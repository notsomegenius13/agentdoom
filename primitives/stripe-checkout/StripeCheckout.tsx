'use client'

import React, { useState } from 'react'

export interface StripeCheckoutConfig {
  /** Display name of the product */
  productName: string
  /** Price in cents (e.g. 1499 = $14.99) */
  priceCents: number
  /** Stripe Price ID for pre-configured products, or omit to use priceCents */
  stripePriceId?: string
  /** Currency symbol */
  currency?: string
  /** 'payment' for one-time, 'subscription' for recurring */
  mode?: 'payment' | 'subscription'
  /** API endpoint that creates the checkout session */
  checkoutApiUrl?: string
  /** Button label (default: "Buy Now") */
  buttonLabel?: string
  /** Optional description shown below the product name */
  description?: string
  /** Additional metadata passed to the checkout session */
  metadata?: Record<string, string>
  /** Success redirect URL (passed to your API) */
  successUrl?: string
  /** Cancel redirect URL (passed to your API) */
  cancelUrl?: string
  /** Visual style variant */
  variant?: 'default' | 'compact' | 'card'
}

export default function StripeCheckout({ config }: { config: StripeCheckoutConfig }) {
  const {
    productName,
    priceCents,
    stripePriceId,
    currency = '$',
    mode = 'payment',
    checkoutApiUrl = '/api/stripe/checkout',
    buttonLabel,
    description,
    metadata = {},
    successUrl,
    cancelUrl,
    variant = 'default',
  } = config

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const displayPrice = (priceCents / 100).toFixed(2)
  const label = buttonLabel || (mode === 'subscription' ? 'Subscribe' : 'Buy Now')

  const handleCheckout = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(checkoutApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName,
          priceCents,
          stripePriceId,
          mode,
          metadata,
          successUrl,
          cancelUrl,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Checkout failed')
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading}
        aria-busy={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
      >
        {loading ? (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : null}
        {loading ? 'Processing...' : `${label} — ${currency}${displayPrice}`}
      </button>
    )
  }

  if (variant === 'card') {
    return (
      <div className="rounded-xl border-2 border-gray-200 p-6 text-center transition-all hover:border-purple-300 hover:shadow-md">
        <h3 className="text-lg font-bold text-gray-900">{productName}</h3>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
        <div className="mt-4 flex items-baseline justify-center gap-1">
          <span className="text-3xl font-extrabold text-gray-900">
            {currency}{displayPrice}
          </span>
          {mode === 'subscription' && (
            <span className="text-sm text-gray-500">/mo</span>
          )}
        </div>
        <button
          type="button"
          onClick={handleCheckout}
          disabled={loading}
          aria-busy={loading}
          className="mt-4 w-full rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {loading ? 'Redirecting to checkout...' : label}
        </button>
        {error && (
          <p className="mt-2 text-xs text-red-600" role="alert">{error}</p>
        )}
      </div>
    )
  }

  // Default variant
  return (
    <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: 'var(--doom-surface, white)', color: 'var(--doom-text-primary, #18181b)' }}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{productName}</h3>
          {description && <p className="mt-0.5 text-sm text-gray-500">{description}</p>}
        </div>
        <div className="text-right">
          <div className="text-2xl font-extrabold text-gray-900">
            {currency}{displayPrice}
          </div>
          {mode === 'subscription' && (
            <span className="text-xs text-gray-500">/month</span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading}
        aria-busy={loading}
        className="mt-4 w-full rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Redirecting to checkout...
          </span>
        ) : (
          label
        )}
      </button>

      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>
      )}
    </div>
  )
}
