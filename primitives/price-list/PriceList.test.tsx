// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PriceList from './PriceList'
import defaults from './defaults.json'

describe('PriceList', () => {
  const config = defaults as any

  it('renders title and items', () => {
    render(<PriceList config={config} />)
    expect(screen.getByText('Pricing')).toBeTruthy()
    expect(screen.getByText('Starter')).toBeTruthy()
    expect(screen.getByText('Pro')).toBeTruthy()
    expect(screen.getByText('Enterprise')).toBeTruthy()
  })

  it('formats prices', () => {
    render(<PriceList config={config} />)
    expect(screen.getByText('$9.99')).toBeTruthy()
    expect(screen.getByText('$29.99')).toBeTruthy()
    expect(screen.getByText('Contact us')).toBeTruthy()
  })

  it('shows featured badge', () => {
    render(<PriceList config={config} />)
    expect(screen.getByText('Popular')).toBeTruthy()
  })

  it('shows descriptions', () => {
    render(<PriceList config={config} />)
    expect(screen.getByText('For individuals')).toBeTruthy()
    expect(screen.getByText('For teams')).toBeTruthy()
  })

  it('handles empty items', () => {
    render(<PriceList config={{ ...config, items: [] }} />)
    expect(screen.getByText('Pricing')).toBeTruthy()
  })
})
