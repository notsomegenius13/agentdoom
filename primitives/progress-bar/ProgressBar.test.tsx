// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ProgressBar from './ProgressBar'
import type { ProgressBarConfig } from './ProgressBar'
import defaults from './defaults.json'

describe('ProgressBar', () => {
  const stepperConfig = defaults as unknown as ProgressBarConfig

  const barConfig: ProgressBarConfig = {
    title: 'Upload Progress',
    mode: 'bar',
    value: 65,
    showPercentage: true,
    animated: true,
    size: 'md',
    color: '#3b82f6',
  }

  it('renders title and mode label', () => {
    render(<ProgressBar config={barConfig} />)
    expect(screen.getByText('Upload Progress')).toBeTruthy()
    expect(screen.getByText('bar')).toBeTruthy()
  })

  it('renders bar with correct ARIA attributes', () => {
    render(<ProgressBar config={barConfig} />)
    const progressbar = screen.getByRole('progressbar')
    expect(progressbar.getAttribute('aria-valuenow')).toBe('65')
    expect(progressbar.getAttribute('aria-valuemin')).toBe('0')
    expect(progressbar.getAttribute('aria-valuemax')).toBe('100')
  })

  it('displays percentage label when showPercentage is true', () => {
    render(<ProgressBar config={barConfig} />)
    expect(screen.getByText('65%')).toBeTruthy()
  })

  it('hides percentage label when showPercentage is false', () => {
    render(<ProgressBar config={{ ...barConfig, showPercentage: false }} />)
    expect(screen.queryByText('65%')).toBeNull()
  })

  it('clamps value to 0-100 range', () => {
    render(<ProgressBar config={{ ...barConfig, value: 150 }} />)
    const progressbar = screen.getByRole('progressbar')
    expect(progressbar.getAttribute('aria-valuenow')).toBe('100')
  })

  it('renders stepper with all step labels', () => {
    render(<ProgressBar config={stepperConfig} />)
    expect(screen.getByText('Planning')).toBeTruthy()
    expect(screen.getByText('Design')).toBeTruthy()
    expect(screen.getByText('Development')).toBeTruthy()
    expect(screen.getByText('Testing')).toBeTruthy()
    expect(screen.getByText('Launch')).toBeTruthy()
  })

  it('renders stepper with correct ARIA attributes', () => {
    render(<ProgressBar config={stepperConfig} />)
    const progressbar = screen.getByRole('progressbar')
    expect(progressbar.getAttribute('aria-valuenow')).toBe('3')
    expect(progressbar.getAttribute('aria-valuemin')).toBe('1')
    expect(progressbar.getAttribute('aria-valuemax')).toBe('5')
  })

  it('allows click navigation when enabled', () => {
    render(<ProgressBar config={stepperConfig} />)
    const step4 = screen.getByTestId('step-3')
    fireEvent.click(step4)
    // After clicking step 4, the ARIA valuenow should update
    const progressbar = screen.getByRole('progressbar')
    expect(progressbar.getAttribute('aria-valuenow')).toBe('4')
  })

  it('prevents click navigation when disabled', () => {
    const noClickConfig: ProgressBarConfig = {
      ...stepperConfig,
      allowClickNavigation: false,
    }
    render(<ProgressBar config={noClickConfig} />)
    const step4 = screen.getByTestId('step-3')
    fireEvent.click(step4)
    const progressbar = screen.getByRole('progressbar')
    // Should remain at the original step
    expect(progressbar.getAttribute('aria-valuenow')).toBe('3')
  })

  it('renders step descriptions', () => {
    render(<ProgressBar config={stepperConfig} />)
    expect(screen.getByText('Define scope')).toBeTruthy()
    expect(screen.getByText('Create mockups')).toBeTruthy()
    expect(screen.getByText('Deploy to prod')).toBeTruthy()
  })

  it('renders with different size variants', () => {
    const { container: smContainer } = render(
      <ProgressBar config={{ ...barConfig, size: 'sm' }} />
    )
    expect(smContainer.querySelector('.h-1\\.5')).toBeTruthy()

    const { container: lgContainer } = render(
      <ProgressBar config={{ ...barConfig, size: 'lg' }} />
    )
    expect(lgContainer.querySelector('.h-5')).toBeTruthy()
  })
})
