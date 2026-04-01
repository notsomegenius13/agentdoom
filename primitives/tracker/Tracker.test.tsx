// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Tracker from './Tracker'
import defaults from './defaults.json'

describe('Tracker', () => {
  const config = defaults as any

  it('renders title and items', () => {
    render(<Tracker config={config} />)
    expect(screen.getByText('Daily Habits')).toBeTruthy()
    expect(screen.getByText('Drink 8 glasses of water')).toBeTruthy()
    expect(screen.getByText('Exercise 30 minutes')).toBeTruthy()
  })

  it('shows progress bar at 0%', () => {
    render(<Tracker config={config} />)
    expect(screen.getByText('0/4 complete')).toBeTruthy()
    expect(screen.getByText('0%')).toBeTruthy()
  })

  it('toggles item completion', () => {
    render(<Tracker config={config} />)
    const btn = screen.getByText('Drink 8 glasses of water').closest('button')!
    fireEvent.click(btn)
    expect(screen.getByText('1/4 complete')).toBeTruthy()
    expect(screen.getByText('25%')).toBeTruthy()
  })

  it('shows streak on toggle', () => {
    render(<Tracker config={config} />)
    const btn = screen.getByText('Meditate').closest('button')!
    fireEvent.click(btn)
    expect(screen.getByText('🔥1')).toBeTruthy()
  })

  it('shows period label', () => {
    render(<Tracker config={config} />)
    expect(screen.getByText('daily tracker')).toBeTruthy()
  })
})
