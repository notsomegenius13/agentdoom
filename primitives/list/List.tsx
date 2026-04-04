'use client'

import React, { useState, useCallback } from 'react'
import { AppearanceConfig, PrimitiveWrapper } from '../theme'

export interface ListConfig {
  title: string
  items?: string[]
  addable?: boolean
  removable?: boolean
  reorderable?: boolean
  placeholder?: string
  appearance?: AppearanceConfig
}

export default function List({ config }: { config: ListConfig }) {
  const [items, setItems] = useState<string[]>(config.items ?? [])
  const [inputValue, setInputValue] = useState('')

  const canAdd = config.addable !== false
  const canRemove = config.removable !== false
  const canReorder = config.reorderable === true

  const addItem = useCallback(() => {
    const val = inputValue.trim()
    if (!val) return
    setItems(prev => [...prev, val])
    setInputValue('')
  }, [inputValue])

  const removeItem = useCallback((index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }, [])

  const moveItem = useCallback((index: number, direction: 'up' | 'down') => {
    setItems(prev => {
      const next = [...prev]
      const target = direction === 'up' ? index - 1 : index + 1
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') addItem()
  }, [addItem])

  return (
    <PrimitiveWrapper appearance={config.appearance}>
      <div
        className="rounded-xl p-6 shadow-sm"
        style={{ backgroundColor: 'var(--doom-surface, white)', color: 'var(--doom-text-primary, #18181b)' }}
      >
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--doom-text-primary, #111827)' }}>
          {config.title}
        </h2>

        {items.length === 0 && (
          <p className="text-sm text-gray-400 mb-4 italic">No items yet. {canAdd ? 'Add one below.' : ''}</p>
        )}

        <ul className="space-y-2 mb-4" aria-label={config.title}>
          {items.map((item, index) => (
            <li
              key={index}
              className="flex items-center gap-2 rounded-lg px-3 py-2 bg-gray-50 group"
              style={{ backgroundColor: 'var(--doom-surface-secondary, #f9fafb)' }}
            >
              <span
                className="flex-1 text-sm"
                style={{ color: 'var(--doom-text-primary, #111827)' }}
              >
                {item}
              </span>

              {canReorder && (
                <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => moveItem(index, 'up')}
                    disabled={index === 0}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-20 leading-none text-xs px-1"
                    aria-label={`Move "${item}" up`}
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveItem(index, 'down')}
                    disabled={index === items.length - 1}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-20 leading-none text-xs px-1"
                    aria-label={`Move "${item}" down`}
                  >
                    ▼
                  </button>
                </div>
              )}

              {canRemove && (
                <button
                  onClick={() => removeItem(index)}
                  className="text-gray-300 hover:text-red-500 transition-colors text-sm font-bold opacity-0 group-hover:opacity-100 px-1"
                  aria-label={`Remove "${item}"`}
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>

        {canAdd && (
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={config.placeholder ?? 'Add item...'}
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              aria-label="New item"
            />
            <button
              onClick={addItem}
              disabled={!inputValue.trim()}
              className="rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white px-4 py-2 text-sm font-medium transition-colors"
            >
              Add
            </button>
          </div>
        )}
      </div>
    </PrimitiveWrapper>
  )
}
