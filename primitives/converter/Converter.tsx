'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { AppearanceConfig, PrimitiveWrapper } from '../theme'

export interface ConversionUnit {
  name: string
  factor: number
}

export interface ConverterConfig {
  title: string
  categories: {
    name: string
    units: ConversionUnit[]
  }[]
  appearance?: AppearanceConfig
}

export default function Converter({ config }: { config: ConverterConfig }) {
  const [catIdx, setCatIdx] = useState(0)
  const [fromIdx, setFromIdx] = useState(0)
  const [toIdx, setToIdx] = useState(1)
  const [inputVal, setInputVal] = useState('1')

  const category = config.categories[catIdx]
  const units = category?.units || []

  const result = useMemo(() => {
    const num = parseFloat(inputVal)
    if (isNaN(num) || !units[fromIdx] || !units[toIdx]) return null
    return (num * units[fromIdx].factor) / units[toIdx].factor
  }, [inputVal, fromIdx, toIdx, units])

  const swap = useCallback(() => {
    setFromIdx(toIdx)
    setToIdx(fromIdx)
  }, [fromIdx, toIdx])

  const handleCatChange = useCallback((idx: number) => {
    setCatIdx(idx)
    setFromIdx(0)
    setToIdx(Math.min(1, (config.categories[idx]?.units.length || 1) - 1))
  }, [config.categories])

  return (
    <PrimitiveWrapper appearance={config.appearance}>
    <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: 'var(--doom-surface, white)', color: 'var(--doom-text-primary, #18181b)' }}>
      <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--doom-text-primary, #111827)' }}>{config.title}</h2>

      {config.categories.length > 1 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {config.categories.map((cat, i) => (
            <button
              key={i}
              onClick={() => handleCatChange(i)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                catIdx === i ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label htmlFor="conv-input" className="block text-xs font-medium text-gray-500 mb-1">From</label>
          <div className="flex gap-2">
            <input
              id="conv-input"
              type="number"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <select
              value={fromIdx}
              onChange={e => setFromIdx(Number(e.target.value))}
              aria-label="From unit"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {units.map((u, i) => (
                <option key={i} value={i}>{u.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={swap}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
            aria-label="Swap units"
          >
            ⇅
          </button>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
          <div className="flex gap-2">
            <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-900">
              {result != null ? result.toLocaleString(undefined, { maximumFractionDigits: 6 }) : '—'}
            </div>
            <select
              value={toIdx}
              onChange={e => setToIdx(Number(e.target.value))}
              aria-label="To unit"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {units.map((u, i) => (
                <option key={i} value={i}>{u.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
    </PrimitiveWrapper>
  )
}
