'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { AppearanceConfig, PrimitiveWrapper } from '../theme'

export interface TypingEffectConfig {
  title?: string
  text: string
  speed?: number
  startDelay?: number
  cursor?: boolean
  cursorChar?: string
  loop?: boolean
  loopDelay?: number
  triggerOnView?: boolean
  tag?: 'p' | 'h1' | 'h2' | 'h3' | 'span'
  appearance?: AppearanceConfig
}

export default function TypingEffect({ config }: { config: TypingEffectConfig }) {
  const {
    title,
    text,
    speed = 50,
    startDelay = 0,
    cursor = true,
    cursorChar = '|',
    loop = false,
    loopDelay = 2000,
    triggerOnView = true,
    tag = 'p',
  } = config

  const [displayed, setDisplayed] = useState('')
  const [showCursor, setShowCursor] = useState(true)
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const typeText = useCallback(() => {
    let i = 0

    const tick = () => {
      if (i <= text.length) {
        setDisplayed(text.slice(0, i))
        i++
        timeoutRef.current = setTimeout(tick, speed)
      } else if (loop) {
        timeoutRef.current = setTimeout(() => {
          setDisplayed('')
          i = 0
          timeoutRef.current = setTimeout(tick, speed)
        }, loopDelay)
      }
    }

    timeoutRef.current = setTimeout(tick, startDelay)
  }, [text, speed, startDelay, loop, loopDelay])

  useEffect(() => {
    if (!triggerOnView) {
      setStarted(true)
      typeText()
      return
    }

    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true)
          typeText()
        }
      },
      { threshold: 0.3 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [triggerOnView, started, typeText])

  // Cursor blink
  useEffect(() => {
    if (!cursor) return
    const interval = setInterval(() => {
      setShowCursor(prev => !prev)
    }, 530)
    return () => clearInterval(interval)
  }, [cursor])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const Tag = tag

  return (
    <PrimitiveWrapper appearance={config.appearance}>
    <div
      ref={ref}
      className="rounded-xl p-6 shadow-sm"
      style={{ backgroundColor: 'var(--doom-surface, white)', color: 'var(--doom-text-primary, #18181b)' }}
    >
      {title && <h2 className="text-lg font-semibold mb-2">{title}</h2>}
      <Tag
        className="text-base leading-relaxed min-h-[1.5em]"
        role="status"
        aria-live="polite"
        aria-label={text}
      >
        {displayed}
        {cursor && (
          <span
            className="text-purple-600 font-light"
            style={{ opacity: showCursor ? 1 : 0, transition: 'opacity 0.1s' }}
            aria-hidden="true"
          >
            {cursorChar}
          </span>
        )}
      </Tag>
    </div>
    </PrimitiveWrapper>
  )
}
