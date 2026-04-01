'use client'

import React, { useState, useCallback } from 'react'

export interface TrackerItem {
  name: string
  icon?: string
  target?: number
}

export interface TrackerConfig {
  title: string
  items: TrackerItem[]
  period: 'daily' | 'weekly' | 'monthly'
  showStreak?: boolean
}

interface ItemState {
  completed: boolean
  count: number
  streak: number
}

export default function Tracker({ config }: { config: TrackerConfig }) {
  const [states, setStates] = useState<Record<string, ItemState>>(() => {
    const init: Record<string, ItemState> = {}
    for (const item of config.items) {
      init[item.name] = { completed: false, count: 0, streak: 0 }
    }
    return init
  })

  const toggle = useCallback((name: string) => {
    setStates(prev => {
      const s = prev[name]
      const completed = !s.completed
      return {
        ...prev,
        [name]: {
          completed,
          count: completed ? s.count + 1 : Math.max(0, s.count - 1),
          streak: completed ? s.streak + 1 : 0,
        },
      }
    })
  }, [])

  const completedCount = Object.values(states).filter(s => s.completed).length
  const totalCount = config.items.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-1 text-gray-900">{config.title}</h2>
      <p className="text-xs text-gray-400 mb-4 capitalize">{config.period} tracker</p>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{completedCount}/{totalCount} complete</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="bg-gray-200 rounded-full h-2 overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div
            className="h-full bg-purple-600 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <ul className="space-y-2" role="list">
        {config.items.map(item => {
          const s = states[item.name]
          return (
            <li key={item.name}>
              <button
                onClick={() => toggle(item.name)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors text-left ${
                  s.completed
                    ? 'bg-purple-50 border-purple-200'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
                aria-pressed={s.completed}
              >
                <span className="text-lg" aria-hidden="true">{item.icon || '○'}</span>
                <span className={`flex-1 text-sm font-medium ${s.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                  {item.name}
                </span>
                {item.target && (
                  <span className="text-xs text-gray-400">{s.count}/{item.target}</span>
                )}
                {config.showStreak && s.streak > 0 && (
                  <span className="text-xs font-semibold text-orange-500">🔥{s.streak}</span>
                )}
                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs ${
                  s.completed ? 'bg-purple-600 border-purple-600 text-white' : 'border-gray-300'
                }`}>
                  {s.completed && '✓'}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
