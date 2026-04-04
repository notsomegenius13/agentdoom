'use client'

import React from 'react'
import { AppearanceConfig, PrimitiveWrapper } from '../theme'

export interface PriceItem {
  name: string
  description?: string
  price: number | string
  unit?: string
  featured?: boolean
}

export interface PriceListConfig {
  title: string
  items: PriceItem[]
  currency?: string
  appearance?: AppearanceConfig
}

export default function PriceList({ config }: { config: PriceListConfig }) {
  const currency = config.currency || '$'

  const formatPrice = (price: number | string) => {
    if (typeof price === 'string') return price
    return `${currency}${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <PrimitiveWrapper appearance={config.appearance}>
    <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: 'var(--doom-surface, white)', color: 'var(--doom-text-primary, #18181b)' }}>
      <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--doom-text-primary, #111827)' }}>{config.title}</h2>

      <div className="space-y-3">
        {(config.items || []).map((item, i) => (
          <div
            key={i}
            className={`flex items-start justify-between p-4 rounded-lg border-2 ${
              item.featured ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex-1 min-w-0 mr-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-800">{item.name}</h3>
                {item.featured && (
                  <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                    Popular
                  </span>
                )}
              </div>
              {item.description && (
                <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-lg font-bold text-gray-900">{formatPrice(item.price)}</span>
              {item.unit && <span className="text-xs text-gray-400 block">{item.unit}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
    </PrimitiveWrapper>
  )
}
