'use client'

import React, { useState, useEffect, useCallback } from 'react'

export interface ToastItem {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
}

export interface ToastConfig {
  title: string
  toasts: ToastItem[]
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  autoDismiss?: boolean
  dismissAfterMs?: number
}

const typeStyles: Record<ToastItem['type'], string> = {
  success: 'bg-green-50 border-green-400 text-green-800',
  error: 'bg-red-50 border-red-400 text-red-800',
  warning: 'bg-amber-50 border-amber-400 text-amber-800',
  info: 'bg-blue-50 border-blue-400 text-blue-800',
}

const typeIcons: Record<ToastItem['type'], string> = {
  success: '\u2713',
  error: '\u2717',
  warning: '\u26A0',
  info: '\u2139',
}

const positionStyles: Record<NonNullable<ToastConfig['position']>, string> = {
  'top-right': 'top-0 right-0',
  'top-left': 'top-0 left-0',
  'bottom-right': 'bottom-0 right-0',
  'bottom-left': 'bottom-0 left-0',
}

export default function Toast({ config }: { config: ToastConfig }) {
  const [visible, setVisible] = useState<Set<string>>(() => new Set(config.toasts.map(t => t.id)))

  useEffect(() => {
    setVisible(new Set(config.toasts.map(t => t.id)))
  }, [config.toasts])

  useEffect(() => {
    if (config.autoDismiss === false) return
    const ms = config.dismissAfterMs ?? 5000
    const timers = config.toasts.map(t =>
      setTimeout(() => {
        setVisible(prev => {
          const next = new Set(prev)
          next.delete(t.id)
          return next
        })
      }, ms)
    )
    return () => timers.forEach(clearTimeout)
  }, [config.toasts, config.autoDismiss, config.dismissAfterMs])

  const dismiss = useCallback((id: string) => {
    setVisible(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])

  const position = config.position ?? 'top-right'
  const activeToasts = config.toasts.filter(t => visible.has(t.id))

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4 text-gray-900">{config.title}</h2>

      <div className={`relative min-h-[200px]`}>
        <div className={`absolute ${positionStyles[position]} flex flex-col gap-3 w-80`}>
          {activeToasts.map(toast => (
            <div
              key={toast.id}
              role="alert"
              aria-live="polite"
              className={`flex items-start gap-3 p-3 rounded-lg border ${typeStyles[toast.type]} transition-all duration-300`}
            >
              <span className="text-base font-bold mt-0.5" aria-hidden="true">
                {typeIcons[toast.type]}
              </span>
              <p className="flex-1 text-sm">{toast.message}</p>
              <button
                onClick={() => dismiss(toast.id)}
                className="text-current opacity-60 hover:opacity-100 transition-opacity text-sm font-bold"
                aria-label={`Dismiss ${toast.message}`}
              >
                \u00D7
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
