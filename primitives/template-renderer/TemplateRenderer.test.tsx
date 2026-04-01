// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TemplateRenderer from './TemplateRenderer'
import defaults from './defaults.json'

describe('TemplateRenderer', () => {
  const config = defaults as any

  it('renders title and fields', () => {
    render(<TemplateRenderer config={config} />)
    expect(screen.getByText('Cold Email Template')).toBeTruthy()
    expect(screen.getByLabelText('Recipient Name')).toBeTruthy()
    expect(screen.getByLabelText('Company')).toBeTruthy()
    expect(screen.getByLabelText('Your Product')).toBeTruthy()
  })

  it('shows template with placeholders as defaults', () => {
    render(<TemplateRenderer config={config} />)
    expect(screen.getByText(/Hi John/)).toBeTruthy()
    expect(screen.getByText(/Acme Corp/)).toBeTruthy()
  })

  it('updates template when field changes', () => {
    render(<TemplateRenderer config={config} />)
    fireEvent.change(screen.getByLabelText('Recipient Name'), { target: { value: 'Sarah' } })
    expect(screen.getByText(/Hi Sarah/)).toBeTruthy()
  })

  it('shows copy button', () => {
    render(<TemplateRenderer config={config} />)
    expect(screen.getByText('Copy')).toBeTruthy()
  })
})
