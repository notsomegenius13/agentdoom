// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProgressFill from './ProgressFill'
import defaults from './defaults.json'

const mockObserve = vi.fn()
const mockDisconnect = vi.fn()

beforeEach(() => {
  global.IntersectionObserver = class {
    constructor(_cb: any) {}
    observe = mockObserve
    disconnect = mockDisconnect
    unobserve = vi.fn()
  } as any
})

describe('ProgressFill', () => {
  const config = defaults as any

  it('renders title', () => {
    render(<ProgressFill config={config} />)
    expect(screen.getByText('Sprint Progress')).toBeTruthy()
  })

  it('renders progressbar role', () => {
    render(<ProgressFill config={config} />)
    expect(screen.getByRole('progressbar')).toBeTruthy()
  })

  it('handles zero value', () => {
    render(<ProgressFill config={{ value: 0, animated: false }} />)
    const bar = screen.getByRole('progressbar')
    expect(bar.getAttribute('aria-valuenow')).toBe('0')
  })

  it('handles max value', () => {
    render(<ProgressFill config={{ value: 100, animated: false }} />)
    const bar = screen.getByRole('progressbar')
    expect(bar.getAttribute('aria-valuenow')).toBe('100')
  })

  it('clamps to 100%', () => {
    render(<ProgressFill config={{ value: 150, max: 100, animated: false }} />)
    const bar = screen.getByRole('progressbar')
    expect(bar.getAttribute('aria-valuenow')).toBe('100')
  })

  it('shows custom label', () => {
    render(<ProgressFill config={{ ...config, label: '72 of 100 tasks', animated: false }} />)
    expect(screen.getByText('72 of 100 tasks')).toBeTruthy()
  })

  it('renders without title', () => {
    render(<ProgressFill config={{ value: 50, showLabel: true, animated: false }} />)
    expect(screen.getByRole('progressbar')).toBeTruthy()
  })
})
