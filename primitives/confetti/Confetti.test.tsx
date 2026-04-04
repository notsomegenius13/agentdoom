// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import Confetti from './Confetti'
import defaults from './defaults.json'

describe('Confetti', () => {
  const config = defaults as any

  it('renders title and button', () => {
    render(<Confetti config={config} />)
    expect(screen.getByText('Deploy Success!')).toBeTruthy()
    expect(screen.getByText('Celebrate!')).toBeTruthy()
  })

  it('triggers confetti on button click', () => {
    vi.useFakeTimers()
    render(<Confetti config={config} />)
    const button = screen.getByText('Celebrate!')
    fireEvent.click(button)
    expect(button).toHaveProperty('disabled', true)
    vi.useRealTimers()
  })

  it('renders without title', () => {
    render(<Confetti config={{ buttonLabel: 'Go!' }} />)
    expect(screen.getByText('Go!')).toBeTruthy()
  })

  it('uses custom button label', () => {
    render(<Confetti config={{ ...config, buttonLabel: 'Fire!' }} />)
    expect(screen.getByText('Fire!')).toBeTruthy()
  })

  it('auto-triggers when configured', () => {
    vi.useFakeTimers()
    render(<Confetti config={{ ...config, autoTrigger: true }} />)
    const button = screen.getByText('Celebrate!')
    expect(button).toHaveProperty('disabled', true)
    vi.useRealTimers()
  })
})
