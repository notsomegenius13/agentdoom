'use client'

import { useState, useEffect } from 'react'

export type Breakpoint = 'mobile' | 'tablet' | 'desktop'

const BREAKPOINTS = {
  mobile: 0,
  tablet: 640,
  desktop: 1024,
} as const

function getBreakpoint(): Breakpoint {
  if (typeof window === 'undefined') return 'desktop'
  const w = window.innerWidth
  if (w >= BREAKPOINTS.desktop) return 'desktop'
  if (w >= BREAKPOINTS.tablet) return 'tablet'
  return 'mobile'
}

/**
 * Returns the current breakpoint: 'mobile' | 'tablet' | 'desktop'.
 * Updates on window resize.
 */
export function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>(getBreakpoint)

  useEffect(() => {
    const handler = () => setBp(getBreakpoint())
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  return bp
}

/** Returns true when on mobile or tablet. */
export function useIsMobile(): boolean {
  return useBreakpoint() === 'mobile'
}

export { BREAKPOINTS }
