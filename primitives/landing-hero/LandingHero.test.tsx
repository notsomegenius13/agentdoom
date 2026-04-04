// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LandingHero, { LandingHeroConfig } from './LandingHero'
import defaults from './defaults.json'

const config = defaults as unknown as LandingHeroConfig

describe('LandingHero', () => {
  it('renders the title', () => {
    render(<LandingHero {...config} />)
    expect(screen.getByText(/Ship/)).toBeTruthy()
    expect(screen.getByText(/10x Faster/)).toBeTruthy()
  })

  it('renders the subtitle', () => {
    render(<LandingHero {...config} />)
    expect(screen.getByText(defaults.subtitle)).toBeTruthy()
  })

  it('renders the CTA button', () => {
    render(<LandingHero {...config} />)
    expect(screen.getByRole('button', { name: defaults.ctaLabel })).toBeTruthy()
  })

  it('renders features', () => {
    render(<LandingHero {...config} />)
    for (const feature of defaults.features) {
      expect(screen.getByText(feature.title)).toBeTruthy()
      expect(screen.getByText(feature.description)).toBeTruthy()
    }
  })

  it('handles missing features gracefully', () => {
    const config = {
      title: 'Simple Hero',
      subtitle: 'A subtitle without features.',
      ctaLabel: 'Click Me',
    }
    render(<LandingHero {...config} />)
    expect(screen.getByText('Simple Hero')).toBeTruthy()
    expect(screen.getByText('A subtitle without features.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Click Me' })).toBeTruthy()
  })
})
