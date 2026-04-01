// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import Timer from './Timer'
import defaults from './defaults.json'

describe('Timer', () => {
  const config = defaults as any

  it('renders title and mode', () => {
    render(<Timer config={config} />)
    expect(screen.getByText('Pomodoro Timer')).toBeTruthy()
    expect(screen.getByText('pomodoro')).toBeTruthy()
  })

  it('shows duration presets', () => {
    render(<Timer config={config} />)
    expect(screen.getByText('Focus (25m)')).toBeTruthy()
    expect(screen.getByText('Short Break (5m)')).toBeTruthy()
    expect(screen.getByText('Long Break (15m)')).toBeTruthy()
  })

  it('displays formatted time', () => {
    render(<Timer config={config} />)
    expect(screen.getByText('25:00')).toBeTruthy()
  })

  it('switches duration preset', () => {
    render(<Timer config={config} />)
    fireEvent.click(screen.getByText('Short Break (5m)'))
    expect(screen.getByText('05:00')).toBeTruthy()
  })

  it('starts and pauses', () => {
    vi.useFakeTimers()
    render(<Timer config={config} />)
    fireEvent.click(screen.getByText('Start'))
    expect(screen.getByText('Pause')).toBeTruthy()
    act(() => { vi.advanceTimersByTime(1000) })
    expect(screen.getByText('24:59')).toBeTruthy()
    fireEvent.click(screen.getByText('Pause'))
    expect(screen.getByText('Resume')).toBeTruthy()
    vi.useRealTimers()
  })

  it('resets timer', () => {
    vi.useFakeTimers()
    render(<Timer config={config} />)
    fireEvent.click(screen.getByText('Start'))
    act(() => { vi.advanceTimersByTime(5000) })
    fireEvent.click(screen.getByText('Reset'))
    expect(screen.getByText('25:00')).toBeTruthy()
    vi.useRealTimers()
  })
})
