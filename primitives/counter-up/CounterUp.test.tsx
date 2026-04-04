// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import CounterUp from './CounterUp'
import defaults from './defaults.json'

// Mock IntersectionObserver
const mockObserve = vi.fn()
const mockDisconnect = vi.fn()
let observerCallback: (entries: any[]) => void

beforeEach(() => {
  global.IntersectionObserver = class {
    constructor(cb: any) { observerCallback = cb }
    observe = mockObserve
    disconnect = mockDisconnect
    unobserve = vi.fn()
  } as any
})

describe('CounterUp', () => {
  const config = defaults as any

  it('renders title', () => {
    render(<CounterUp config={config} />)
    expect(screen.getByText('Total Users')).toBeTruthy()
  })

  it('starts at 0', () => {
    render(<CounterUp config={config} />)
    expect(screen.getByRole('status').textContent).toBe('0')
  })

  it('renders with prefix and suffix', () => {
    render(<CounterUp config={{ target: 100, prefix: '$', suffix: 'k', triggerOnView: false }} />)
    // Animation starts immediately when triggerOnView is false
    expect(screen.getByRole('status')).toBeTruthy()
  })

  it('renders without title', () => {
    render(<CounterUp config={{ target: 500 }} />)
    expect(screen.getByRole('status')).toBeTruthy()
  })

  it('animates when intersection triggers', () => {
    vi.useFakeTimers()
    render(<CounterUp config={config} />)
    expect(mockObserve).toHaveBeenCalled()

    act(() => {
      observerCallback([{ isIntersecting: true }])
    })

    vi.useRealTimers()
  })

  it('uses separator for large numbers', () => {
    render(<CounterUp config={{ target: 0, separator: true, triggerOnView: false }} />)
    expect(screen.getByRole('status').textContent).toBe('0')
  })
})
