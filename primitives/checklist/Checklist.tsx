'use client'

import React, { useState, useCallback, useMemo } from 'react'

export interface ChecklistCategory {
  name: string
  items: string[]
}

export interface ChecklistConfig {
  title: string
  categories: ChecklistCategory[]
  showProgress?: boolean
}

export default function Checklist({ config }: { config: ChecklistConfig }) {
  const [checked, setChecked] = useState<Set<string>>(new Set())

  const allItems = useMemo(() => {
    return config.categories.flatMap((cat, ci) =>
      cat.items.map((item, ii) => `${ci}-${ii}`)
    )
  }, [config.categories])

  const toggle = useCallback((key: string) => {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const progress = allItems.length > 0
    ? (checked.size / allItems.length) * 100
    : 0

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4 text-gray-900">{config.title}</h2>

      {config.showProgress !== false && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{checked.size}/{allItems.length} complete</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="bg-gray-200 rounded-full h-2 overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <div
              className="h-full bg-purple-600 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {config.categories.map((cat, ci) => (
        <div key={ci} className="mb-4 last:mb-0">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">{cat.name}</h3>
          <ul className="space-y-1" role="list">
            {cat.items.map((item, ii) => {
              const key = `${ci}-${ii}`
              const isChecked = checked.has(key)
              return (
                <li key={key}>
                  <label className="flex items-center gap-2.5 py-1.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggle(key)}
                      className="w-4 h-4 accent-purple-600 rounded"
                    />
                    <span className={`text-sm transition-colors ${isChecked ? 'line-through text-gray-400' : 'text-gray-700 group-hover:text-gray-900'}`}>
                      {item}
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}
