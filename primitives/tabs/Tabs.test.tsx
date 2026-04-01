// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Tabs from './Tabs'
import defaults from './defaults.json'

describe('Tabs', () => {
  const config = defaults as any

  it('renders title', () => {
    render(<Tabs config={config} />)
    expect(screen.getByText('Product Information')).toBeTruthy()
  })

  it('renders tab labels', () => {
    render(<Tabs config={config} />)
    expect(screen.getByText('Features')).toBeTruthy()
    expect(screen.getByText('Pricing')).toBeTruthy()
    expect(screen.getByText('FAQ')).toBeTruthy()
  })

  it('switches tabs on click', () => {
    render(<Tabs config={config} />)
    expect(screen.getByRole('tabpanel').textContent).toContain('real-time collaboration')
    fireEvent.click(screen.getByText('Pricing'))
    expect(screen.getByRole('tabpanel').textContent).toContain('flexible plans')
  })

  it('renders accordion mode', () => {
    render(<Tabs config={{ ...config, mode: 'accordion' }} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBe(3)
    expect(buttons[0].textContent).toContain('Features')
    fireEvent.click(buttons[1])
    expect(screen.getByText(/flexible plans/)).toBeTruthy()
  })
})
