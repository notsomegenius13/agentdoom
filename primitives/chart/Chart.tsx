'use client'

import React from 'react'
import { AppearanceConfig, PrimitiveWrapper } from '../theme'

export interface ChartDataPoint {
  label: string
  value: number
  color?: string
}

export interface ChartConfig {
  title: string
  type: 'bar' | 'line' | 'pie'
  data: ChartDataPoint[]
  showLegend?: boolean
  showValues?: boolean
  width?: number
  height?: number
  appearance?: AppearanceConfig
}

const DEFAULT_COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444']

function getColor(index: number, custom?: string): string {
  return custom || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
}

function BarChart({
  data,
  showValues,
  width,
  height,
}: {
  data: ChartDataPoint[]
  showValues?: boolean
  width: number
  height: number
}) {
  const maxVal = Math.max(...data.map(d => Math.abs(d.value)), 1)
  const hasNegative = data.some(d => d.value < 0)
  const padding = { top: 20, right: 20, bottom: 40, left: 20 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom
  const barGap = 8
  const barWidth = Math.max(1, (chartW - barGap * (data.length - 1)) / data.length)

  const baseline = hasNegative ? chartH / 2 : chartH

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto"
      role="img"
      aria-label="Bar chart"
    >
      <g transform={`translate(${padding.left},${padding.top})`}>
        {/* Baseline */}
        <line
          x1={0}
          y1={baseline}
          x2={chartW}
          y2={baseline}
          stroke="#e5e7eb"
          strokeWidth={1}
        />
        {data.map((d, i) => {
          const x = i * (barWidth + barGap)
          const color = getColor(i, d.color)
          const absVal = Math.abs(d.value)
          const barH = (absVal / maxVal) * (hasNegative ? chartH / 2 : chartH)
          const y = d.value >= 0 ? baseline - barH : baseline

          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx={3}
                fill={color}
              >
                <title>{`${d.label}: ${d.value}`}</title>
              </rect>
              {showValues && (
                <text
                  x={x + barWidth / 2}
                  y={d.value >= 0 ? y - 4 : y + barH + 14}
                  textAnchor="middle"
                  className="fill-gray-600 dark:fill-gray-300"
                  fontSize={11}
                  fontWeight={500}
                >
                  {d.value}
                </text>
              )}
              <text
                x={x + barWidth / 2}
                y={height - padding.top - 4}
                textAnchor="middle"
                className="fill-gray-500 dark:fill-gray-400"
                fontSize={10}
              >
                {d.label}
              </text>
            </g>
          )
        })}
      </g>
    </svg>
  )
}

function LineChart({
  data,
  showValues,
  width,
  height,
}: {
  data: ChartDataPoint[]
  showValues?: boolean
  width: number
  height: number
}) {
  const values = data.map(d => d.value)
  const minVal = Math.min(...values)
  const maxVal = Math.max(...values)
  const range = maxVal - minVal || 1
  const padding = { top: 20, right: 20, bottom: 40, left: 20 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  const points = data.map((d, i) => {
    const x = data.length === 1 ? chartW / 2 : (i / (data.length - 1)) * chartW
    const y = chartH - ((d.value - minVal) / range) * chartH
    return { x, y, ...d }
  })

  const polyline = points.map(p => `${p.x},${p.y}`).join(' ')
  const lineColor = data[0]?.color || DEFAULT_COLORS[0]

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto"
      role="img"
      aria-label="Line chart"
    >
      <g transform={`translate(${padding.left},${padding.top})`}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(frac => (
          <line
            key={frac}
            x1={0}
            y1={chartH * (1 - frac)}
            x2={chartW}
            y2={chartH * (1 - frac)}
            stroke="#e5e7eb"
            strokeWidth={0.5}
          />
        ))}
        {/* Line */}
        {points.length > 1 && (
          <polyline
            points={polyline}
            fill="none"
            stroke={lineColor}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {/* Points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={4} fill={lineColor} stroke="white" strokeWidth={2}>
              <title>{`${p.label}: ${p.value}`}</title>
            </circle>
            {showValues && (
              <text
                x={p.x}
                y={p.y - 10}
                textAnchor="middle"
                className="fill-gray-600 dark:fill-gray-300"
                fontSize={11}
                fontWeight={500}
              >
                {p.value}
              </text>
            )}
            <text
              x={p.x}
              y={chartH + 18}
              textAnchor="middle"
              className="fill-gray-500 dark:fill-gray-400"
              fontSize={10}
            >
              {p.label}
            </text>
          </g>
        ))}
      </g>
    </svg>
  )
}

function PieChart({
  data,
  showValues,
  width,
  height,
}: {
  data: ChartDataPoint[]
  showValues?: boolean
  width: number
  height: number
}) {
  const total = data.reduce((sum, d) => sum + Math.abs(d.value), 0) || 1
  const cx = width / 2
  const cy = height / 2
  const r = Math.min(cx, cy) - 20

  let cumAngle = -Math.PI / 2

  const slices = data.map((d, i) => {
    const fraction = Math.abs(d.value) / total
    const angle = fraction * 2 * Math.PI
    const startAngle = cumAngle
    const endAngle = cumAngle + angle
    cumAngle = endAngle

    const x1 = cx + r * Math.cos(startAngle)
    const y1 = cy + r * Math.sin(startAngle)
    const x2 = cx + r * Math.cos(endAngle)
    const y2 = cy + r * Math.sin(endAngle)
    const largeArc = angle > Math.PI ? 1 : 0

    const midAngle = startAngle + angle / 2
    const labelR = r * 0.65
    const labelX = cx + labelR * Math.cos(midAngle)
    const labelY = cy + labelR * Math.sin(midAngle)

    const path =
      data.length === 1
        ? `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy} Z`
        : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`

    return {
      path,
      color: getColor(i, d.color),
      label: d.label,
      value: d.value,
      pct: Math.round(fraction * 100),
      labelX,
      labelY,
      fraction,
    }
  })

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto"
      role="img"
      aria-label="Pie chart"
    >
      {slices.map((s, i) => (
        <g key={i}>
          <path d={s.path} fill={s.color} stroke="white" strokeWidth={2}>
            <title>{`${s.label}: ${s.value} (${s.pct}%)`}</title>
          </path>
          {showValues && s.fraction > 0.05 && (
            <text
              x={s.labelX}
              y={s.labelY}
              textAnchor="middle"
              dominantBaseline="central"
              fill="white"
              fontSize={11}
              fontWeight={600}
            >
              {s.pct}%
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}

export default function Chart({ config }: { config: ChartConfig }) {
  const width = config.width || 400
  const height = config.height || 260
  const data = config.data || []

  if (data.length === 0) {
    return (
      <PrimitiveWrapper appearance={config.appearance}>
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">{config.title}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8" role="status">
          No data available
        </p>
      </div>
      </PrimitiveWrapper>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">{config.title}</h2>

      {config.type === 'bar' && (
        <BarChart data={data} showValues={config.showValues} width={width} height={height} />
      )}
      {config.type === 'line' && (
        <LineChart data={data} showValues={config.showValues} width={width} height={height} />
      )}
      {config.type === 'pie' && (
        <PieChart data={data} showValues={config.showValues} width={width} height={height} />
      )}

      {config.showLegend && (
        <div className="flex flex-wrap gap-3 mt-4" aria-label="Chart legend">
          {data.map((d, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs">
              <span
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: getColor(i, d.color) }}
              />
              <span className="text-gray-600 dark:text-gray-400">{d.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
