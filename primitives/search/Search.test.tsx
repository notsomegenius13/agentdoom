// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import Search from './Search'
import defaults from './defaults.json'

describe('Search', () => {
  const config = defaults as any

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders title and input', () => {
    render(<Search config={config} />)
    expect(screen.getByText('Product Search')).toBeTruthy()
    expect(screen.getByRole('combobox')).toBeTruthy()
    expect(screen.getByPlaceholderText('Search products...')).toBeTruthy()
  })

  it('has correct ARIA combobox attributes', () => {
    render(<Search config={config} />)
    const input = screen.getByRole('combobox')
    expect(input.getAttribute('aria-autocomplete')).toBe('list')
    expect(input.getAttribute('aria-expanded')).toBe('false')
    expect(input.getAttribute('aria-controls')).toBe('search-listbox')
  })

  it('filters items after debounce on typing', () => {
    render(<Search config={config} />)
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'macbook' } })
    act(() => { vi.advanceTimersByTime(300) })
    expect(screen.getByText('MacBook Pro 16"')).toBeTruthy()
    expect(screen.getByText('MacBook Air 13"')).toBeTruthy()
    expect(screen.queryByText('iPhone 16 Pro')).toBeNull()
  })

  it('shows no results message for non-matching query', () => {
    render(<Search config={config} />)
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'xyznonexistent' } })
    act(() => { vi.advanceTimersByTime(300) })
    expect(screen.getByText(/No results for/)).toBeTruthy()
  })

  it('groups results by category', () => {
    render(<Search config={config} />)
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'pro' } })
    act(() => { vi.advanceTimersByTime(300) })
    // Should show category headers
    expect(screen.getByText('Laptops')).toBeTruthy()
  })

  it('navigates with ArrowDown and ArrowUp keys', () => {
    render(<Search config={config} />)
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'macbook' } })
    act(() => { vi.advanceTimersByTime(300) })

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    const firstOption = screen.getByText('MacBook Pro 16"').closest('[role="option"]')
    expect(firstOption?.getAttribute('aria-selected')).toBe('true')

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    const secondOption = screen.getByText('MacBook Air 13"').closest('[role="option"]')
    expect(secondOption?.getAttribute('aria-selected')).toBe('true')

    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(firstOption?.getAttribute('aria-selected')).toBe('true')
  })

  it('selects an item with Enter key', () => {
    render(<Search config={config} />)
    const input = screen.getByRole('combobox') as HTMLInputElement
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'macbook' } })
    act(() => { vi.advanceTimersByTime(300) })

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(input.value).toBe('MacBook Pro 16"')
  })

  it('closes dropdown on Escape', () => {
    render(<Search config={config} />)
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'mac' } })
    act(() => { vi.advanceTimersByTime(300) })

    expect(input.getAttribute('aria-expanded')).toBe('true')

    fireEvent.keyDown(input, { key: 'Escape' })
    expect(input.getAttribute('aria-expanded')).toBe('false')
  })

  it('shows recent searches after selecting an item', () => {
    render(<Search config={config} />)
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'airpods' } })
    act(() => { vi.advanceTimersByTime(300) })

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Enter' })

    // Clear input and refocus to see recent searches
    fireEvent.change(input, { target: { value: '' } })
    act(() => { vi.advanceTimersByTime(300) })
    fireEvent.focus(input)

    expect(screen.getByText('Recent searches')).toBeTruthy()
    expect(screen.getByText('AirPods Pro 3')).toBeTruthy()
  })

  it('performs case-insensitive matching', () => {
    render(<Search config={config} />)
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'MACBOOK' } })
    act(() => { vi.advanceTimersByTime(300) })
    expect(screen.getByText('MacBook Pro 16"')).toBeTruthy()
  })
})
