'use client'

import React, { useState, useMemo } from 'react'
import { AppearanceConfig, PrimitiveWrapper } from '../theme'

export interface TableColumn {
  key: string
  label: string
  type?: 'text' | 'number' | 'currency'
}

export interface TableConfig {
  title: string
  columns: TableColumn[]
  rows: Record<string, unknown>[]
  searchable?: boolean
  appearance?: AppearanceConfig
}

type SortDir = 'asc' | 'desc' | null

export default function Table({ config }: { config: TableConfig }) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>(null)

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc'))
      if (sortDir === 'desc') setSortKey(null)
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const filtered = useMemo(() => {
    let rows = config.rows || []
    if (config.searchable && search) {
      const q = search.toLowerCase()
      rows = rows.filter(row =>
        config.columns.some(col => String(row[col.key] ?? '').toLowerCase().includes(q))
      )
    }
    if (sortKey && sortDir) {
      const col = config.columns.find(c => c.key === sortKey)
      rows = [...rows].sort((a, b) => {
        const av = a[sortKey]
        const bv = b[sortKey]
        if (col?.type === 'number' || col?.type === 'currency') {
          const na = Number(av) || 0
          const nb = Number(bv) || 0
          return sortDir === 'asc' ? na - nb : nb - na
        }
        const sa = String(av ?? '')
        const sb = String(bv ?? '')
        return sortDir === 'asc' ? sa.localeCompare(sb) : sb.localeCompare(sa)
      })
    }
    return rows
  }, [config.rows, config.columns, config.searchable, search, sortKey, sortDir])

  const formatCell = (col: TableColumn, value: unknown) => {
    if (value == null) return '—'
    if (col.type === 'currency') return `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    if (col.type === 'number') return Number(value).toLocaleString()
    return String(value)
  }

  const sortIndicator = (key: string) => {
    if (sortKey !== key) return ''
    return sortDir === 'asc' ? ' ↑' : sortDir === 'desc' ? ' ↓' : ''
  }

  return (
    <PrimitiveWrapper appearance={config.appearance}>
    <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: 'var(--doom-surface, white)', color: 'var(--doom-text-primary, #18181b)' }}>
      <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--doom-text-primary, #111827)' }}>{config.title}</h2>

      {config.searchable && (
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search table"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      )}

      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full border-collapse min-w-[400px]" role="grid">
          <thead>
            <tr>
              {config.columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="text-left text-xs uppercase tracking-wide text-gray-500 font-medium px-3 py-2 border-b-2 border-gray-200 cursor-pointer select-none hover:text-gray-700"
                  aria-sort={sortKey === col.key ? (sortDir === 'asc' ? 'ascending' : sortDir === 'desc' ? 'descending' : 'none') : 'none'}
                >
                  {col.label}{sortIndicator(col.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={config.columns.length} className="text-center py-8 text-gray-400 text-sm">
                  No data found
                </td>
              </tr>
            ) : (
              filtered.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  {config.columns.map(col => (
                    <td key={col.key} className="px-3 py-2.5 border-b border-gray-100 text-sm text-gray-700">
                      {formatCell(col, row[col.key])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
    </PrimitiveWrapper>
  )
}
