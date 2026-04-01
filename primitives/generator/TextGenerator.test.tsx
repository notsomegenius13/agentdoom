// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import TextGenerator from './TextGenerator'
import defaults from './defaults.json'

describe('TextGenerator', () => {
  const config = defaults as any

  it('renders title and input', () => {
    render(<TextGenerator config={config} />)
    expect(screen.getByText('Email Subject Line Generator')).toBeTruthy()
    expect(screen.getByLabelText('What is your email about?')).toBeTruthy()
  })

  it('disables button when input is empty', () => {
    render(<TextGenerator config={config} />)
    const btn = screen.getByText('Generate Subject Lines')
    expect(btn).toHaveProperty('disabled', true)
  })

  it('generates output on button click', async () => {
    vi.useFakeTimers()
    render(<TextGenerator config={config} />)
    const input = screen.getByLabelText('What is your email about?')
    fireEvent.change(input, { target: { value: 'product launch' } })
    fireEvent.click(screen.getByText('Generate Subject Lines'))
    expect(screen.getByText('Generating...')).toBeTruthy()
    await vi.advanceTimersByTimeAsync(400)
    expect(screen.getByText('Generated Subject Line')).toBeTruthy()
    expect(screen.getByRole('status').textContent).toContain('product launch')
    vi.useRealTimers()
  })
})
