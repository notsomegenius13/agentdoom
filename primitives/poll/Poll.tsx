'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { AppearanceConfig, PrimitiveWrapper } from '../theme'

export interface PollOption {
  text: string
  votes?: number
}

export interface PollConfig {
  title: string
  question: string
  options: PollOption[]
  showResults?: boolean
  appearance?: AppearanceConfig
}

export default function Poll({ config }: { config: PollConfig }) {
  const [votes, setVotes] = useState<number[]>(() =>
    config.options.map(o => o.votes || 0)
  )
  const [voted, setVoted] = useState<number | null>(null)

  const total = useMemo(() => votes.reduce((a, b) => a + b, 0), [votes])

  const handleVote = useCallback((idx: number) => {
    if (voted !== null) return
    setVoted(idx)
    setVotes(prev => prev.map((v, i) => (i === idx ? v + 1 : v)))
  }, [voted])

  const showResults = voted !== null || config.showResults

  return (
    <PrimitiveWrapper appearance={config.appearance}>
    <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: 'var(--doom-surface, white)', color: 'var(--doom-text-primary, #18181b)' }}>
      <h2 className="text-lg font-semibold mb-1 text-gray-900">{config.title}</h2>
      <p className="text-sm text-gray-600 mb-4">{config.question}</p>

      <div className="space-y-2">
        {config.options.map((opt, i) => {
          const pct = total > 0 ? (votes[i] / total) * 100 : 0
          const isSelected = voted === i

          return (
            <button
              key={i}
              onClick={() => handleVote(i)}
              disabled={voted !== null}
              className={`w-full text-left relative overflow-hidden rounded-lg border-2 px-4 py-3 transition-colors ${
                isSelected ? 'border-purple-500' : 'border-gray-200 hover:border-gray-300'
              } ${voted !== null ? 'cursor-default' : 'cursor-pointer'}`}
            >
              {showResults && (
                <div
                  className="absolute inset-0 bg-purple-50 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              )}
              <div className="relative flex items-center justify-between">
                <span className={`text-sm font-medium ${isSelected ? 'text-purple-700' : 'text-gray-700'}`}>
                  {opt.text}
                </span>
                {showResults && (
                  <span className="text-xs font-semibold text-gray-500 ml-2">
                    {Math.round(pct)}%
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {showResults && (
        <p className="text-xs text-gray-400 mt-3 text-center">{total} vote{total !== 1 ? 's' : ''}</p>
      )}
    </div>
    </PrimitiveWrapper>
  )
}
