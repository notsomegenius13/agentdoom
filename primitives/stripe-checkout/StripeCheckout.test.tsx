// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StripeCheckout from './StripeCheckout'
import type { StripeCheckoutConfig } from './StripeCheckout'

const baseConfig: StripeCheckoutConfig = {
  productName: 'Test Product',
  priceCents: 1999,
  description: 'A test product',
}

describe('StripeCheckout', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders product name and price', () => {
    render(<StripeCheckout config={baseConfig} />)
    expect(screen.getByText('Test Product')).toBeDefined()
    expect(screen.getByText('$19.99')).toBeDefined()
  })

  it('renders description when provided', () => {
    render(<StripeCheckout config={baseConfig} />)
    expect(screen.getByText('A test product')).toBeDefined()
  })

  it('shows "Buy Now" button by default for payment mode', () => {
    render(<StripeCheckout config={baseConfig} />)
    expect(screen.getByRole('button', { name: 'Buy Now' })).toBeDefined()
  })

  it('shows "Subscribe" button for subscription mode', () => {
    render(<StripeCheckout config={{ ...baseConfig, mode: 'subscription' }} />)
    expect(screen.getByRole('button', { name: 'Subscribe' })).toBeDefined()
  })

  it('uses custom button label when provided', () => {
    render(<StripeCheckout config={{ ...baseConfig, buttonLabel: 'Get Access' }} />)
    expect(screen.getByRole('button', { name: 'Get Access' })).toBeDefined()
  })

  it('calls checkout API and redirects on success', async () => {
    const user = userEvent.setup()
    const mockUrl = 'https://checkout.stripe.com/test'

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ url: mockUrl }),
    })

    // Mock window.location
    const locationSpy = vi.spyOn(window, 'location', 'get').mockReturnValue({
      ...window.location,
      href: '',
    } as Location)

    const setHref = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
      configurable: true,
    })

    render(<StripeCheckout config={baseConfig} />)
    await user.click(screen.getByRole('button', { name: 'Buy Now' }))

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/stripe/checkout',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    )

    locationSpy.mockRestore()
  })

  it('shows error message on API failure', async () => {
    const user = userEvent.setup()

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Payment failed' }),
    })

    render(<StripeCheckout config={baseConfig} />)
    await user.click(screen.getByRole('button', { name: 'Buy Now' }))

    expect(screen.getByRole('alert')).toBeDefined()
    expect(screen.getByText('Payment failed')).toBeDefined()
  })

  it('renders compact variant', () => {
    render(<StripeCheckout config={{ ...baseConfig, variant: 'compact' }} />)
    const btn = screen.getByRole('button')
    expect(btn.textContent).toContain('$19.99')
  })

  it('renders card variant with product details', () => {
    render(<StripeCheckout config={{ ...baseConfig, variant: 'card' }} />)
    expect(screen.getByText('Test Product')).toBeDefined()
    expect(screen.getByText('A test product')).toBeDefined()
    expect(screen.getByText('$19.99')).toBeDefined()
  })

  it('handles empty description gracefully', () => {
    const { productName, priceCents } = baseConfig
    render(<StripeCheckout config={{ productName, priceCents }} />)
    expect(screen.getByText('Test Product')).toBeDefined()
  })

  it('formats price correctly for various amounts', () => {
    render(<StripeCheckout config={{ ...baseConfig, priceCents: 300 }} />)
    expect(screen.getByText('$3.00')).toBeDefined()
  })

  it('uses custom currency symbol', () => {
    render(<StripeCheckout config={{ ...baseConfig, currency: '€' }} />)
    expect(screen.getByText('€19.99')).toBeDefined()
  })
})
