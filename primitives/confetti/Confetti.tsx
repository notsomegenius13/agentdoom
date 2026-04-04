'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { AppearanceConfig, PrimitiveWrapper } from '../theme'

export interface ConfettiParticle {
  color: string
}

export interface ConfettiConfig {
  title?: string
  buttonLabel?: string
  particleCount?: number
  duration?: number
  colors?: string[]
  spread?: number
  autoTrigger?: boolean
  appearance?: AppearanceConfig
}

interface Particle {
  id: number
  x: number
  y: number
  color: string
  rotation: number
  scale: number
  dx: number
  dy: number
  dr: number
  opacity: number
}

export default function Confetti({ config }: { config: ConfettiConfig }) {
  const {
    title,
    buttonLabel = 'Celebrate!',
    particleCount = 40,
    duration = 2000,
    colors = ['#7c3aed', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#ec4899'],
    spread = 180,
    autoTrigger = false,
  } = config

  const [particles, setParticles] = useState<Particle[]>([])
  const [active, setActive] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<number>(0)
  const startTimeRef = useRef(0)

  const createParticles = useCallback(() => {
    const newParticles: Particle[] = []
    const spreadRad = (spread / 360) * Math.PI

    for (let i = 0; i < particleCount; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * spreadRad * 2
      const speed = 2 + Math.random() * 4
      newParticles.push({
        id: i,
        x: 50,
        y: 50,
        color: colors[i % colors.length],
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 0.8,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        dr: (Math.random() - 0.5) * 10,
        opacity: 1,
      })
    }
    return newParticles
  }, [particleCount, colors, spread])

  const animate = useCallback(() => {
    const elapsed = Date.now() - startTimeRef.current
    const progress = Math.min(elapsed / duration, 1)

    setParticles(prev =>
      prev.map(p => ({
        ...p,
        x: p.x + p.dx * (1 - progress * 0.5),
        y: p.y + p.dy * (1 - progress * 0.5) + progress * 2,
        rotation: p.rotation + p.dr,
        opacity: Math.max(0, 1 - progress * 1.2),
      }))
    )

    if (progress < 1) {
      frameRef.current = requestAnimationFrame(animate)
    } else {
      setActive(false)
      setParticles([])
    }
  }, [duration])

  const trigger = useCallback(() => {
    if (active) return
    setActive(true)
    setParticles(createParticles())
    startTimeRef.current = Date.now()
    frameRef.current = requestAnimationFrame(animate)
  }, [active, createParticles, animate])

  useEffect(() => {
    if (autoTrigger) trigger()
  }, [autoTrigger, trigger])

  useEffect(() => {
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [])

  return (
    <PrimitiveWrapper appearance={config.appearance}>
    <div
      className="rounded-xl p-6 shadow-sm relative overflow-hidden"
      style={{ backgroundColor: 'var(--doom-surface, white)', color: 'var(--doom-text-primary, #18181b)' }}
      ref={containerRef}
    >
      {title && <h2 className="text-lg font-semibold mb-4">{title}</h2>}

      <div className="text-center">
        <button
          onClick={trigger}
          disabled={active}
          className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          aria-label={buttonLabel}
        >
          {buttonLabel}
        </button>
      </div>

      {particles.length > 0 && (
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          role="presentation"
        >
          {particles.map(p => (
            <div
              key={p.id}
              style={{
                position: 'absolute',
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: `${8 * p.scale}px`,
                height: `${8 * p.scale}px`,
                backgroundColor: p.color,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                transform: `rotate(${p.rotation}deg)`,
                opacity: p.opacity,
                willChange: 'transform, opacity',
              }}
            />
          ))}
        </div>
      )}
    </div>
    </PrimitiveWrapper>
  )
}
