// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import InteractiveDemo, { InteractiveDemoConfig } from './InteractiveDemo'
import defaults from './defaults.json'

const config = defaults as unknown as InteractiveDemoConfig

describe('InteractiveDemo', () => {
  it('renders the title', () => {
    render(<InteractiveDemo {...config} />)
    expect(screen.getByText('CSS Playground')).toBeTruthy()
  })

  it('renders the description when provided', () => {
    render(<InteractiveDemo {...config} />)
    expect(
      screen.getByText(/Experiment with common CSS layout patterns/)
    ).toBeTruthy()
  })

  it('renders example tabs for multiple examples', () => {
    render(<InteractiveDemo {...config} />)
    expect(screen.getByRole('tab', { name: 'Flexbox Layout' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Grid Gallery' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Button Styles' })).toBeTruthy()
  })

  it('marks the default example tab as selected', () => {
    render(<InteractiveDemo {...config} />)
    const flexTab = screen.getByRole('tab', { name: 'Flexbox Layout' })
    expect(flexTab.getAttribute('aria-selected')).toBe('true')
  })

  it('renders code content from the active example', () => {
    render(<InteractiveDemo {...config} />)
    // The flexbox example code should be visible in the textarea
    const textarea = document.querySelector('textarea')
    expect(textarea).toBeTruthy()
    expect(textarea?.value).toContain('flex-container')
  })

  it('renders the Copy Code button', () => {
    render(<InteractiveDemo {...config} />)
    expect(screen.getByText('Copy Code')).toBeTruthy()
  })

  it('renders the Preview label', () => {
    render(<InteractiveDemo {...config} />)
    expect(screen.getByText('Preview')).toBeTruthy()
  })

  it('handles empty examples gracefully', () => {
    render(
      <InteractiveDemo
        title="Empty Demo"
        examples={[]}
      />
    )
    expect(screen.getByText('Empty Demo')).toBeTruthy()
    expect(screen.getByText('No examples available.')).toBeTruthy()
  })

  it('does not render tabs when there is only one example', () => {
    render(
      <InteractiveDemo
        title="Single Example"
        examples={[{ id: 'only', label: 'Only One', code: '<p>Hello</p>' }]}
      />
    )
    expect(screen.queryByRole('tab')).toBeNull()
  })

  it('renders line numbers when showLineNumbers is true', () => {
    render(<InteractiveDemo {...config} />)
    // Line number 1 should appear
    expect(screen.getByText('1')).toBeTruthy()
  })
})
