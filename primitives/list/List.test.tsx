// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import List from './List'
import defaults from './defaults.json'

describe('List', () => {
  const config = defaults as any

  it('renders the title', () => {
    render(<List config={config} />)
    expect(screen.getByText('My Reading List')).toBeTruthy()
  })

  it('renders initial items', () => {
    render(<List config={config} />)
    expect(screen.getByText('Atomic Habits — James Clear')).toBeTruthy()
    expect(screen.getByText('Deep Work — Cal Newport')).toBeTruthy()
  })

  it('adds a new item via button click', () => {
    render(<List config={config} />)
    const input = screen.getByRole('textbox', { name: /new item/i })
    fireEvent.change(input, { target: { value: 'Clean Code — Robert Martin' } })
    fireEvent.click(screen.getByRole('button', { name: /add/i }))
    expect(screen.getByText('Clean Code — Robert Martin')).toBeTruthy()
  })

  it('adds a new item via Enter key', () => {
    render(<List config={config} />)
    const input = screen.getByRole('textbox', { name: /new item/i })
    fireEvent.change(input, { target: { value: 'Refactoring — Martin Fowler' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.getByText('Refactoring — Martin Fowler')).toBeTruthy()
  })

  it('clears the input after adding', () => {
    render(<List config={config} />)
    const input = screen.getByRole('textbox', { name: /new item/i }) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'New Book' } })
    fireEvent.click(screen.getByRole('button', { name: /add/i }))
    expect(input.value).toBe('')
  })

  it('does not add empty items', () => {
    render(<List config={{ ...config, items: [] } as any} />)
    const addBtn = screen.getByRole('button', { name: /add/i }) as HTMLButtonElement
    expect(addBtn.disabled).toBe(true)
  })

  it('shows empty state message when no items', () => {
    render(<List config={{ ...config, items: [] } as any} />)
    expect(screen.getByText(/no items yet/i)).toBeTruthy()
  })

  it('hides add input when addable is false', () => {
    render(<List config={{ ...config, addable: false } as any} />)
    expect(screen.queryByRole('textbox')).toBeNull()
  })

  it('renders without errors on empty config', () => {
    render(<List config={{ title: 'Empty List' } as any} />)
    expect(screen.getByText('Empty List')).toBeTruthy()
  })
})
