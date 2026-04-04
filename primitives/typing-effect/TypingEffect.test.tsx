// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import TypingEffect from './TypingEffect'
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

describe('TypingEffect', () => {
  const config = defaults as any

  it('renders title', () => {
    render(<TypingEffect config={config} />)
    expect(screen.getByText('Welcome')).toBeTruthy()
  })

  it('renders status element', () => {
    render(<TypingEffect config={config} />)
    expect(screen.getByRole('status')).toBeTruthy()
  })

  it('types text when triggerOnView is false', () => {
    vi.useFakeTimers()
    render(<TypingEffect config={{ text: 'Hi', triggerOnView: false, cursor: false, startDelay: 0 }} />)

    act(() => { vi.advanceTimersByTime(50) })
    act(() => { vi.advanceTimersByTime(50) })
    act(() => { vi.advanceTimersByTime(50) })

    expect(screen.getByRole('status').textContent).toBe('Hi')
    vi.useRealTimers()
  })

  it('renders cursor when enabled', () => {
    render(<TypingEffect config={{ ...config, triggerOnView: false }} />)
    expect(screen.getByRole('status').innerHTML).toContain('|')
  })

  it('hides cursor when disabled', () => {
    render(<TypingEffect config={{ ...config, cursor: false, triggerOnView: false }} />)
    const status = screen.getByRole('status')
    expect(status.querySelector('[aria-hidden]')).toBeNull()
  })

  it('renders without title', () => {
    render(<TypingEffect config={{ text: 'Hello' }} />)
    expect(screen.getByRole('status')).toBeTruthy()
  })
})
