// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Table from './Table'
import defaults from './defaults.json'

describe('Table', () => {
  const config = defaults as any

  it('renders title and column headers', () => {
    render(<Table config={config} />)
    expect(screen.getByText('Team Members')).toBeTruthy()
    expect(screen.getByText('Name')).toBeTruthy()
    expect(screen.getByText('Role')).toBeTruthy()
    expect(screen.getByText('Salary')).toBeTruthy()
  })

  it('renders all rows', () => {
    render(<Table config={config} />)
    expect(screen.getByText('Alice')).toBeTruthy()
    expect(screen.getByText('Bob')).toBeTruthy()
    expect(screen.getByText('Carol')).toBeTruthy()
  })

  it('formats currency values', () => {
    render(<Table config={config} />)
    expect(screen.getByText('$120,000.00')).toBeTruthy()
  })

  it('filters rows via search', () => {
    render(<Table config={config} />)
    const search = screen.getByPlaceholderText('Search...')
    fireEvent.change(search, { target: { value: 'Alice' } })
    expect(screen.getByText('Alice')).toBeTruthy()
    expect(screen.queryByText('Bob')).toBeNull()
  })

  it('handles empty rows', () => {
    const emptyConfig = { ...config, rows: [] }
    render(<Table config={emptyConfig} />)
    expect(screen.getByText('No data found')).toBeTruthy()
  })
})
