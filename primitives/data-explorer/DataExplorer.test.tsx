// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import DataExplorer from './DataExplorer'
import defaults from './defaults.json'

describe('DataExplorer', () => {
  it('renders the title', () => {
    render(<DataExplorer {...(defaults as any)} />)
    expect(screen.getByText('Employee Directory')).toBeDefined()
  })

  it('renders all column headers', () => {
    render(<DataExplorer {...(defaults as any)} />)
    for (const col of defaults.columns) {
      expect(screen.getAllByText(new RegExp(col.label)).length).toBeGreaterThan(0)
    }
  })

  it('renders the first page of rows', () => {
    render(<DataExplorer {...(defaults as any)} />)
    // pageSize is 5, so first 5 names should be visible
    expect(screen.getByText('Alice Johnson')).toBeDefined()
    expect(screen.getByText('Bob Martinez')).toBeDefined()
    expect(screen.getByText('Carol Chen')).toBeDefined()
    expect(screen.getByText('David Kim')).toBeDefined()
    expect(screen.getByText('Eva Novak')).toBeDefined()
    // 6th row should not be on the first page
    expect(screen.queryByText('Frank Osei')).toBeNull()
  })

  it('shows pagination controls', () => {
    render(<DataExplorer {...(defaults as any)} />)
    expect(screen.getByText('Previous')).toBeDefined()
    expect(screen.getByText('Next')).toBeDefined()
    expect(screen.getByText('Page 1 of 3')).toBeDefined()
  })

  it('handles empty rows gracefully', () => {
    render(
      <DataExplorer
        title="Empty Table"
        columns={defaults.columns as any}
        rows={[]}
        pageSize={5}
      />
    )
    expect(screen.getByText('No results found')).toBeDefined()
  })
})
