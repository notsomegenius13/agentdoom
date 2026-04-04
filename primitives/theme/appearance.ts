'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useBreakpoint, type Breakpoint } from './useBreakpoint'

/* ------------------------------------------------------------------ */
/*  Shared config types – every primitive can include these optionally */
/* ------------------------------------------------------------------ */

export interface AnimationConfig {
  /** Entrance animation style */
  entrance?: 'none' | 'fade' | 'slide' | 'scale'
  /** Duration in ms (default 300) */
  duration?: number
  /** Delay before animation starts in ms (default 0) */
  delay?: number
}

export interface DarkModeColors {
  background?: string
  surface?: string
  text?: string
  textSecondary?: string
  accent?: string
  border?: string
}

export interface ResponsiveConfig {
  /** Padding per breakpoint (CSS value, e.g. "16px", "1.5rem") */
  padding?: { mobile?: string; tablet?: string; desktop?: string }
  /** Max-width per breakpoint */
  maxWidth?: { mobile?: string; tablet?: string; desktop?: string }
  /** Font scale factor per breakpoint (1 = default) */
  fontSize?: { mobile?: number; tablet?: number; desktop?: number }
}

export interface AppearanceConfig {
  animation?: AnimationConfig
  darkMode?: DarkModeColors
  responsive?: ResponsiveConfig
}

/* ------------------------------------------------------------------ */
/*  Wrapper component                                                  */
/* ------------------------------------------------------------------ */

const ENTRANCE_KEYFRAMES: Record<string, string> = {
  fade: 'doomFadeIn',
  slide: 'doomSlideIn',
  scale: 'doomScaleIn',
}

/**
 * Wraps a primitive with appearance config support:
 * - Entrance animations
 * - Responsive padding / max-width / font-size
 * - Dark-mode color overrides via CSS custom properties
 */
export function PrimitiveWrapper({
  appearance,
  className,
  children,
}: {
  appearance?: AppearanceConfig
  className?: string
  children: React.ReactNode
}) {
  const bp = useBreakpoint()
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  const anim = appearance?.animation
  const entrance = anim?.entrance ?? 'none'
  const duration = anim?.duration ?? 300
  const delay = anim?.delay ?? 0

  useEffect(() => {
    if (entrance === 'none') {
      setVisible(true)
      return
    }
    const timer = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(timer)
  }, [entrance, delay])

  // Build inline styles
  const style = buildResponsiveStyle(appearance?.responsive, bp)

  // Dark mode overrides as CSS custom properties
  if (appearance?.darkMode) {
    const dm = appearance.darkMode
    if (dm.background) style['--doom-surface' as string] = dm.background
    if (dm.surface) style['--doom-surface' as string] = dm.surface
    if (dm.text) style['--doom-text-primary' as string] = dm.text
    if (dm.textSecondary) style['--doom-text-secondary' as string] = dm.textSecondary
    if (dm.accent) style['--doom-accent' as string] = dm.accent
    if (dm.border) style['--doom-border' as string] = dm.border
  }

  // Animation
  if (entrance !== 'none' && visible) {
    style.animation = `${ENTRANCE_KEYFRAMES[entrance]} ${duration}ms ease-out forwards`
  }
  if (entrance !== 'none' && !visible) {
    style.opacity = '0'
  }

  return React.createElement(
    'div',
    { ref, className, style },
    children,
  )
}

function buildResponsiveStyle(
  responsive: ResponsiveConfig | undefined,
  bp: Breakpoint,
): Record<string, string> {
  const style: Record<string, string> = {}
  if (!responsive) return style

  if (responsive.padding) {
    const pad = responsive.padding[bp] ?? responsive.padding.mobile
    if (pad) style.padding = pad
  }
  if (responsive.maxWidth) {
    const mw = responsive.maxWidth[bp] ?? responsive.maxWidth.desktop
    if (mw) style.maxWidth = mw
  }
  if (responsive.fontSize) {
    const scale = responsive.fontSize[bp] ?? responsive.fontSize.mobile ?? 1
    if (scale !== 1) style.fontSize = `${scale}em`
  }

  return style
}
