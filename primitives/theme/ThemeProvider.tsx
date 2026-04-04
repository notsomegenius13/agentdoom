'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import './theme.css'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function getSystemPreference(): Theme {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export interface ThemeProviderProps {
  /** Initial theme. When omitted the system preference is used. */
  defaultTheme?: Theme
  /** Persist choice to localStorage under this key. Set to false to disable. */
  storageKey?: string | false
  children: React.ReactNode
}

export function ThemeProvider({
  defaultTheme,
  storageKey = 'doom-theme',
  children,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // 1. Check localStorage
    if (storageKey && typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey)
      if (stored === 'light' || stored === 'dark') return stored
    }
    // 2. Explicit default
    if (defaultTheme) return defaultTheme
    // 3. System preference
    return getSystemPreference()
  })

  // Persist on change
  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, theme)
    }
  }, [theme, storageKey])

  // Listen for system preference changes when no explicit choice has been stored
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      if (storageKey && localStorage.getItem(storageKey)) return
      setThemeState(e.matches ? 'dark' : 'light')
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [storageKey])

  const setTheme = useCallback(
    (next: Theme) => setThemeState(next),
    [],
  )

  const toggleTheme = useCallback(
    () => setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark')),
    [],
  )

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  )

  return (
    <ThemeContext.Provider value={value}>
      <div data-theme={theme}>{children}</div>
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within a <ThemeProvider>')
  }
  return ctx
}
