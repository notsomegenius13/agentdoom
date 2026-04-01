// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import KanbanBoard from './KanbanBoard'
import defaults from './defaults.json'

describe('KanbanBoard', () => {
  const config = defaults as any

  it('renders title', () => {
    render(<KanbanBoard config={config} />)
    expect(screen.getByText('Project Board')).toBeTruthy()
  })

  it('renders all columns', () => {
    render(<KanbanBoard config={config} />)
    expect(screen.getByText('To Do')).toBeTruthy()
    expect(screen.getByText('In Progress')).toBeTruthy()
    expect(screen.getByText('Done')).toBeTruthy()
  })

  it('shows card titles', () => {
    render(<KanbanBoard config={config} />)
    expect(screen.getByText('Design homepage mockup')).toBeTruthy()
    expect(screen.getByText('Implement auth flow')).toBeTruthy()
    expect(screen.getByText('Project scaffolding')).toBeTruthy()
  })

  it('move buttons work - card moves between columns', () => {
    render(<KanbanBoard config={config} />)
    // Move "Design homepage mockup" from To Do to In Progress
    const moveRight = screen.getByLabelText('Move "Design homepage mockup" right')
    fireEvent.click(moveRight)
    // To Do should now show 2 cards, In Progress should show 3
    const counts = screen.getAllByText(/^\d+$/)
    // After move: To Do=2, In Progress=3, Done=2
    const countValues = counts.map(el => el.textContent)
    expect(countValues).toContain('2')
    expect(countValues).toContain('3')
  })

  it('add card button appears when allowAdd is true', () => {
    render(<KanbanBoard config={config} />)
    const addButtons = screen.getAllByText('+ Add card')
    expect(addButtons.length).toBe(3)
  })

  it('add card button does not appear when allowAdd is false', () => {
    render(<KanbanBoard config={{ ...config, allowAdd: false }} />)
    expect(screen.queryByText('+ Add card')).toBeNull()
  })

  it('move buttons do not appear when allowMove is false', () => {
    render(<KanbanBoard config={{ ...config, allowMove: false }} />)
    expect(screen.queryByLabelText(/Move .* left/)).toBeNull()
    expect(screen.queryByLabelText(/Move .* right/)).toBeNull()
  })
})
