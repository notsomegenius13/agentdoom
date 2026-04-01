// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Poll from './Poll'
import defaults from './defaults.json'

describe('Poll', () => {
  const config = defaults as any

  it('renders title and question', () => {
    render(<Poll config={config} />)
    expect(screen.getByText('Quick Poll')).toBeTruthy()
    expect(screen.getByText("What's your favorite programming language?")).toBeTruthy()
  })

  it('renders all options', () => {
    render(<Poll config={config} />)
    expect(screen.getByText('TypeScript')).toBeTruthy()
    expect(screen.getByText('Python')).toBeTruthy()
    expect(screen.getByText('Rust')).toBeTruthy()
    expect(screen.getByText('Go')).toBeTruthy()
  })

  it('votes and shows results', () => {
    render(<Poll config={config} />)
    fireEvent.click(screen.getByText('TypeScript'))
    // After voting, should show percentages and total
    expect(screen.getByText(/vote/)).toBeTruthy()
  })

  it('prevents double voting', () => {
    render(<Poll config={config} />)
    fireEvent.click(screen.getByText('TypeScript'))
    fireEvent.click(screen.getByText('Python'))
    // Total should only reflect one vote
    expect(screen.getByText('117 votes')).toBeTruthy()
  })
})
