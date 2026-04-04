'use client'

import React, { useState, useEffect, useRef } from 'react'
import { AppearanceConfig, PrimitiveWrapper } from '../theme'

export interface SlideRevealConfig {
  title?: string
  direction?: 'left' | 'right' | 'top' | 'bottom'
  duration?: number
  delay?: number
  distance?: number
  triggerOnView?: boolean
  children?: React.ReactNode
  content?: string
  appearance?: AppearanceConfig
}

const directionTransforms: Record<string, (distance: number) => string> = {
  left: (d) => `translateX(-${d}px)`,
  right: (d) => `translateX(${d}px)`,
  top: (d) => `translateY(-${d}px)`,
  bottom: (d) => `translateY(${d}px)`,
}

export default function SlideReveal({ config, children }: { config: SlideRevealConfig; children?: React.ReactNode }) {
  const {
    title,
    direction = 'left',
    duration = 600,
    delay = 0,
    distance = 40,
    triggerOnView = true,
    content,
  } = config

  const [visible, setVisible] = useState(!triggerOnView)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!triggerOnView) {
      const timeout = setTimeout(() => setVisible(true), delay)
      return () => clearTimeout(timeout)
    }

    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay)
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [triggerOnView, delay])

  const getTransform = directionTransforms[direction] || directionTransforms.left

  return (
    <PrimitiveWrapper appearance={config.appearance}>
    <div
      ref={ref}
      className="rounded-xl p-6 shadow-sm"
      style={{
        backgroundColor: 'var(--doom-surface, white)',
        color: 'var(--doom-text-primary, #18181b)',
        transform: visible ? 'translate(0, 0)' : getTransform(distance),
        opacity: visible ? 1 : 0,
        transition: `transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1), opacity ${duration}ms ease-out`,
        willChange: 'transform, opacity',
      }}
    >
      {title && <h2 className="text-lg font-semibold mb-2">{title}</h2>}
      {content && <p className="text-base text-gray-600">{content}</p>}
      {children}
    </div>
    </PrimitiveWrapper>
  )
}
