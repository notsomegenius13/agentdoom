import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MapView, { MapViewConfig } from './MapView'

describe('MapView', () => {
  const defaultConfig: MapViewConfig = {
    title: 'Office Locations',
    locations: [
      { lat: 37.7749, lng: -122.4194, label: 'San Francisco' },
      { lat: 34.0522, lng: -118.2437, label: 'Los Angeles' },
    ],
    showCoordinates: true,
  }

  it('renders the title', () => {
    render(<MapView config={defaultConfig} />)
    expect(screen.getByText('Office Locations')).toBeDefined()
  })

  it('shows location labels', () => {
    render(<MapView config={defaultConfig} />)
    expect(screen.getByText('San Francisco')).toBeDefined()
    expect(screen.getByText('Los Angeles')).toBeDefined()
  })

  it('handles empty locations', () => {
    const emptyConfig: MapViewConfig = {
      title: 'Empty Map',
      locations: [],
    }
    render(<MapView config={emptyConfig} />)
    expect(screen.getByText('No locations to display')).toBeDefined()
  })

  it('shows coordinates when showCoordinates is true', () => {
    render(<MapView config={defaultConfig} />)
    expect(screen.getByText('37.7749, -122.4194')).toBeDefined()
  })

  it('hides coordinates when showCoordinates is false', () => {
    const config: MapViewConfig = {
      ...defaultConfig,
      showCoordinates: false,
    }
    render(<MapView config={config} />)
    expect(screen.queryByText('37.7749, -122.4194')).toBeNull()
  })
})
