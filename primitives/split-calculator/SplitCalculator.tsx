'use client'

import React, { useState, useMemo } from 'react'
import { AppearanceConfig, PrimitiveWrapper } from '../theme'

export interface SplitCalculatorConfig {
  title: string
  currency?: string
  defaultTipPercent?: number
  defaultPeople?: number
  tipOptions?: number[]
  appearance?: AppearanceConfig
}

export default function SplitCalculator({ config }: { config: SplitCalculatorConfig }) {
  const currency = config.currency || '$'
  const [bill, setBill] = useState('')
  const [tipPercent, setTipPercent] = useState(config.defaultTipPercent ?? 18)
  const [customTip, setCustomTip] = useState('')
  const [people, setPeople] = useState(config.defaultPeople ?? 2)

  const tipOptions = config.tipOptions || [15, 18, 20, 25]
  const isCustom = !tipOptions.includes(tipPercent)

  const result = useMemo(() => {
    const billNum = parseFloat(bill)
    if (isNaN(billNum) || billNum <= 0 || people < 1) return null
    const tip = billNum * (tipPercent / 100)
    const total = billNum + tip
    const perPerson = total / people
    return { tip, total, perPerson }
  }, [bill, tipPercent, people])

  return (
    <PrimitiveWrapper appearance={config.appearance}>
    <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: 'var(--doom-surface, white)', color: 'var(--doom-text-primary, #18181b)' }}>
      <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--doom-text-primary, #111827)' }}>{config.title}</h2>

      {/* Bill amount */}
      <div className="mb-3">
        <label htmlFor="split-bill" className="block text-sm font-medium text-gray-700 mb-1">Bill Amount</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{currency}</span>
          <input
            id="split-bill"
            type="number"
            value={bill}
            onChange={e => setBill(e.target.value)}
            placeholder="0.00"
            min="0"
            step="0.01"
            className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Tip selection */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Tip Percentage</label>
        <div className="flex gap-2 flex-wrap">
          {tipOptions.map(pct => (
            <button
              key={pct}
              onClick={() => { setTipPercent(pct); setCustomTip('') }}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                tipPercent === pct && !isCustom ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {pct}%
            </button>
          ))}
          <input
            type="number"
            value={customTip}
            onChange={e => { setCustomTip(e.target.value); setTipPercent(Number(e.target.value) || 0) }}
            placeholder="Custom"
            min="0"
            max="100"
            className="w-20 px-2 py-1.5 border border-gray-300 rounded-full text-xs text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
            aria-label="Custom tip percentage"
          />
        </div>
      </div>

      {/* People */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Split Between</label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPeople(p => Math.max(1, p - 1))}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600"
            aria-label="Decrease people"
          >
            −
          </button>
          <span className="text-lg font-semibold text-gray-900 w-8 text-center">{people}</span>
          <button
            onClick={() => setPeople(p => p + 1)}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600"
            aria-label="Increase people"
          >
            +
          </button>
          <span className="text-xs text-gray-400">
            {people === 1 ? 'person' : 'people'}
          </span>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4 space-y-2" role="status" aria-live="polite">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tip</span>
            <span className="font-medium text-gray-800">{currency}{result.tip.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total</span>
            <span className="font-medium text-gray-800">{currency}{result.total.toFixed(2)}</span>
          </div>
          <div className="border-t border-purple-200 pt-2 flex justify-between">
            <span className="text-sm font-semibold text-gray-700">Per Person</span>
            <span className="text-xl font-bold text-purple-600">{currency}{result.perPerson.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
    </PrimitiveWrapper>
  )
}
