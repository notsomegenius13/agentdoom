// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Form from './Form'
import defaults from './defaults.json'

describe('Form', () => {
  const config = defaults as any

  it('renders title and all fields', () => {
    render(<Form config={config} />)
    expect(screen.getByText('Contact Form')).toBeTruthy()
    expect(screen.getByLabelText(/Name/)).toBeTruthy()
    expect(screen.getByLabelText(/Email/)).toBeTruthy()
    expect(screen.getByLabelText(/Message/)).toBeTruthy()
  })

  it('shows validation errors for required fields', () => {
    render(<Form config={config} />)
    fireEvent.click(screen.getByText('Submit'))
    expect(screen.getByText('Name is required')).toBeTruthy()
    expect(screen.getByText('Email is required')).toBeTruthy()
  })

  it('submits successfully with valid data', () => {
    render(<Form config={config} />)
    fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'Alice' } })
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'a@b.com' } })
    fireEvent.click(screen.getByText('Submit'))
    expect(screen.getByText(config.successMessage)).toBeTruthy()
  })

  it('renders select fields with options', () => {
    const selectConfig = {
      ...config,
      fields: [{ name: 'color', label: 'Color', type: 'select', options: ['Red', 'Blue'], required: false }],
    }
    render(<Form config={selectConfig} />)
    expect(screen.getByLabelText('Color')).toBeTruthy()
    expect(screen.getByText('Red')).toBeTruthy()
  })

  it('renders checkbox fields', () => {
    const cbConfig = {
      ...config,
      fields: [{ name: 'agree', label: 'I agree', type: 'checkbox' }],
    }
    render(<Form config={cbConfig} />)
    expect(screen.getByText('I agree')).toBeTruthy()
  })

  it('handles empty fields gracefully', () => {
    const emptyConfig = { ...config, fields: [] }
    render(<Form config={emptyConfig} />)
    expect(screen.getByText('Submit')).toBeTruthy()
  })
})
