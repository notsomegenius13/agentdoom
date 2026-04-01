// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SplitCalculator from './SplitCalculator'
import defaults from './defaults.json'

describe('SplitCalculator', () => {
  const config = defaults as any

  it('renders title', () => {
    render(<SplitCalculator config={config} />)
    expect(screen.getByText('Bill Splitter')).toBeTruthy()
  })

  it('shows tip options', () => {
    render(<SplitCalculator config={config} />)
    expect(screen.getByText('15%')).toBeTruthy()
    expect(screen.getByText('18%')).toBeTruthy()
    expect(screen.getByText('20%')).toBeTruthy()
    expect(screen.getByText('25%')).toBeTruthy()
  })

  it('calculates split correctly', () => {
    render(<SplitCalculator config={config} />)
    fireEvent.change(screen.getByLabelText('Bill Amount'), { target: { value: '100' } })
    // 100 + 18% tip = 118, split by 2 = 59
    expect(screen.getByText('$59.00')).toBeTruthy()
    expect(screen.getByText('$18.00')).toBeTruthy()
    expect(screen.getByText('$118.00')).toBeTruthy()
  })

  it('increments and decrements people', () => {
    render(<SplitCalculator config={config} />)
    fireEvent.click(screen.getByLabelText('Increase people'))
    expect(screen.getByText('3')).toBeTruthy()
    fireEvent.click(screen.getByLabelText('Decrease people'))
    expect(screen.getByText('2')).toBeTruthy()
  })

  it('does not go below 1 person', () => {
    render(<SplitCalculator config={config} />)
    fireEvent.click(screen.getByLabelText('Decrease people'))
    fireEvent.click(screen.getByLabelText('Decrease people'))
    expect(screen.getByText('1')).toBeTruthy()
  })
})
