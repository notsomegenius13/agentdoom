'use client'

import React, { useState, useEffect, useRef } from 'react'
import { AppearanceConfig, PrimitiveWrapper } from '../theme'

export interface ProgressFillConfig {
  title?: string
  value: number
  max?: number
  duration?: number
  showLabel?: boolean
  label?: string
  color?: string
  height?: 'sm' | 'md' | 'lg'
  striped?: boolean
  animated?: boolean
  triggerOnView?: boolean
  appearance?: AppearanceConfig
}

const heightClasses = {
  sm: 'h-2',
  md: 'h-4',
  lg: 'h-6',
} as const

export default function ProgressFill({ config }: { config: ProgressFillConfig }) {
  const {
    title,
    value,
    max = 100,
    duration = 1500,
    showLabel = true,
    label,
    color = '#7c3aed',
    height = 'md',
    striped = false,
    animated = true,
    triggerOnView = true,
  } = config

  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  const [fillWidth, setFillWidth] = useState(animated ? 0 : percentage)
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!animated) {
      setFillWidth(percentage)
      return
    }

    if (!triggerOnView) {
      setStarted(true)
      return
    }

    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true)
        }
      },
      { threshold: 0.3 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [animated, triggerOnView, started, percentage])

  useEffect(() => {
    if (!started || !animated) return

    const start = performance.now()
    let frame: number

    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setFillWidth(eased * percentage)

      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      } else {
        setFillWidth(percentage)
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [started, animated, duration, percentage])

  const displayLabel = label || `${Math.round(fillWidth)}%`

  return (
    <PrimitiveWrapper appearance={config.appearance}>
    <div
      ref={ref}
      className="rounded-xl p-6 shadow-sm"
      style={{ backgroundColor: 'var(--doom-surface, white)', color: 'var(--doom-text-primary, #18181b)' }}
    >
      {title && (
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">{title}</h2>
          {showLabel && <span className="text-sm font-medium text-gray-500">{displayLabel}</span>}
        </div>
      )}

      <div
        className={`w-full bg-gray-200 rounded-full overflow-hidden ${heightClasses[height]}`}
        role="progressbar"
        aria-valuenow={Math.round(fillWidth)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={title || 'Progress'}
      >
        <div
          className={`h-full rounded-full ${striped ? 'bg-striped' : ''}`}
          style={{
            width: `${fillWidth}%`,
            backgroundColor: color,
            transition: animated ? 'none' : `width ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
            willChange: 'width',
            backgroundImage: striped
              ? 'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)'
              : 'none',
            backgroundSize: striped ? '1rem 1rem' : 'auto',
          }}
        />
      </div>

      {!title && showLabel && (
        <div className="text-center mt-2">
          <span className="text-sm font-medium text-gray-500">{displayLabel}</span>
        </div>
      )}
    </div>
    </PrimitiveWrapper>
  )
}
