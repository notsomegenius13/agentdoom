// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatsDashboard from './StatsDashboard'
import defaults from './defaults.json'

describe('StatsDashboard', () => {
  const config = defaults as any

  it('renders title and stat cards', () => {
    render(<StatsDashboard config={config} />)
    expect(screen.getByText('Sales Dashboard')).toBeTruthy()
    expect(screen.getByText('Revenue')).toBeTruthy()
    expect(screen.getByText('$12.4k')).toBeTruthy()
    expect(screen.getByText('+14%')).toBeTruthy()
  })

  it('renders all stats', () => {
    render(<StatsDashboard config={config} />)
    expect(screen.getByText('Users')).toBeTruthy()
    expect(screen.getByText('Orders')).toBeTruthy()
    expect(screen.getByText('Conversion')).toBeTruthy()
  })

  it('renders chart data', () => {
    render(<StatsDashboard config={config} />)
    expect(screen.getByText('Revenue by Month')).toBeTruthy()
    expect(screen.getByText('Jan')).toBeTruthy()
    expect(screen.getByText('Feb')).toBeTruthy()
  })

  it('handles empty stats', () => {
    render(<StatsDashboard config={{ ...config, stats: [] }} />)
    expect(screen.getByText('Sales Dashboard')).toBeTruthy()
  })
})
