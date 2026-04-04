'use client'

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { AppearanceConfig, PrimitiveWrapper } from '../theme'

export interface SearchItem {
  label: string
  value: string
  category?: string
  description?: string
  icon?: string
}

export interface SearchConfig {
  title: string
  placeholder?: string
  items: SearchItem[]
  maxResults?: number
  showCategories?: boolean
  showRecentSearches?: boolean
  debounceMs?: number
  appearance?: AppearanceConfig
}

function fuzzyMatch(text: string, query: string): boolean {
  const lower = text.toLowerCase()
  const q = query.toLowerCase()
  return lower.includes(q)
}

export default function Search({ config }: { config: SearchConfig }) {
  const {
    title,
    placeholder = 'Search...',
    items,
    maxResults = 10,
    showCategories = true,
    showRecentSearches = true,
    debounceMs = 300,
  } = config

  const [inputValue, setInputValue] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [recentSearches, setRecentSearches] = useState<SearchItem[]>([])

  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounce input
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(inputValue)
    }, debounceMs)
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [inputValue, debounceMs])

  // Filtered results
  const filtered = useMemo(() => {
    if (!debouncedQuery.trim()) return []
    return items.filter(item =>
      fuzzyMatch(item.label, debouncedQuery) ||
      (item.description && fuzzyMatch(item.description, debouncedQuery)) ||
      (item.category && fuzzyMatch(item.category, debouncedQuery))
    ).slice(0, maxResults)
  }, [debouncedQuery, items, maxResults])

  // Group by category
  const grouped = useMemo(() => {
    if (!showCategories) return { '': filtered }
    const groups: Record<string, SearchItem[]> = {}
    for (const item of filtered) {
      const cat = item.category || ''
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(item)
    }
    return groups
  }, [filtered, showCategories])

  // Flat list for keyboard navigation
  const flatList = useMemo(() => {
    const result: SearchItem[] = []
    for (const key of Object.keys(grouped)) {
      result.push(...grouped[key])
    }
    return result
  }, [grouped])

  // Determine what to show in dropdown
  const showRecent = showRecentSearches && !debouncedQuery.trim() && recentSearches.length > 0
  const showNoResults = debouncedQuery.trim().length > 0 && filtered.length === 0
  const showResults = filtered.length > 0
  const dropdownVisible = isOpen && (showRecent || showNoResults || showResults)

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(-1)
  }, [debouncedQuery])

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[role="option"]')
      items[activeIndex]?.scrollIntoView?.({ block: 'nearest' })
    }
  }, [activeIndex])

  const selectItem = useCallback((item: SearchItem) => {
    setInputValue(item.label)
    setDebouncedQuery('')
    setIsOpen(false)
    setActiveIndex(-1)
    setRecentSearches(prev => {
      const next = [item, ...prev.filter(r => r.value !== item.value)]
      return next.slice(0, 5)
    })
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const list = showRecent ? recentSearches : flatList
    const len = list.length

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
        return
      }
      setActiveIndex(prev => (prev < len - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(prev => (prev > 0 ? prev - 1 : len - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0 && activeIndex < len) {
        selectItem(list[activeIndex])
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      setActiveIndex(-1)
    }
  }, [isOpen, activeIndex, flatList, recentSearches, showRecent, selectItem])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    setIsOpen(true)
  }, [])

  const handleFocus = useCallback(() => {
    setIsOpen(true)
  }, [])

  const handleBlur = useCallback(() => {
    // Delay to allow click on dropdown item
    setTimeout(() => setIsOpen(false), 200)
  }, [])

  const listboxId = 'search-listbox'

  return (
    <PrimitiveWrapper appearance={config.appearance}>
    <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: 'var(--doom-surface, white)', color: 'var(--doom-text-primary, #18181b)' }}>
      <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--doom-text-primary, #111827)' }}>{title}</h2>
      <div className="relative">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={dropdownVisible}
            aria-controls={listboxId}
            aria-activedescendant={activeIndex >= 0 ? `search-option-${activeIndex}` : undefined}
            aria-autocomplete="list"
            aria-label={title}
            placeholder={placeholder}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div
          className={`absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden transition-all duration-150 ${
            dropdownVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none'
          }`}
        >
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-label={`${title} suggestions`}
            className="max-h-64 overflow-y-auto py-1"
          >
            {/* Recent searches */}
            {showRecent && (
              <>
                <li className="px-3 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Recent searches
                </li>
                {recentSearches.map((item, idx) => (
                  <li
                    key={`recent-${item.value}`}
                    id={`search-option-${idx}`}
                    role="option"
                    aria-selected={activeIndex === idx}
                    className={`px-3 py-2 text-sm cursor-pointer flex items-center gap-2 ${
                      activeIndex === idx ? 'bg-purple-50 text-purple-900' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onMouseDown={() => selectItem(item)}
                  >
                    <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
                    </svg>
                    <span>{item.label}</span>
                  </li>
                ))}
              </>
            )}

            {/* No results */}
            {showNoResults && (
              <li className="px-3 py-6 text-sm text-gray-500 text-center" role="option" aria-selected={false}>
                No results for &ldquo;{debouncedQuery}&rdquo;
              </li>
            )}

            {/* Grouped results */}
            {showResults && Object.entries(grouped).map(([category, groupItems]) => (
              <React.Fragment key={category || '__uncategorized'}>
                {showCategories && category && (
                  <li className="px-3 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-50">
                    {category}
                  </li>
                )}
                {groupItems.map(item => {
                  const flatIdx = flatList.indexOf(item)
                  return (
                    <li
                      key={item.value}
                      id={`search-option-${flatIdx}`}
                      role="option"
                      aria-selected={activeIndex === flatIdx}
                      className={`px-3 py-2 text-sm cursor-pointer ${
                        activeIndex === flatIdx ? 'bg-purple-50 text-purple-900' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      onMouseDown={() => selectItem(item)}
                    >
                      <div className="flex items-center gap-2">
                        {item.icon && <span aria-hidden="true">{item.icon}</span>}
                        <div>
                          <div className="font-medium">{item.label}</div>
                          {item.description && (
                            <div className="text-xs text-gray-500">{item.description}</div>
                          )}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </React.Fragment>
            ))}
          </ul>
        </div>
      </div>
    </div>
    </PrimitiveWrapper>
  )
}
