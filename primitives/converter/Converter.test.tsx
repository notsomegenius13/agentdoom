// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Converter from './Converter'
import defaults from './defaults.json'

describe('Converter', () => {
  const config = defaults as any

  it('renders title and categories', () => {
    render(<Converter config={config} />)
    expect(screen.getByText('Unit Converter')).toBeTruthy()
    expect(screen.getByText('Length')).toBeTruthy()
    expect(screen.getByText('Weight')).toBeTruthy()
  })

  it('converts meters to feet', () => {
    render(<Converter config={config} />)
    // Default: 1 meter -> feet. factor_m=1, factor_ft=0.3048
    // 1 * 1 / 0.3048 = 3.28084
    const result = screen.getByText(/3\.28/)
    expect(result).toBeTruthy()
  })

  it('updates conversion on input change', () => {
    render(<Converter config={config} />)
    const input = screen.getByLabelText('From')
    fireEvent.change(input, { target: { value: '10' } })
    // 10 meters to feet = 32.8084
    expect(screen.getByText(/32\.808/)).toBeTruthy()
  })

  it('switches categories', () => {
    render(<Converter config={config} />)
    fireEvent.click(screen.getByText('Weight'))
    // Should now show weight units
    expect(screen.getAllByText('Kilograms').length).toBeGreaterThan(0)
  })
})
