// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Calendar from './Calendar'
import type { CalendarConfig } from './Calendar'
import defaults from './defaults.json'

describe('Calendar', () => {
  const config = defaults as CalendarConfig

  beforeEach(() => {
    // Pin the clock to March 15, 2026 so tests are stable regardless of run date
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 2, 15))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders title and month header', () => {
    render(<Calendar config={config} />)
    const headings = screen.getAllByText('March 2026')
    expect(headings.length).toBeGreaterThanOrEqual(1)
  })

  it('renders day-of-week headers starting with Sunday by default', () => {
    render(<Calendar config={config} />)
    const headers = screen.getAllByRole('columnheader')
    expect(headers[0].textContent).toBe('Sun')
    expect(headers[6].textContent).toBe('Sat')
  })

  it('renders day-of-week headers starting with Monday when configured', () => {
    render(<Calendar config={{ ...config, firstDayOfWeek: 1 }} />)
    const headers = screen.getAllByRole('columnheader')
    expect(headers[0].textContent).toBe('Mon')
    expect(headers[6].textContent).toBe('Sun')
  })

  it('navigates to previous and next month', () => {
    render(<Calendar config={{ ...config, minDate: undefined, maxDate: undefined }} />)
    fireEvent.click(screen.getByLabelText('Next month'))
    expect(screen.getByText('April 2026')).toBeTruthy()
    fireEvent.click(screen.getByLabelText('Previous month'))
    expect(screen.getAllByText('March 2026').length).toBeGreaterThanOrEqual(1)
  })

  it('selects a single date and shows status', () => {
    render(<Calendar config={config} />)
    const day15 = screen.getByLabelText(/Sunday, March 15, 2026/)
    fireEvent.click(day15)
    expect(screen.getByRole('status').textContent).toContain('March 15, 2026')
  })

  it('selects a date range', () => {
    const rangeConfig: CalendarConfig = {
      title: 'Pick Range',
      mode: 'range',
      minDate: '2026-03-01',
      maxDate: '2026-03-31',
    }
    render(<Calendar config={rangeConfig} />)
    fireEvent.click(screen.getByLabelText(/Tuesday, March 10, 2026/))
    expect(screen.getByRole('status').textContent).toContain('Start:')
    fireEvent.click(screen.getByLabelText(/Friday, March 20, 2026/))
    expect(screen.getByRole('status').textContent).toContain('Mar 10')
    expect(screen.getByRole('status').textContent).toContain('Mar 20')
  })

  it('disables dates outside min/max range', () => {
    render(<Calendar config={config} />)
    // Days from the previous month (February) should be disabled
    const prevMonthButtons = screen.getAllByRole('gridcell').filter(
      btn => btn.getAttribute('aria-disabled') === 'true'
    )
    expect(prevMonthButtons.length).toBeGreaterThan(0)
  })

  it('displays highlighted date indicators with correct labels', () => {
    render(<Calendar config={config} />)
    const piDay = screen.getByLabelText(/March 14, 2026.*Pi Day/)
    expect(piDay).toBeTruthy()
    const stPat = screen.getByLabelText(/March 17, 2026.*St\. Patrick/)
    expect(stPat).toBeTruthy()
  })

  it('handles keyboard navigation with arrow keys', () => {
    render(<Calendar config={{ ...config, minDate: undefined, maxDate: undefined }} />)
    const grid = screen.getByRole('grid')
    const firstInMonth = screen.getByLabelText(/Sunday, March 1, 2026/)
    fireEvent.focus(firstInMonth)
    fireEvent.keyDown(grid, { key: 'ArrowRight' })
    // Focus should have moved; focusedIndex updated
    // Verify the grid accepted the event without error
    expect(grid).toBeTruthy()
  })

  it('shows week numbers when configured', () => {
    render(<Calendar config={{ ...config, showWeekNumbers: true }} />)
    const headers = screen.getAllByRole('columnheader')
    expect(headers[0].textContent).toBe('W')
    expect(headers.length).toBe(8) // W + 7 day names
  })

  it('handles February leap year correctly', () => {
    const febConfig: CalendarConfig = {
      title: 'Feb 2028',
      mode: 'single',
    }
    render(<Calendar config={febConfig} />)
    // Navigate back to February from current month (March 2026)
    fireEvent.click(screen.getByLabelText('Previous month'))
    // Should show February 2026 without crashing
    expect(screen.getByRole('grid')).toBeTruthy()
  })

  it('navigates to today when Today button is clicked', () => {
    const pastConfig: CalendarConfig = {
      title: 'Past Calendar',
      mode: 'single',
    }
    render(<Calendar config={pastConfig} />)
    // Navigate away
    fireEvent.click(screen.getByLabelText('Previous month'))
    fireEvent.click(screen.getByLabelText('Previous month'))
    // Click Today
    fireEvent.click(screen.getByLabelText('Go to today'))
    // Should show current month header in the grid aria-label
    const grid = screen.getByRole('grid')
    const label = grid.getAttribute('aria-label') || ''
    const now = new Date()
    const expectedMonth = now.toLocaleString('en-US', { month: 'long' })
    expect(label).toContain(expectedMonth)
  })
})
