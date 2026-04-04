'use client'

import React, { useState } from 'react'
import { AppearanceConfig, PrimitiveWrapper } from '../theme'

export interface DashboardStatCard {
  label: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon?: string
}

export interface DashboardChartConfig {
  title: string
  type: 'bar' | 'line' | 'pie'
  data: { label: string; value: number; color?: string }[]
}

export interface DashboardTableRow {
  [key: string]: string | number
}

export interface DashboardLayoutConfig {
  title: string
  subtitle?: string
  showDateFilter?: boolean
  stats: DashboardStatCard[]
  charts: DashboardChartConfig[]
  tableTitle?: string
  tableColumns?: { key: string; label: string }[]
  tableRows?: DashboardTableRow[]
  appearance?: AppearanceConfig
}

const DATE_RANGES = ['Today', '7 days', '30 days', '90 days', '1 year']

function StatCard({ stat }: { stat: DashboardStatCard }) {
  const changeColor =
    stat.changeType === 'positive'
      ? 'text-green-600'
      : stat.changeType === 'negative'
        ? 'text-red-600'
        : 'text-gray-500'

  return (
    <div className="rounded-xl p-6 shadow-sm doom-card-hover" style={{ backgroundColor: 'var(--doom-surface, white)', color: 'var(--doom-text-primary, #18181b)', borderLeft: '3px solid var(--doom-accent, #7c3aed)' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">{stat.label}</span>
        {stat.icon && <span className="text-xl">{stat.icon}</span>}
      </div>
      <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
      {stat.change && (
        <span className={`text-sm ${changeColor}`}>{stat.change}</span>
      )}
    </div>
  )
}

function BarChart({ data }: { data: DashboardChartConfig['data'] }) {
  const maxValue = Math.max(...data.map((d) => d.value), 1)

  return (
    <div className="space-y-3">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-sm text-gray-600 w-24 truncate">{item.label}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(item.value / maxValue) * 100}%`,
                backgroundColor: item.color || '#7c3aed',
              }}
            />
          </div>
          <span className="text-sm font-medium text-gray-700 w-16 text-right">
            {item.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  )
}

function LineChart({ data }: { data: DashboardChartConfig['data'] }) {
  if (data.length === 0) return null

  const maxValue = Math.max(...data.map((d) => d.value), 1)
  const width = 400
  const height = 200
  const padding = 30

  const points = data.map((d, i) => {
    const x = padding + (i / Math.max(data.length - 1, 1)) * (width - padding * 2)
    const y = height - padding - ((d.value / maxValue) * (height - padding * 2))
    return { x, y, label: d.label, value: d.value }
  })

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ')

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Line chart">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
          const y = height - padding - frac * (height - padding * 2)
          return (
            <line
              key={i}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          )
        })}
        {/* Line */}
        <polyline
          points={polylinePoints}
          fill="none"
          stroke="#7c3aed"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Dots */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill="#7c3aed" />
        ))}
        {/* X-axis labels */}
        {points.map((p, i) => (
          <text
            key={i}
            x={p.x}
            y={height - 8}
            textAnchor="middle"
            fontSize="10"
            fill="#6b7280"
          >
            {p.label}
          </text>
        ))}
      </svg>
    </div>
  )
}

function PieChart({ data }: { data: DashboardChartConfig['data'] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  if (total === 0) return null

  const defaultColors = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
  let cumulativePercent = 0
  const segments = data.map((d, i) => {
    const percent = (d.value / total) * 100
    const start = cumulativePercent
    cumulativePercent += percent
    return {
      ...d,
      percent,
      color: d.color || defaultColors[i % defaultColors.length],
      start,
    }
  })

  const gradientStops = segments
    .map((s) => `${s.color} ${s.start}% ${s.start + s.percent}%`)
    .join(', ')

  return (
    <div className="flex items-center gap-6">
      <div
        className="w-36 h-36 rounded-full flex-shrink-0"
        style={{ background: `conic-gradient(${gradientStops})` }}
        role="img"
        aria-label="Pie chart"
      />
      <div className="space-y-2">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-gray-700">
              {s.label}: {s.value.toLocaleString()} ({s.percent.toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ChartSection({ chart }: { chart: DashboardChartConfig }) {
  return (
    <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: 'var(--doom-surface, white)', color: 'var(--doom-text-primary, #18181b)' }}>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">{chart.title}</h3>
      {chart.data.length === 0 ? (
        <p className="text-gray-400 text-sm">No data available</p>
      ) : chart.type === 'bar' ? (
        <BarChart data={chart.data} />
      ) : chart.type === 'line' ? (
        <LineChart data={chart.data} />
      ) : chart.type === 'pie' ? (
        <PieChart data={chart.data} />
      ) : null}
    </div>
  )
}

export default function DashboardLayout(config: DashboardLayoutConfig) {
  const [dateRange, setDateRange] = useState('30 days')

  const {
    title,
    subtitle,
    showDateFilter = false,
    stats,
    charts = [],
    tableTitle,
    tableColumns = [],
    tableRows = [],
  } = config

  return (
    <PrimitiveWrapper appearance={config.appearance}>
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {showDateFilter && (
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="mt-3 sm:mt-0 border border-gray-300 rounded-lg px-4 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-600"
            aria-label="Date range filter"
          >
            {DATE_RANGES.map((range) => (
              <option key={range} value={range}>
                {range}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Stat Cards */}
      {stats.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <StatCard key={i} stat={stat} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl p-6 shadow-sm mb-8 text-center text-gray-400">
          No stats to display
        </div>
      )}

      {/* Charts */}
      {charts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {charts.map((chart, i) => (
            <ChartSection key={i} chart={chart} />
          ))}
        </div>
      )}

      {/* Table */}
      {tableColumns.length > 0 && tableRows.length > 0 && (
        <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: 'var(--doom-surface, white)', color: 'var(--doom-text-primary, #18181b)' }}>
          {tableTitle && (
            <h3 className="text-lg font-semibold mb-4 text-gray-900">{tableTitle}</h3>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-200">
                  {tableColumns.map((col) => (
                    <th
                      key={col.key}
                      className="py-3 px-4 text-gray-500 font-medium"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, ri) => (
                  <tr key={ri} className="border-b border-gray-100 hover:bg-gray-50">
                    {tableColumns.map((col) => (
                      <td key={col.key} className="py-3 px-4 text-gray-700">
                        {row[col.key] ?? ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
    </PrimitiveWrapper>
  )
}
