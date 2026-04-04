// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import SlideReveal from './SlideReveal'
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

describe('SlideReveal', () => {
  const config = { ...defaults, appearance: { animation: { entrance: 'none' } } } as any

  it('renders title', () => {
    render(<SlideReveal config={{ ...config, triggerOnView: false }} />)
    expect(screen.getByText('New Tool Available')).toBeTruthy()
  })

  it('renders content text', () => {
    render(<SlideReveal config={{ ...config, triggerOnView: false }} />)
    expect(screen.getByText(config.content)).toBeTruthy()
  })

  it('starts hidden when triggerOnView is true', () => {
    const { container } = render(<SlideReveal config={config} />)
    const el = container.querySelector('.rounded-xl') as HTMLElement
    expect(el.style.opacity).toBe('0')
  })

  it('starts visible when triggerOnView is false', () => {
    const { container } = render(<SlideReveal config={{ ...config, triggerOnView: false }} />)
    const el = container.querySelector('.rounded-xl') as HTMLElement
    expect(el.style.opacity).toBe('1')
  })

  it('renders children', () => {
    render(
      <SlideReveal config={{ triggerOnView: false }}>
        <span>Child content</span>
      </SlideReveal>
    )
    expect(screen.getByText('Child content')).toBeTruthy()
  })

  it('applies correct direction transform', () => {
    const { container } = render(<SlideReveal config={{ ...config, direction: 'right' }} />)
    const el = container.querySelector('.rounded-xl') as HTMLElement
    expect(el.style.transform).toContain('translateX(40px)')
  })

  it('renders without title', () => {
    render(<SlideReveal config={{ content: 'Just text', triggerOnView: false }} />)
    expect(screen.getByText('Just text')).toBeTruthy()
  })
})
