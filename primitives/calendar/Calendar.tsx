'use client'

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { AppearanceConfig, PrimitiveWrapper } from '../theme'

export interface CalendarConfig {
  title: string
  mode: 'single' | 'range'
  minDate?: string
  maxDate?: string
  highlightedDates?: { date: string; label: string; color?: string }[]
  firstDayOfWeek?: 0 | 1
  showWeekNumbers?: boolean
  appearance?: AppearanceConfig
}

interface DayCell {
  date: Date
  day: number
  inMonth: boolean
  iso: string
}

function toISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function getWeekNumber(d: Date): number {
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  target.setDate(target.getDate() + 3 - ((target.getDay() + 6) % 7))
  const jan4 = new Date(target.getFullYear(), 0, 4)
  return 1 + Math.round(((target.getTime() - jan4.getTime()) / 86400000 - 3 + ((jan4.getDay() + 6) % 7)) / 7)
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

const DAY_NAMES_SUN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_NAMES_MON = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export default function Calendar({ config }: { config: CalendarConfig }) {
  const { title, mode, minDate, maxDate, highlightedDates, firstDayOfWeek = 0, showWeekNumbers = false } = config

  const today = useMemo(() => new Date(), [])
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [rangeStart, setRangeStart] = useState<string | null>(null)
  const [rangeEnd, setRangeEnd] = useState<string | null>(null)
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null)
  const [transitionDir, setTransitionDir] = useState<'left' | 'right' | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  const minD = useMemo(() => (minDate ? parseISO(minDate) : null), [minDate])
  const maxD = useMemo(() => (maxDate ? parseISO(maxDate) : null), [maxDate])

  const highlightMap = useMemo(() => {
    const map = new Map<string, { label: string; color: string }>()
    if (highlightedDates) {
      for (const h of highlightedDates) {
        map.set(h.date, { label: h.label, color: h.color || 'bg-yellow-200' })
      }
    }
    return map
  }, [highlightedDates])

  const dayNames = firstDayOfWeek === 1 ? DAY_NAMES_MON : DAY_NAMES_SUN

  const days: DayCell[] = useMemo(() => {
    const result: DayCell[] = []
    const daysInMonth = getDaysInMonth(viewYear, viewMonth)
    const firstOfMonth = new Date(viewYear, viewMonth, 1)
    let startDow = firstOfMonth.getDay()
    if (firstDayOfWeek === 1) {
      startDow = (startDow + 6) % 7
    }

    // Previous month padding
    const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1
    const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear
    const daysInPrev = getDaysInMonth(prevYear, prevMonth)
    for (let i = startDow - 1; i >= 0; i--) {
      const d = new Date(prevYear, prevMonth, daysInPrev - i)
      result.push({ date: d, day: d.getDate(), inMonth: false, iso: toISO(d) })
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewYear, viewMonth, d)
      result.push({ date, day: d, inMonth: true, iso: toISO(date) })
    }

    // Next month padding to fill grid (always show 6 rows = 42 cells)
    const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1
    const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear
    let nextDay = 1
    while (result.length < 42) {
      const d = new Date(nextYear, nextMonth, nextDay)
      result.push({ date: d, day: nextDay, inMonth: false, iso: toISO(d) })
      nextDay++
    }

    return result
  }, [viewYear, viewMonth, firstDayOfWeek])

  const navigate = useCallback((dir: -1 | 1) => {
    setTransitionDir(dir === -1 ? 'right' : 'left')
    setViewMonth(prev => {
      const next = prev + dir
      if (next < 0) {
        setViewYear(y => y - 1)
        return 11
      }
      if (next > 11) {
        setViewYear(y => y + 1)
        return 0
      }
      return next
    })
    setTimeout(() => setTransitionDir(null), 200)
  }, [])

  const goToday = useCallback(() => {
    setTransitionDir(null)
    setViewYear(today.getFullYear())
    setViewMonth(today.getMonth())
  }, [today])

  const isDisabled = useCallback((d: Date): boolean => {
    if (minD && d < minD && !isSameDay(d, minD)) return true
    if (maxD && d > maxD && !isSameDay(d, maxD)) return true
    return false
  }, [minD, maxD])

  const handleSelect = useCallback((cell: DayCell) => {
    if (!cell.inMonth || isDisabled(cell.date)) return
    if (mode === 'single') {
      setSelectedDate(cell.iso)
    } else {
      if (!rangeStart || rangeEnd) {
        setRangeStart(cell.iso)
        setRangeEnd(null)
      } else {
        const start = parseISO(rangeStart)
        if (cell.date < start) {
          setRangeStart(cell.iso)
          setRangeEnd(rangeStart)
        } else {
          setRangeEnd(cell.iso)
        }
      }
    }
  }, [mode, rangeStart, rangeEnd, isDisabled])

  const isInRange = useCallback((iso: string): boolean => {
    if (mode !== 'range' || !rangeStart || !rangeEnd) return false
    return iso >= rangeStart && iso <= rangeEnd
  }, [mode, rangeStart, rangeEnd])

  const isRangeEdge = useCallback((iso: string): boolean => {
    if (mode !== 'range') return false
    return iso === rangeStart || iso === rangeEnd
  }, [mode, rangeStart, rangeEnd])

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const idx = focusedIndex ?? days.findIndex(d => d.inMonth)
    let next = idx

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault()
        next = Math.min(idx + 1, days.length - 1)
        break
      case 'ArrowLeft':
        e.preventDefault()
        next = Math.max(idx - 1, 0)
        break
      case 'ArrowDown':
        e.preventDefault()
        next = Math.min(idx + 7, days.length - 1)
        break
      case 'ArrowUp':
        e.preventDefault()
        next = Math.max(idx - 7, 0)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        handleSelect(days[idx])
        return
      default:
        return
    }

    setFocusedIndex(next)
  }, [focusedIndex, days, handleSelect])

  // Focus the active cell when focusedIndex changes
  useEffect(() => {
    if (focusedIndex !== null && gridRef.current) {
      const buttons = gridRef.current.querySelectorAll<HTMLButtonElement>('[data-day-btn]')
      buttons[focusedIndex]?.focus()
    }
  }, [focusedIndex])

  const weeks: DayCell[][] = useMemo(() => {
    const result: DayCell[][] = []
    for (let i = 0; i < days.length; i += 7) {
      result.push(days.slice(i, i + 7))
    }
    return result
  }, [days])

  return (
    <PrimitiveWrapper appearance={config.appearance}>
    <div className="bg-white rounded-xl p-6 shadow-sm select-none">
      <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--doom-text-primary, #111827)' }}>{title}</h2>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Previous month"
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <button
            type="button"
            onClick={goToday}
            aria-label="Go to today"
            className="text-xs px-2 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            Today
          </button>
        </div>

        <button
          type="button"
          onClick={() => navigate(1)}
          aria-label="Next month"
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Grid */}
      <div
        ref={gridRef}
        role="grid"
        aria-label={`${MONTH_NAMES[viewMonth]} ${viewYear}`}
        onKeyDown={handleKeyDown}
        className={`transition-opacity duration-200 ${transitionDir ? 'opacity-0' : 'opacity-100'}`}
      >
        {/* Day headers */}
        <div className={`grid ${showWeekNumbers ? 'grid-cols-8' : 'grid-cols-7'} mb-1`} role="row">
          {showWeekNumbers && (
            <div className="text-[10px] text-gray-400 text-center py-1 font-medium" role="columnheader">W</div>
          )}
          {dayNames.map(name => (
            <div key={name} className="text-xs text-gray-500 text-center py-1 font-medium" role="columnheader">
              {name}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className={`grid ${showWeekNumbers ? 'grid-cols-8' : 'grid-cols-7'}`} role="row">
            {showWeekNumbers && (
              <div className="text-[10px] text-gray-400 flex items-center justify-center" aria-label={`Week ${getWeekNumber(week.find(d => d.inMonth)?.date || week[0].date)}`}>
                {getWeekNumber(week.find(d => d.inMonth)?.date || week[0].date)}
              </div>
            )}
            {week.map((cell, di) => {
              const idx = wi * 7 + di
              const disabled = isDisabled(cell.date)
              const isToday = isSameDay(cell.date, today)
              const isSelected = mode === 'single' && selectedDate === cell.iso
              const inRange = isInRange(cell.iso)
              const isEdge = isRangeEdge(cell.iso)
              const highlight = highlightMap.get(cell.iso)

              let cellClasses = 'relative w-full aspect-square flex items-center justify-center text-sm rounded-lg transition-colors duration-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-inset'

              if (!cell.inMonth) {
                cellClasses += ' text-gray-300 cursor-default'
              } else if (disabled) {
                cellClasses += ' text-gray-300 cursor-not-allowed'
              } else if (isSelected || isEdge) {
                cellClasses += ' bg-purple-600 text-white font-semibold cursor-pointer'
              } else if (inRange) {
                cellClasses += ' bg-purple-100 text-purple-800 cursor-pointer'
              } else if (isToday) {
                cellClasses += ' font-bold text-purple-600 ring-1 ring-purple-300 cursor-pointer'
              } else {
                cellClasses += ' text-gray-700 hover:bg-gray-100 cursor-pointer'
              }

              const ariaLabel = cell.date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }) + (highlight ? `, ${highlight.label}` : '') + (isToday ? ', today' : '')

              return (
                <button
                  key={cell.iso}
                  type="button"
                  data-day-btn
                  data-date={cell.iso}
                  role="gridcell"
                  tabIndex={focusedIndex === idx ? 0 : -1}
                  aria-label={ariaLabel}
                  aria-selected={isSelected || isEdge || undefined}
                  aria-disabled={disabled || !cell.inMonth || undefined}
                  disabled={disabled || !cell.inMonth}
                  onClick={() => handleSelect(cell)}
                  onFocus={() => setFocusedIndex(idx)}
                  className={cellClasses}
                >
                  {cell.day}
                  {highlight && cell.inMonth && (
                    <span
                      className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${highlight.color}`}
                      title={highlight.label}
                      aria-hidden="true"
                    />
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* Selection display */}
      {mode === 'single' && selectedDate && (
        <p className="text-xs text-gray-500 mt-3 text-center" role="status">
          Selected: {parseISO(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      )}
      {mode === 'range' && rangeStart && (
        <p className="text-xs text-gray-500 mt-3 text-center" role="status">
          {rangeEnd
            ? `${parseISO(rangeStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${parseISO(rangeEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
            : `Start: ${parseISO(rangeStart).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`}
        </p>
      )}
    </div>
    </PrimitiveWrapper>
  )
}
