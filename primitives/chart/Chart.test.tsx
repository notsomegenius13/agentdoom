// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Chart from './Chart'
import defaults from './defaults.json'

describe('Chart', () => {
  const config = defaults as any

  it('renders title', () => {
    render(<Chart config={config} />)
    expect(screen.getByText('Monthly Revenue')).toBeTruthy()
  })

  it('renders bar chart by default', () => {
    const { container } = render(<Chart config={config} />)
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
    expect(svg?.getAttribute('aria-label')).toBe('Bar chart')
  })

  it('renders line chart when type is line', () => {
    const { container } = render(<Chart config={{ ...config, type: 'line' }} />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('aria-label')).toBe('Line chart')
  })

  it('renders pie chart when type is pie', () => {
    const { container } = render(<Chart config={{ ...config, type: 'pie' }} />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('aria-label')).toBe('Pie chart')
  })

  it('handles empty data', () => {
    render(<Chart config={{ ...config, data: [] }} />)
    expect(screen.getByText('Monthly Revenue')).toBeTruthy()
    expect(screen.getByText('No data available')).toBeTruthy()
  })

  it('shows legend when enabled', () => {
    const { container } = render(<Chart config={{ ...config, showLegend: true }} />)
    const legend = container.querySelector('[aria-label="Chart legend"]')
    expect(legend).toBeTruthy()
    expect(legend!.children.length).toBe(6)
    expect(screen.getAllByText('Jan').length).toBeGreaterThanOrEqual(2)
  })

  it('hides legend when disabled', () => {
    const { container } = render(<Chart config={{ ...config, showLegend: false }} />)
    const legend = container.querySelector('[aria-label="Chart legend"]')
    expect(legend).toBeNull()
  })

  it('handles single data point', () => {
    const { container } = render(
      <Chart config={{ ...config, data: [{ label: 'Only', value: 42 }] }} />
    )
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
  })

  it('handles negative values in bar chart', () => {
    const { container } = render(
      <Chart
        config={{
          ...config,
          data: [
            { label: 'Gain', value: 100 },
            { label: 'Loss', value: -50 },
          ],
        }}
      />
    )
    const rects = container.querySelectorAll('rect')
    expect(rects.length).toBe(2)
  })

  it('renders values when showValues is true', () => {
    render(
      <Chart
        config={{
          ...config,
          showValues: true,
          data: [{ label: 'A', value: 99 }],
        }}
      />
    )
    expect(screen.getByText('99')).toBeTruthy()
  })

  it('applies custom colors', () => {
    const { container } = render(
      <Chart
        config={{
          ...config,
          data: [{ label: 'Red', value: 10, color: '#ff0000' }],
        }}
      />
    )
    const rect = container.querySelector('rect')
    expect(rect?.getAttribute('fill')).toBe('#ff0000')
  })
})
