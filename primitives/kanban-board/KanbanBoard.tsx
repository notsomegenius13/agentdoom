'use client'

import React, { useState, useCallback } from 'react'
import { AppearanceConfig, PrimitiveWrapper } from '../theme'

export interface KanbanCard {
  id: string
  title: string
  description?: string
  color?: string
  assignee?: string
}

export interface KanbanColumn {
  id: string
  title: string
  cards: KanbanCard[]
}

export interface KanbanBoardConfig {
  title: string
  columns: KanbanColumn[]
  allowAdd?: boolean
  allowMove?: boolean
  appearance?: AppearanceConfig
}

export default function KanbanBoard({ config }: { config: KanbanBoardConfig }) {
  const [columns, setColumns] = useState<KanbanColumn[]>(config.columns)

  const moveCard = useCallback((fromColId: string, cardId: string, direction: 'left' | 'right') => {
    setColumns(prev => {
      const fromIdx = prev.findIndex(c => c.id === fromColId)
      const toIdx = direction === 'left' ? fromIdx - 1 : fromIdx + 1
      if (toIdx < 0 || toIdx >= prev.length) return prev

      const fromCol = prev[fromIdx]
      const toCol = prev[toIdx]
      const card = fromCol.cards.find(c => c.id === cardId)
      if (!card) return prev

      const next = prev.map((col, i) => {
        if (i === fromIdx) return { ...col, cards: col.cards.filter(c => c.id !== cardId) }
        if (i === toIdx) return { ...col, cards: [...col.cards, card] }
        return col
      })
      return next
    })
  }, [])

  const addCard = useCallback((colId: string) => {
    setColumns(prev => prev.map(col => {
      if (col.id !== colId) return col
      const newCard: KanbanCard = {
        id: `card-${Date.now()}`,
        title: 'New Card',
      }
      return { ...col, cards: [...col.cards, newCard] }
    }))
  }, [])

  return (
    <PrimitiveWrapper appearance={config.appearance}>
    <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: 'var(--doom-surface, white)', color: 'var(--doom-text-primary, #18181b)' }}>
      <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--doom-text-primary, #111827)' }}>{config.title}</h2>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {columns.map((col, colIdx) => (
          <div key={col.id} className="flex-shrink-0 w-72 bg-gray-50 rounded-lg p-3">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center justify-between">
              <span>{col.title}</span>
              <span className="text-xs text-gray-400 bg-gray-200 rounded-full px-2 py-0.5">
                {col.cards.length}
              </span>
            </h3>

            <div className="space-y-2 min-h-[2rem]">
              {col.cards.map(card => (
                <div
                  key={card.id}
                  className="bg-white rounded-md p-3 shadow-sm border border-gray-100"
                >
                  <div className="flex items-start gap-2">
                    {card.color && (
                      <span
                        className="block w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                        style={{ backgroundColor: card.color }}
                        aria-label={`Color: ${card.color}`}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{card.title}</p>
                      {card.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{card.description}</p>
                      )}
                      {card.assignee && (
                        <p className="text-xs text-gray-400 mt-1">{card.assignee}</p>
                      )}
                    </div>
                  </div>

                  {config.allowMove && (
                    <div className="flex gap-1 mt-2 justify-end">
                      <button
                        onClick={() => moveCard(col.id, card.id, 'left')}
                        disabled={colIdx === 0}
                        aria-label={`Move "${card.title}" left`}
                        className="text-xs px-1.5 py-0.5 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        &larr;
                      </button>
                      <button
                        onClick={() => moveCard(col.id, card.id, 'right')}
                        disabled={colIdx === columns.length - 1}
                        aria-label={`Move "${card.title}" right`}
                        className="text-xs px-1.5 py-0.5 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        &rarr;
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {config.allowAdd && (
              <button
                onClick={() => addCard(col.id)}
                aria-label={`Add card to ${col.title}`}
                className="w-full mt-2 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                + Add card
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
    </PrimitiveWrapper>
  )
}
