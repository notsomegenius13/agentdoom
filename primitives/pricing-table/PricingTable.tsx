'use client'

import React, { useState } from 'react'
import { AppearanceConfig, PrimitiveWrapper } from '../theme'

export interface PricingFeature {
  text: string
  included: boolean
}

export interface PricingTier {
  name: string
  description?: string
  monthlyPrice: number
  annualPrice: number
  currency?: string
  features: PricingFeature[]
  ctaLabel: string
  highlighted?: boolean
  badge?: string
}

export interface PricingTableConfig {
  title: string
  subtitle?: string
  tiers: PricingTier[]
  showToggle?: boolean
  appearance?: AppearanceConfig
}

export default function PricingTable({ config }: { config: PricingTableConfig }) {
  const { title, subtitle, tiers, showToggle = true } = config
  const [isAnnual, setIsAnnual] = useState(false)

  const gridCols =
    tiers.length === 1
      ? 'max-w-md mx-auto'
      : tiers.length === 2
        ? 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto'
        : tiers.length === 3
          ? 'grid-cols-1 md:grid-cols-3 max-w-6xl mx-auto'
          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto'

  return (
    <PrimitiveWrapper appearance={config.appearance}>
    <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: 'var(--doom-surface, white)', color: 'var(--doom-text-primary, #18181b)' }}>
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="mt-2 text-lg text-gray-500">{subtitle}</p>}
      </div>

      {showToggle && (
        <div className="flex items-center justify-center gap-3 mb-10">
          <span className={`text-sm font-medium ${!isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
            Monthly
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={isAnnual}
            aria-label="Toggle annual billing"
            onClick={() => setIsAnnual(!isAnnual)}
            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
              isAnnual ? 'bg-purple-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                isAnnual ? 'translate-x-8' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
            Annual
          </span>
        </div>
      )}

      <div className={`grid gap-6 ${gridCols}`}>
        {tiers.map((tier) => {
          const currency = tier.currency || '$'
          const price = isAnnual ? tier.annualPrice : tier.monthlyPrice
          const period = isAnnual ? '/yr' : '/mo'
          const savingsPercent =
            tier.monthlyPrice > 0
              ? Math.round(((tier.monthlyPrice - tier.annualPrice) / tier.monthlyPrice) * 100)
              : 0

          return (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-xl border-2 p-6 transition-all duration-200 ${
                tier.highlighted
                  ? 'border-purple-600 scale-105 shadow-lg hover:shadow-xl'
                  : 'border-gray-200 doom-card-hover'
              }`}
            >
              {tier.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-purple-600 px-4 py-1 text-xs font-semibold text-white">
                  {tier.badge || 'Most Popular'}
                </span>
              )}

              <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
              {tier.description && (
                <p className="mt-1 text-sm text-gray-500">{tier.description}</p>
              )}

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-gray-900">
                  {currency}{price}
                </span>
                <span className="text-sm text-gray-500">{period}</span>
                {isAnnual && savingsPercent > 0 && (
                  <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    Save {savingsPercent}%
                  </span>
                )}
              </div>

              <ul className="mt-6 flex-1 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature.text} className="flex items-start gap-2 text-sm">
                    {feature.included ? (
                      <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className={`mt-6 w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  tier.highlighted
                    ? 'doom-gradient-accent text-white hover:opacity-90 shadow-sm hover:shadow-md active:scale-[0.98]'
                    : 'border-2 border-purple-600 text-purple-600 hover:bg-purple-50 active:scale-[0.98]'
                }`}
              >
                {tier.ctaLabel}
              </button>
            </div>
          )
        })}
      </div>
    </div>
    </PrimitiveWrapper>
  )
}
