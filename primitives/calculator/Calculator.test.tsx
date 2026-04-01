// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Calculator from './Calculator'
import defaults from './defaults.json'

describe('Calculator', () => {
  const config = defaults as any

  it('renders title and inputs', () => {
    render(<Calculator config={config} />)
    expect(screen.getByText('Tip Calculator')).toBeTruthy()
    expect(screen.getByLabelText('Bill Amount ($)')).toBeTruthy()
    expect(screen.getByLabelText('Tip %')).toBeTruthy()
    expect(screen.getByLabelText('Split Between')).toBeTruthy()
  })

  it('displays result based on formula', () => {
    render(<Calculator config={config} />)
    expect(screen.getByText('Per Person')).toBeTruthy()
    // Default: bill=50, tipPercent=15, people=2 => (50*(1+15/100))/2 = 28.75
    expect(screen.getByText('$28.75')).toBeTruthy()
  })

  it('updates result on input change', () => {
    render(<Calculator config={config} />)
    const billInput = screen.getByLabelText('Bill Amount ($)')
    fireEvent.change(billInput, { target: { value: '100' } })
    // 100 * (1 + 15/100) / 2 = 57.50
    expect(screen.getByText('$57.50')).toBeTruthy()
  })
})
