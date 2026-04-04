'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { AppearanceConfig, PrimitiveWrapper } from '../theme'

export interface BoardTask {
  id: string
  title: string
  description?: string
  priority?: 'low' | 'medium' | 'high' | 'critical'
  assignee?: string
  tags?: string[]
  dueDate?: string
}

export interface BoardColumn {
  id: string
  title: string
  color?: string
  tasks: BoardTask[]
}

export interface ProjectBoardConfig {
  title: string
  subtitle?: string
  columns: BoardColumn[]
  showStats?: boolean
  allowAdd?: boolean
  allowMove?: boolean
  showFilters?: boolean
  appearance?: AppearanceConfig
}

const priorityColors: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
}

export default function ProjectBoard(config: ProjectBoardConfig) {
  const { title, subtitle, showStats = false, allowAdd = false, allowMove = false, showFilters = false } = config

  const [columns, setColumns] = useState<BoardColumn[]>(config.columns)
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')

  const totalTasks = useMemo(() => columns.reduce((sum, col) => sum + col.tasks.length, 0), [columns])

  const completionRate = useMemo(() => {
    if (totalTasks === 0) return 0
    const doneCol = columns.find((col) => col.title.toLowerCase() === 'done')
    if (!doneCol) return 0
    return Math.round((doneCol.tasks.length / totalTasks) * 100)
  }, [columns, totalTasks])

  const filterTasks = useCallback(
    (tasks: BoardTask[]): BoardTask[] => {
      return tasks.filter((task) => {
        const matchesSearch =
          !searchQuery ||
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
        const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter
        return matchesSearch && matchesPriority
      })
    },
    [searchQuery, priorityFilter]
  )

  const handleAddTask = useCallback((columnId: string) => {
    setColumns((prev) =>
      prev.map((col) => {
        if (col.id !== columnId) return col
        const newTask: BoardTask = {
          id: `task-${Date.now()}`,
          title: 'New Task',
        }
        return { ...col, tasks: [...col.tasks, newTask] }
      })
    )
  }, [])

  const handleMoveTask = useCallback((taskId: string, fromColumnId: string, direction: 'left' | 'right') => {
    setColumns((prev) => {
      const fromIndex = prev.findIndex((col) => col.id === fromColumnId)
      const toIndex = direction === 'left' ? fromIndex - 1 : fromIndex + 1
      if (toIndex < 0 || toIndex >= prev.length) return prev

      const fromCol = prev[fromIndex]
      const task = fromCol.tasks.find((t) => t.id === taskId)
      if (!task) return prev

      return prev.map((col, i) => {
        if (i === fromIndex) return { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) }
        if (i === toIndex) return { ...col, tasks: [...col.tasks, task] }
        return col
      })
    })
  }, [])

  return (
    <PrimitiveWrapper appearance={config.appearance}>
    <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: 'var(--doom-surface, white)', color: 'var(--doom-text-primary, #18181b)' }}>
      {/* Title Bar */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>

      {/* Stats Bar */}
      {showStats && (
        <div className="flex flex-wrap gap-4 mb-4 p-3 bg-gray-50 rounded-lg" data-testid="stats-bar">
          <div className="text-sm">
            <span className="text-gray-500">Total Tasks:</span>{' '}
            <span className="font-semibold text-gray-900">{totalTasks}</span>
          </div>
          {columns.map((col) => (
            <div key={col.id} className="text-sm">
              <span className="text-gray-500">{col.title}:</span>{' '}
              <span className="font-semibold text-gray-900">{col.tasks.length}</span>
            </div>
          ))}
          {columns.some((col) => col.title.toLowerCase() === 'done') && (
            <div className="text-sm">
              <span className="text-gray-500">Completion:</span>{' '}
              <span className="font-semibold text-purple-600">{completionRate}%</span>
            </div>
          )}
        </div>
      )}

      {/* Filter Bar */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 mb-4">
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-[200px] px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          />
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      )}

      {/* Kanban Columns */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        {columns.map((column, colIndex) => {
          const filteredTasks = filterTasks(column.tasks)
          return (
            <div
              key={column.id}
              className="flex-shrink-0 w-72 bg-gray-50 rounded-lg"
              style={{ borderTop: `3px solid ${column.color || '#9333ea'}` }}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between p-3">
                <h3 className="font-semibold text-gray-900 text-sm">{column.title}</h3>
                <span className="bg-gray-200 text-gray-700 text-xs font-medium px-2 py-0.5 rounded-full">
                  {filteredTasks.length}
                </span>
              </div>

              {/* Task Cards */}
              <div className="px-3 pb-3 space-y-2 min-h-[60px]">
                {filteredTasks.map((task) => (
                  <div key={task.id} className="bg-white rounded-lg p-3 shadow-sm border border-gray-100" data-testid="task-card">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-medium text-gray-900 flex-1">{task.title}</h4>
                      {task.priority && (
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded font-medium whitespace-nowrap ${priorityColors[task.priority] || ''}`}
                        >
                          {task.priority}
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
                    )}

                    {task.tags && task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {task.tags.map((tag) => (
                          <span key={tag} className="text-xs bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        {task.assignee && (
                          <div className="w-5 h-5 bg-purple-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
                            {task.assignee.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {task.dueDate && <span className="text-xs text-gray-400">{task.dueDate}</span>}
                      </div>

                      {allowMove && (
                        <div className="flex gap-1">
                          {colIndex > 0 && (
                            <button
                              onClick={() => handleMoveTask(task.id, column.id, 'left')}
                              className="text-gray-400 hover:text-purple-600 text-xs p-0.5"
                              aria-label="Move left"
                            >
                              &larr;
                            </button>
                          )}
                          {colIndex < columns.length - 1 && (
                            <button
                              onClick={() => handleMoveTask(task.id, column.id, 'right')}
                              className="text-gray-400 hover:text-purple-600 text-xs p-0.5"
                              aria-label="Move right"
                            >
                              &rarr;
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Add Task Button */}
                {allowAdd && (
                  <button
                    onClick={() => handleAddTask(column.id)}
                    className="w-full py-2 text-sm text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg border border-dashed border-gray-300 hover:border-purple-300 transition-colors"
                  >
                    + Add Task
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
    </PrimitiveWrapper>
  )
}
