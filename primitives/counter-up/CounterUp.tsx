'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { AppearanceConfig, PrimitiveWrapper } from '../theme'

export interface CounterUpConfig {
  title?: string
  target: number
  duration?: number
  prefix?: string
  suffix?: string
  decimals?: number
  separator?: boolean
  triggerOnView?: boolean
  easing?: 'linear' | 'easeOut' | 'easeInOut'
  appearance?: AppearanceConfig
}

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

const easingFns: Record<string, (t: number) => number> = {
  linear: (t: number) => t,
  easeOut,
  easeInOut,
}

export default function CounterUp({ config }: { config: CounterUpConfig }) {
  const {
    title,
    target,
    duration = 2000,
    prefix = '',
    suffix = '',
    decimals = 0,
    separator = true,
    triggerOnView = true,
    easing = 'easeOut',
  } = config

  const [value, setValue] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const frameRef = useRef<number>(0)

  const animate = useCallback(() => {
    const easeFn = easingFns[easing] || easeOut
    const start = performance.now()

    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = easeFn(progress)
      setValue(eased * target)

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        setValue(target)
      }
    }

    frameRef.current = requestAnimationFrame(tick)
  }, [target, duration, easing])

  useEffect(() => {
    if (!triggerOnView) {
      setStarted(true)
      animate()
      return
    }

    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true)
          animate()
        }
      },
      { threshold: 0.3 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [triggerOnView, started, animate])

  useEffect(() => {
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [])

  const formatValue = (v: number) => {
    const fixed = v.toFixed(decimals)
    if (!separator) return fixed
    const [int, dec] = fixed.split('.')
    const formatted = parseInt(int, 10).toLocaleString()
    return dec !== undefined ? `${formatted}.${dec}` : formatted
  }

  return (
    <PrimitiveWrapper appearance={config.appearance}>
    <div
      ref={ref}
      className="rounded-xl p-6 shadow-sm text-center"
      style={{ backgroundColor: 'var(--doom-surface, white)', color: 'var(--doom-text-primary, #18181b)' }}
    >
      {title && <h2 className="text-lg font-semibold mb-2">{title}</h2>}
      <div
        className="text-5xl font-bold font-mono tabular-nums text-purple-600"
        role="status"
        aria-live="polite"
        aria-label={`${prefix}${formatValue(target)}${suffix}`}
      >
        {prefix}{formatValue(value)}{suffix}
      </div>
    </div>
    </PrimitiveWrapper>
  )
}
