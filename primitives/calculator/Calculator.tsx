'use client'

import React, { useState, useMemo } from 'react'
import { AppearanceConfig, PrimitiveWrapper } from '../theme'

export interface CalcInput {
  name: string
  label: string
  type: 'number' | 'select'
  defaultValue?: number
  min?: number
  max?: number
  step?: number
  options?: { label: string; value: number }[]
}

export interface CalculatorConfig {
  title: string
  inputs: CalcInput[]
  formula: string
  resultLabel: string
  resultPrefix?: string
  resultSuffix?: string
  appearance?: AppearanceConfig
}

export default function Calculator({ config }: { config: CalculatorConfig }) {
  const [values, setValues] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    for (const input of config.inputs) {
      if (input.defaultValue != null) {
        init[input.name] = input.defaultValue
      } else if (input.options?.length) {
        init[input.name] = input.options[0].value
      } else {
        init[input.name] = 0
      }
    }
    return init
  })

  const result = useMemo(() => {
    try {
      const names = Object.keys(values)
      const vals = Object.values(values)
      // eslint-disable-next-line no-new-func
      const fn = new Function(...names, `return (${config.formula})`)
      const r = fn(...vals)
      if (typeof r !== 'number' || !isFinite(r)) return null
      return r
    } catch {
      return null
    }
  }, [values, config.formula])

  const formatResult = (r: number) => {
    const formatted = r % 1 === 0 ? r.toLocaleString() : r.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    return `${config.resultPrefix || ''}${formatted}${config.resultSuffix || ''}`
  }

  return (
    <PrimitiveWrapper appearance={config.appearance}>
    <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: 'var(--doom-surface, white)', color: 'var(--doom-text-primary, #18181b)' }}>
      <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--doom-text-primary, #111827)' }}>{config.title}</h2>

      {config.inputs.map(input => (
        <div key={input.name} className="mb-3">
          <label htmlFor={`calc-${input.name}`} className="block text-sm font-medium text-gray-700 mb-1">
            {input.label}
          </label>
          {input.type === 'select' ? (
            <select
              id={`calc-${input.name}`}
              value={values[input.name] ?? ''}
              onChange={e => setValues(prev => ({ ...prev, [input.name]: Number(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {(input.options || []).map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : (
            <input
              id={`calc-${input.name}`}
              type="number"
              value={values[input.name] ?? ''}
              min={input.min}
              max={input.max}
              step={input.step}
              onChange={e => setValues(prev => ({ ...prev, [input.name]: Number(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          )}
        </div>
      ))}

      {result != null && (
        <div className="mt-4 bg-green-50 border-2 border-purple-600 rounded-lg p-4 text-center" role="status" aria-live="polite">
          <div className="text-xs text-gray-500 mb-1">{config.resultLabel}</div>
          <div className="text-3xl font-bold text-purple-600">{formatResult(result)}</div>
        </div>
      )}
    </div>
    </PrimitiveWrapper>
  )
}
