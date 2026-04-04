// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import WizardForm, { WizardFormConfig } from './WizardForm'
import defaults from './defaults.json'

const config = defaults as unknown as WizardFormConfig

describe('WizardForm', () => {
  it('renders the title', () => {
    render(<WizardForm {...config} />)
    expect(screen.getByText('Job Application')).toBeDefined()
  })

  it('renders step indicator with correct number of steps', () => {
    render(<WizardForm {...config} />)
    // The first step should show as current (purple), so step "1" is rendered
    expect(screen.getByText('1')).toBeDefined()
    // Steps 2 and 3 should also appear in the indicator
    expect(screen.getByText('2')).toBeDefined()
    expect(screen.getByText('3')).toBeDefined()
  })

  it('renders first step fields', () => {
    render(<WizardForm {...config} />)
    expect(screen.getByText('Personal Information')).toBeDefined()
    expect(screen.getByText('Full Name')).toBeDefined()
    expect(screen.getByText('Email Address')).toBeDefined()
    expect(screen.getByText('Phone Number')).toBeDefined()
  })

  it('handles empty steps gracefully', () => {
    render(<WizardForm title="Empty Wizard" steps={[]} />)
    expect(screen.getByText('Empty Wizard')).toBeDefined()
    expect(screen.getByText('No steps configured.')).toBeDefined()
  })
})
