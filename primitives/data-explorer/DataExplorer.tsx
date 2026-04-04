'use client'

import { useState, useMemo, useCallback } from 'react'
import { AppearanceConfig, PrimitiveWrapper } from '../theme'

export interface DataExplorerColumn {
  key: string
  label: string
  type?: 'text' | 'number' | 'currency' | 'date' | 'badge'
  filterable?: boolean
  sortable?: boolean
  badgeColors?: Record<string, string>
}

export interface DataExplorerConfig {
  title: string
  columns: DataExplorerColumn[]
  rows: Record<string, unknown>[]
  pageSize?: number
  searchable?: boolean
  showExport?: boolean
  appearance?: AppearanceConfig
}

type SortDirection = 'asc' | 'desc' | null

function formatCurrency(value: unknown): string {
  const num = typeof value === 'number' ? value : parseFloat(String(value))
  if (isNaN(num)) return String(value)
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function renderBadge(value: unknown, badgeColors?: Record<string, string>) {
  const str = String(value)
  const colorClass = badgeColors?.[str] ?? 'gray'
  const colorMap: Record<string, string> = {
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    blue: 'bg-blue-100 text-blue-800',
    red: 'bg-red-100 text-red-800',
    gray: 'bg-gray-100 text-gray-800',
    purple: 'bg-purple-100 text-purple-800',
    orange: 'bg-orange-100 text-orange-800',
  }
  const classes = colorMap[colorClass] ?? colorMap.gray
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${classes}`}>
      {str}
    </span>
  )
}

export default function DataExplorer({
  title,
  columns,
  rows,
  pageSize = 10,
  searchable = false,
  showExport = false,
  appearance,
}: DataExplorerConfig) {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDirection>(null)
  const [page, setPage] = useState(0)

  const filterableColumns = useMemo(
    () => columns.filter((c) => c.filterable),
    [columns]
  )

  const filterOptions = useMemo(() => {
    const options: Record<string, string[]> = {}
    for (const col of filterableColumns) {
      const unique = Array.from(new Set(rows.map((r) => String(r[col.key] ?? ''))))
      unique.sort()
      options[col.key] = unique
    }
    return options
  }, [rows, filterableColumns])

  const filteredRows = useMemo(() => {
    let result = rows

    if (search.trim()) {
      const q = search.toLowerCase()
      const textKeys = columns
        .filter((c) => !c.type || c.type === 'text')
        .map((c) => c.key)
      result = result.filter((row) =>
        textKeys.some((key) => String(row[key] ?? '').toLowerCase().includes(q))
      )
    }

    for (const [key, value] of Object.entries(filters)) {
      if (value) {
        result = result.filter((row) => String(row[key] ?? '') === value)
      }
    }

    return result
  }, [rows, columns, search, filters])

  const sortedRows = useMemo(() => {
    if (!sortKey || !sortDir) return filteredRows
    const col = columns.find((c) => c.key === sortKey)
    if (!col) return filteredRows

    return [...filteredRows].sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      let cmp = 0

      if (col.type === 'number' || col.type === 'currency') {
        cmp = (Number(aVal) || 0) - (Number(bVal) || 0)
      } else {
        cmp = String(aVal ?? '').localeCompare(String(bVal ?? ''))
      }

      return sortDir === 'desc' ? -cmp : cmp
    })
  }, [filteredRows, sortKey, sortDir, columns])

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize))
  const currentPage = Math.min(page, totalPages - 1)
  const pagedRows = sortedRows.slice(currentPage * pageSize, (currentPage + 1) * pageSize)

  const handleSort = useCallback(
    (key: string) => {
      if (sortKey === key) {
        if (sortDir === 'asc') setSortDir('desc')
        else if (sortDir === 'desc') {
          setSortKey(null)
          setSortDir(null)
        }
      } else {
        setSortKey(key)
        setSortDir('asc')
      }
      setPage(0)
    },
    [sortKey, sortDir]
  )

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(0)
  }, [])

  const handleExportCSV = useCallback(() => {
    const header = columns.map((c) => c.label).join(',')
    const body = sortedRows
      .map((row) =>
        columns
          .map((c) => {
            const val = String(row[c.key] ?? '')
            return val.includes(',') || val.includes('"')
              ? `"${val.replace(/"/g, '""')}"`
              : val
          })
          .join(',')
      )
      .join('\n')
    const csv = `${header}\n${body}`
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${title.replace(/\s+/g, '_').toLowerCase()}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }, [columns, sortedRows, title])

  const renderCellValue = (col: DataExplorerColumn, value: unknown) => {
    switch (col.type) {
      case 'currency':
        return formatCurrency(value)
      case 'badge':
        return renderBadge(value, col.badgeColors)
      case 'date':
        return String(value ?? '')
      case 'number':
        return String(value ?? '')
      default:
        return String(value ?? '')
    }
  }

  const sortIndicator = (col: DataExplorerColumn) => {
    if (!col.sortable) return null
    if (sortKey === col.key && sortDir === 'asc') return ' \u25B2'
    if (sortKey === col.key && sortDir === 'desc') return ' \u25BC'
    return ' \u25BD'
  }

  return (
    <PrimitiveWrapper appearance={appearance}>
    <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: 'var(--doom-surface, white)', color: 'var(--doom-text-primary, #18181b)' }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <div className="flex items-center gap-3">
          {showExport && (
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 text-sm font-medium text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
            >
              Export CSV
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {searchable && (
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(0)
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          />
        )}

        {filterableColumns.map((col) => (
          <select
            key={col.key}
            value={filters[col.key] ?? ''}
            onChange={(e) => handleFilterChange(col.key, e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          >
            <option value="">All {col.label}</option>
            {filterOptions[col.key]?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-gray-200">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 ${
                    col.sortable ? 'cursor-pointer select-none hover:text-purple-600' : ''
                  }`}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  {col.label}
                  {sortIndicator(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-gray-400"
                >
                  No results found
                </td>
              </tr>
            ) : (
              pagedRows.map((row, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {renderCellValue(col, row[col.key])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {sortedRows.length > 0 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="px-4 py-2 text-sm font-medium text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {currentPage + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
            className="px-4 py-2 text-sm font-medium text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
    </PrimitiveWrapper>
  )
}
