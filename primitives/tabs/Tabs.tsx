'use client'

import React, { useState, useRef, useCallback } from 'react'
import { AppearanceConfig, PrimitiveWrapper } from '../theme'

export interface TabItem {
  id: string
  label: string
  content: string
}

export interface TabsConfig {
  title: string
  items: TabItem[]
  mode: 'tabs' | 'accordion'
  defaultActiveId?: string
  appearance?: AppearanceConfig
}

export default function Tabs({ config }: { config: TabsConfig }) {
  const items = config.items || []
  const defaultId = config.defaultActiveId || (items.length > 0 ? items[0].id : '')
  const [activeId, setActiveId] = useState(defaultId)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    new Set(config.defaultActiveId ? [config.defaultActiveId] : items.length > 0 ? [items[0].id] : [])
  )
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const handleTabKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      let nextIndex = index
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        nextIndex = (index + 1) % items.length
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        nextIndex = (index - 1 + items.length) % items.length
      }
      if (nextIndex !== index) {
        setActiveId(items[nextIndex].id)
        tabRefs.current[nextIndex]?.focus()
      }
    },
    [items]
  )

  const toggleAccordion = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const handleAccordionKeyDown = useCallback(
    (e: React.KeyboardEvent, id: string) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        toggleAccordion(id)
      }
    },
    [toggleAccordion]
  )

  const activeItem = items.find((item) => item.id === activeId)

  return (
    <PrimitiveWrapper appearance={config.appearance}>
    <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: 'var(--doom-surface, white)', color: 'var(--doom-text-primary, #18181b)' }}>
      <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--doom-text-primary, #111827)' }}>{config.title}</h2>

      {config.mode === 'tabs' ? (
        <div>
          <div role="tablist" className="flex border-b border-gray-200 mb-4">
            {items.map((item, i) => (
              <button
                key={item.id}
                ref={(el) => { tabRefs.current[i] = el }}
                role="tab"
                id={`tab-${item.id}`}
                aria-selected={activeId === item.id}
                aria-controls={`panel-${item.id}`}
                tabIndex={activeId === item.id ? 0 : -1}
                onClick={() => setActiveId(item.id)}
                onKeyDown={(e) => handleTabKeyDown(e, i)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeId === item.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          {activeItem && (
            <div
              role="tabpanel"
              id={`panel-${activeItem.id}`}
              aria-labelledby={`tab-${activeItem.id}`}
              className="text-sm text-gray-700 leading-relaxed"
            >
              {activeItem.content}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const isOpen = expandedIds.has(item.id)
            return (
              <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleAccordion(item.id)}
                  onKeyDown={(e) => handleAccordionKeyDown(e, item.id)}
                  aria-expanded={isOpen}
                  aria-controls={`accordion-${item.id}`}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors"
                >
                  <span>{item.label}</span>
                  <span className="text-gray-400">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen && (
                  <div
                    id={`accordion-${item.id}`}
                    className="px-4 pb-3 text-sm text-gray-700 leading-relaxed"
                  >
                    {item.content}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
    </PrimitiveWrapper>
  )
}
