'use client'

import React from 'react'

export interface StatCard {
  label: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon?: string
}

export interface ChartData {
  label: string
  value: number
  color?: string
}

export interface StatsDashboardConfig {
  title: string
  stats: StatCard[]
  chartTitle?: string
  chartType?: 'bar' | 'pie'
  chartData?: ChartData[]
}

export default function StatsDashboard({ config }: { config: StatsDashboardConfig }) {
  const maxValue = config.chartData?.length
    ? Math.max(...config.chartData.map(d => d.value), 1)
    : 1

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4 text-gray-900">{config.title}</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {(config.stats || []).map((stat, i) => (
          <div key={i} className="bg-gray-50 rounded-lg p-3">
            {stat.icon && <span className="text-xl mb-1 block" aria-hidden="true">{stat.icon}</span>}
            <div className="text-xs text-gray-500">{stat.label}</div>
            <div className="text-xl font-bold text-gray-900">{stat.value}</div>
            {stat.change && (
              <div className={`text-xs font-medium mt-0.5 ${
                stat.changeType === 'positive' ? 'text-green-600' :
                stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-500'
              }`}>
                {stat.change}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bar Chart */}
      {config.chartData?.length && config.chartType !== 'pie' ? (
        <div>
          {config.chartTitle && (
            <h3 className="text-sm font-semibold text-gray-700 mb-3">{config.chartTitle}</h3>
          )}
          <div className="space-y-2" role="img" aria-label={config.chartTitle || 'Bar chart'}>
            {config.chartData.map((d, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-20 text-right truncate">{d.label}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(d.value / maxValue) * 100}%`,
                      backgroundColor: d.color || '#7c3aed',
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-700 w-12">{d.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Pie Chart (CSS-based) */}
      {config.chartData?.length && config.chartType === 'pie' ? (
        <div>
          {config.chartTitle && (
            <h3 className="text-sm font-semibold text-gray-700 mb-3">{config.chartTitle}</h3>
          )}
          <div className="flex items-center gap-6">
            <div
              className="w-32 h-32 rounded-full flex-shrink-0"
              role="img"
              aria-label={config.chartTitle || 'Pie chart'}
              style={{
                background: (() => {
                  const total = config.chartData!.reduce((s, d) => s + d.value, 0)
                  const colors = ['#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899']
                  let acc = 0
                  const stops = config.chartData!.map((d, i) => {
                    const start = acc
                    acc += (d.value / total) * 360
                    return `${d.color || colors[i % colors.length]} ${start}deg ${acc}deg`
                  })
                  return `conic-gradient(${stops.join(', ')})`
                })(),
              }}
            />
            <div className="space-y-1">
              {config.chartData!.map((d, i) => {
                const colors = ['#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899']
                return (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: d.color || colors[i % colors.length] }} />
                    <span className="text-gray-600">{d.label}</span>
                    <span className="font-medium text-gray-800">{d.value.toLocaleString()}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
