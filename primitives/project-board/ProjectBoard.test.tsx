// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProjectBoard, { ProjectBoardConfig } from './ProjectBoard'
import defaults from './defaults.json'

const config = defaults as unknown as ProjectBoardConfig

describe('ProjectBoard', () => {
  it('renders the board title', () => {
    render(<ProjectBoard {...config} />)
    expect(screen.getByText('Sprint Board')).toBeDefined()
  })

  it('renders the subtitle', () => {
    render(<ProjectBoard {...config} />)
    expect(screen.getByText('Sprint 14 — March 2026')).toBeDefined()
  })

  it('renders all column headers', () => {
    render(<ProjectBoard {...config} />)
    expect(screen.getByText('Backlog')).toBeDefined()
    expect(screen.getByText('In Progress')).toBeDefined()
    expect(screen.getByText('Review')).toBeDefined()
    expect(screen.getByText('Done')).toBeDefined()
  })

  it('renders task cards', () => {
    render(<ProjectBoard {...config} />)
    expect(screen.getByText('Design settings page')).toBeDefined()
    expect(screen.getByText('User authentication flow')).toBeDefined()
    expect(screen.getByText('Database migration script')).toBeDefined()
    expect(screen.getByText('Setup CI pipeline')).toBeDefined()
  })

  it('renders the stats bar when showStats is true', () => {
    render(<ProjectBoard {...config} />)
    const statsBar = screen.getByTestId('stats-bar')
    expect(statsBar).toBeDefined()
    expect(screen.getByText('Total Tasks:')).toBeDefined()
    expect(screen.getByText('Completion:')).toBeDefined()
  })

  it('does not render stats bar when showStats is false', () => {
    render(<ProjectBoard {...config} showStats={false} />)
    expect(screen.queryByTestId('stats-bar')).toBeNull()
  })

  it('handles empty columns', () => {
    const config = {
      title: 'Empty Board',
      columns: [
        { id: 'col-1', title: 'Empty Column', tasks: [] },
      ],
    }
    render(<ProjectBoard {...config} />)
    expect(screen.getByText('Empty Board')).toBeDefined()
    expect(screen.getByText('Empty Column')).toBeDefined()
    expect(screen.getByText('0')).toBeDefined()
  })

  it('renders priority badges on task cards', () => {
    render(<ProjectBoard {...config} />)
    const criticalBadges = screen.getAllByText('critical')
    expect(criticalBadges.length).toBeGreaterThan(0)
  })

  it('renders assignee initials', () => {
    render(<ProjectBoard {...config} />)
    const aInitials = screen.getAllByText('A')
    expect(aInitials.length).toBeGreaterThan(0)
  })
})
