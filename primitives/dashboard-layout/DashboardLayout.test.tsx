// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import DashboardLayout from './DashboardLayout'
import defaults from './defaults.json'

describe('DashboardLayout', () => {
  it('renders the dashboard title', () => {
    render(<DashboardLayout {...(defaults as any)} />)
    expect(screen.getByText('SaaS Analytics Dashboard')).toBeDefined()
  })

  it('renders the subtitle', () => {
    render(<DashboardLayout {...(defaults as any)} />)
    expect(screen.getByText('Real-time metrics for your business')).toBeDefined()
  })

  it('renders all stat cards', () => {
    render(<DashboardLayout {...(defaults as any)} />)
    expect(screen.getByText('Monthly Recurring Revenue')).toBeDefined()
    expect(screen.getByText('$48,250')).toBeDefined()
    expect(screen.getByText('Active Users')).toBeDefined()
    expect(screen.getByText('3842')).toBeDefined()
    expect(screen.getByText('Churn Rate')).toBeDefined()
    expect(screen.getByText('2.4%')).toBeDefined()
    expect(screen.getByText('Net Promoter Score')).toBeDefined()
    expect(screen.getByText('72')).toBeDefined()
  })

  it('renders change indicators with correct text', () => {
    render(<DashboardLayout {...(defaults as any)} />)
    expect(screen.getByText('+12.5% vs last month')).toBeDefined()
    expect(screen.getByText('Stable')).toBeDefined()
  })

  it('renders chart titles', () => {
    render(<DashboardLayout {...(defaults as any)} />)
    expect(screen.getByText('Revenue Trend')).toBeDefined()
    expect(screen.getByText('User Acquisition by Channel')).toBeDefined()
  })

  it('renders the table with title and data', () => {
    render(<DashboardLayout {...(defaults as any)} />)
    expect(screen.getByText('Top Customers')).toBeDefined()
    expect(screen.getByText('Acme Corp')).toBeDefined()
    expect(screen.getAllByText('Enterprise').length).toBeGreaterThan(0)
    expect(screen.getByText('$4,200')).toBeDefined()
  })

  it('renders date filter when showDateFilter is true', () => {
    render(<DashboardLayout {...(defaults as any)} />)
    const select = screen.getByLabelText('Date range filter')
    expect(select).toBeDefined()
    expect(select.tagName).toBe('SELECT')
  })

  it('handles empty stats array gracefully', () => {
    render(<DashboardLayout title="Empty Dashboard" stats={[]} charts={[]} />)
    expect(screen.getByText('Empty Dashboard')).toBeDefined()
    expect(screen.getByText('No stats to display')).toBeDefined()
  })

  it('handles missing charts gracefully', () => {
    render(
      <DashboardLayout
        title="Stats Only"
        stats={[{ label: 'Users', value: 100 }]}
        charts={[]}
      />
    )
    expect(screen.getByText('Stats Only')).toBeDefined()
    expect(screen.getByText('Users')).toBeDefined()
    expect(screen.getByText('100')).toBeDefined()
  })

  it('does not render date filter when showDateFilter is false', () => {
    render(<DashboardLayout title="No Filter" stats={[]} charts={[]} showDateFilter={false} />)
    expect(screen.queryByLabelText('Date range filter')).toBeNull()
  })

  it('does not render table when no columns or rows are provided', () => {
    render(<DashboardLayout title="No Table" stats={[]} charts={[]} />)
    expect(screen.queryByText('Top Customers')).toBeNull()
  })
})
