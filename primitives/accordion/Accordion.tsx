'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { AppearanceConfig, PrimitiveWrapper } from '../theme'

export interface AccordionSection {
  id: string
  title: string
  content: string
  icon?: string
  disabled?: boolean
  defaultOpen?: boolean
}

export interface AccordionConfig {
  title: string
  sections: AccordionSection[]
  allowMultiple?: boolean
  bordered?: boolean
  compact?: boolean
  appearance?: AppearanceConfig
}

function AccordionItem({
  section,
  isOpen,
  onToggle,
  bordered,
  compact,
}: {
  section: AccordionSection
  isOpen: boolean
  onToggle: () => void
  bordered: boolean
  compact: boolean
}) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number | undefined>(isOpen ? undefined : 0)

  useEffect(() => {
    if (!contentRef.current) return
    if (isOpen) {
      setHeight(contentRef.current.scrollHeight)
      const timer = setTimeout(() => setHeight(undefined), 200)
      return () => clearTimeout(timer)
    } else {
      setHeight(contentRef.current.scrollHeight)
      requestAnimationFrame(() => setHeight(0))
    }
  }, [isOpen])

  const py = compact ? 'py-2' : 'py-3'

  return (
    <div
      className={`${bordered ? 'border border-gray-200 rounded-lg' : 'border-b border-gray-200 last:border-b-0'} overflow-hidden`}
    >
      <button
        onClick={section.disabled ? undefined : onToggle}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !section.disabled) {
            e.preventDefault()
            onToggle()
          }
        }}
        aria-expanded={isOpen}
        aria-controls={`accordion-panel-${section.id}`}
        aria-disabled={section.disabled}
        className={`w-full flex items-center gap-3 px-4 ${py} text-sm font-medium transition-colors ${
          section.disabled
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-800 hover:bg-gray-50 cursor-pointer'
        }`}
      >
        {section.icon && (
          <span className="text-base flex-shrink-0" aria-hidden="true">
            {section.icon}
          </span>
        )}
        <span className="flex-1 text-left">{section.title}</span>
        <span
          className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
          aria-hidden="true"
          style={{ display: 'inline-block' }}
        >
          {'\u25BC'}
        </span>
      </button>
      <div
        id={`accordion-panel-${section.id}`}
        role="region"
        aria-labelledby={`accordion-header-${section.id}`}
        style={{
          height: height !== undefined ? `${height}px` : 'auto',
          overflow: 'hidden',
          transition: 'height 200ms ease-in-out',
        }}
      >
        <div ref={contentRef} className={`px-4 pb-3 text-sm text-gray-700 leading-relaxed`}>
          {section.content}
        </div>
      </div>
    </div>
  )
}

export default function Accordion({ config }: { config: AccordionConfig }) {
  const sections = config.sections || []
  const allowMultiple = config.allowMultiple ?? true
  const bordered = config.bordered ?? true
  const compact = config.compact ?? false

  const [openIds, setOpenIds] = useState<Set<string>>(() => {
    const defaults = new Set<string>()
    for (const s of sections) {
      if (s.defaultOpen) defaults.add(s.id)
    }
    return defaults
  })

  const toggle = useCallback(
    (id: string) => {
      setOpenIds((prev) => {
        const next = new Set(prev)
        if (next.has(id)) {
          next.delete(id)
        } else {
          if (!allowMultiple) {
            next.clear()
          }
          next.add(id)
        }
        return next
      })
    },
    [allowMultiple]
  )

  return (
    <PrimitiveWrapper appearance={config.appearance}>
    <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: 'var(--doom-surface, white)', color: 'var(--doom-text-primary, #18181b)' }}>
      <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--doom-text-primary, #111827)' }}>{config.title}</h2>
      <div className={bordered ? 'space-y-2' : ''}>
        {sections.map((section) => (
          <AccordionItem
            key={section.id}
            section={section}
            isOpen={openIds.has(section.id)}
            onToggle={() => toggle(section.id)}
            bordered={bordered}
            compact={compact}
          />
        ))}
      </div>
      {sections.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">No sections to display.</p>
      )}
    </div>
    </PrimitiveWrapper>
  )
}
