// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PricingTable from './PricingTable'
import defaults from './defaults.json'
import type { PricingTableConfig } from './PricingTable'

describe('PricingTable', () => {
  const config = defaults as PricingTableConfig

  it('renders title', () => {
    render(<PricingTable config={config} />)
    expect(screen.getByText('Simple, transparent pricing')).toBeDefined()
  })

  it('renders all tier names', () => {
    render(<PricingTable config={config} />)
    expect(screen.getByText('Starter')).toBeDefined()
    expect(screen.getByText('Pro')).toBeDefined()
    expect(screen.getByText('Enterprise')).toBeDefined()
  })

  it('shows monthly prices by default', () => {
    render(<PricingTable config={config} />)
    expect(screen.getByText('$9')).toBeDefined()
    expect(screen.getByText('$29')).toBeDefined()
    expect(screen.getByText('$99')).toBeDefined()
  })

  it('renders features', () => {
    render(<PricingTable config={config} />)
    expect(screen.getByText('5 projects')).toBeDefined()
    expect(screen.getByText('10GB storage')).toBeDefined()
    expect(screen.getAllByText('SSO').length).toBeGreaterThan(0)
  })

  it('handles empty tiers', () => {
    const emptyConfig: PricingTableConfig = {
      title: 'Pricing',
      tiers: [],
    }
    const { container } = render(<PricingTable config={emptyConfig} />)
    expect(screen.getByText('Pricing')).toBeDefined()
    expect(container.querySelectorAll('[class*="border-2"]')).toHaveLength(0)
  })
})
