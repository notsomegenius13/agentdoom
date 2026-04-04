// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SettingsPanel from './SettingsPanel'
import defaults from './defaults.json'
import type { SettingsPanelConfig } from './SettingsPanel'

describe('SettingsPanel', () => {
  it('renders the panel title', () => {
    render(<SettingsPanel config={defaults as SettingsPanelConfig} />)
    expect(screen.getByText('Account Settings')).toBeDefined()
  })

  it('renders all tabs', () => {
    render(<SettingsPanel config={defaults as SettingsPanelConfig} />)
    expect(screen.getByRole('tab', { name: /Profile/i })).toBeDefined()
    expect(screen.getByRole('tab', { name: /Notifications/i })).toBeDefined()
    expect(screen.getByRole('tab', { name: /Security/i })).toBeDefined()
  })

  it('renders first tab content by default', () => {
    render(<SettingsPanel config={defaults as SettingsPanelConfig} />)
    expect(screen.getByText('Personal Information')).toBeDefined()
    expect(screen.getByText('Preferences')).toBeDefined()
    expect(screen.getByLabelText('Full Name')).toBeDefined()
    expect(screen.getByLabelText('Email Address')).toBeDefined()
    expect(screen.getByLabelText('Bio')).toBeDefined()
  })

  it('handles empty tabs gracefully', () => {
    const emptyConfig: SettingsPanelConfig = {
      title: 'Empty Settings',
      tabs: [],
    }
    render(<SettingsPanel config={emptyConfig} />)
    expect(screen.getByText('Empty Settings')).toBeDefined()
    expect(screen.queryByRole('tablist')).toBeNull()
  })
})
