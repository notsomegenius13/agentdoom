'use client'

export interface MapLocation {
  lat: number
  lng: number
  label?: string
}

export interface MapViewConfig {
  title: string
  locations: MapLocation[]
  zoom?: number
  showCoordinates?: boolean
  height?: number
}

export default function MapView({ config }: { config: MapViewConfig }) {
  const { title, locations, showCoordinates = false, height = 300 } = config

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4 text-gray-900">{title}</h2>
      <div
        className="relative bg-gray-100 rounded-lg border border-gray-200 overflow-hidden"
        style={{ height }}
        role="img"
        aria-label={`Map showing ${locations.length} location${locations.length !== 1 ? 's' : ''}`}
      >
        {locations.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            No locations to display
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 p-4 overflow-y-auto h-full">
            {locations.map((location, index) => (
              <div
                key={index}
                className="flex items-start gap-3 bg-white rounded-lg p-3 shadow-sm border border-gray-100"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {index + 1}
                </div>
                <div className="min-w-0">
                  {location.label && (
                    <p className="font-medium text-gray-900 text-sm">{location.label}</p>
                  )}
                  {showCoordinates && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
