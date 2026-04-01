// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import CardGrid from './CardGrid'
import defaults from './defaults.json'

describe('CardGrid', () => {
  const config = defaults as any

  it('renders title and cards', () => {
    render(<CardGrid config={config} />)
    expect(screen.getByText('Features')).toBeTruthy()
    expect(screen.getByText('Fast')).toBeTruthy()
    expect(screen.getByText('Secure')).toBeTruthy()
    expect(screen.getByText('Scalable')).toBeTruthy()
  })

  it('renders card descriptions', () => {
    render(<CardGrid config={config} />)
    expect(screen.getByText('Built for speed with optimized rendering')).toBeTruthy()
  })

  it('handles empty cards', () => {
    render(<CardGrid config={{ ...config, cards: [] }} />)
    expect(screen.getByText('Features')).toBeTruthy()
  })

  it('renders links for cards with link prop', () => {
    const withLink = { ...config, cards: [{ title: 'Link', description: 'test', link: 'https://example.com' }] }
    render(<CardGrid config={withLink} />)
    const link = screen.getByText('Link').closest('a')
    expect(link?.getAttribute('href')).toBe('https://example.com')
  })
})
