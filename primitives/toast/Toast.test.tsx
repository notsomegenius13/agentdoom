// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Toast from './Toast'
import defaults from './defaults.json'

describe('Toast', () => {
  const config = defaults as any

  it('renders title', () => {
    render(<Toast config={config} />)
    expect(screen.getByText('Notifications')).toBeTruthy()
  })

  it('displays toast messages', () => {
    render(<Toast config={config} />)
    expect(screen.getByText('File uploaded successfully!')).toBeTruthy()
    expect(screen.getByText('Failed to save changes.')).toBeTruthy()
    expect(screen.getByText('Your session will expire in 5 minutes.')).toBeTruthy()
    expect(screen.getByText('A new version is available.')).toBeTruthy()
  })

  it('shows correct type styling', () => {
    render(<Toast config={config} />)
    const successAlert = screen.getByText('File uploaded successfully!').closest('[role="alert"]')!
    expect(successAlert.className).toContain('bg-green-50')

    const errorAlert = screen.getByText('Failed to save changes.').closest('[role="alert"]')!
    expect(errorAlert.className).toContain('bg-red-50')

    const warningAlert = screen.getByText('Your session will expire in 5 minutes.').closest('[role="alert"]')!
    expect(warningAlert.className).toContain('bg-amber-50')

    const infoAlert = screen.getByText('A new version is available.').closest('[role="alert"]')!
    expect(infoAlert.className).toContain('bg-blue-50')
  })

  it('dismisses on click', () => {
    render(<Toast config={config} />)
    const dismissBtn = screen.getByLabelText('Dismiss File uploaded successfully!')
    fireEvent.click(dismissBtn)
    expect(screen.queryByText('File uploaded successfully!')).toBeNull()
  })
})
