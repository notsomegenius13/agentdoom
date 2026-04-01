// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Checklist from './Checklist'
import defaults from './defaults.json'

describe('Checklist', () => {
  const config = defaults as any

  it('renders title and categories', () => {
    render(<Checklist config={config} />)
    expect(screen.getByText('Project Launch Checklist')).toBeTruthy()
    expect(screen.getByText('Pre-Launch')).toBeTruthy()
    expect(screen.getByText('Launch Day')).toBeTruthy()
    expect(screen.getByText('Post-Launch')).toBeTruthy()
  })

  it('renders all items', () => {
    render(<Checklist config={config} />)
    expect(screen.getByText('Set up hosting')).toBeTruthy()
    expect(screen.getByText('Deploy to production')).toBeTruthy()
    expect(screen.getByText('Monitor error rates')).toBeTruthy()
  })

  it('shows progress at 0%', () => {
    render(<Checklist config={config} />)
    expect(screen.getByText('0/10 complete')).toBeTruthy()
  })

  it('checks items and updates progress', () => {
    render(<Checklist config={config} />)
    const checkbox = screen.getByText('Set up hosting').closest('label')!.querySelector('input')!
    fireEvent.click(checkbox)
    expect(screen.getByText('1/10 complete')).toBeTruthy()
    expect(screen.getByText('10%')).toBeTruthy()
  })
})
