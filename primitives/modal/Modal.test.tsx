// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Modal from './Modal'
import defaults from './defaults.json'

describe('Modal', () => {
  const config = defaults as any

  it('renders trigger button', () => {
    render(<Modal config={config} />)
    expect(screen.getByText('View Terms & Conditions')).toBeTruthy()
  })

  it('opens modal on click', () => {
    render(<Modal config={config} />)
    fireEvent.click(screen.getByText('View Terms & Conditions'))
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.getByText(/By using this service/)).toBeTruthy()
  })

  it('closes on escape', () => {
    render(<Modal config={config} />)
    fireEvent.click(screen.getByText('View Terms & Conditions'))
    expect(screen.getByRole('dialog')).toBeTruthy()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('shows content', () => {
    render(<Modal config={config} />)
    fireEvent.click(screen.getByText('View Terms & Conditions'))
    expect(screen.getByText(/privacy policy/)).toBeTruthy()
  })
})
