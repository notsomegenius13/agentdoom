'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'

export interface ModalConfig {
  title: string
  triggerLabel: string
  content: string
  showCloseButton?: boolean
  size?: 'sm' | 'md' | 'lg'
  overlayDismiss?: boolean
}

const sizeClasses: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

export default function Modal({ config }: { config: ModalConfig }) {
  const [isOpen, setIsOpen] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const showClose = config.showCloseButton !== false
  const size = config.size || 'md'
  const overlayDismiss = config.overlayDismiss !== false

  const close = useCallback(() => {
    setIsOpen(false)
    triggerRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    dialogRef.current?.focus()
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, close])

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4 text-gray-900">{config.title}</h2>
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
      >
        {config.triggerLabel}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          data-testid="modal-overlay"
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={overlayDismiss ? close : undefined}
            aria-hidden="true"
          />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            tabIndex={-1}
            className={`relative bg-white rounded-xl shadow-lg p-6 w-full mx-4 ${sizeClasses[size]}`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 id="modal-title" className="text-base font-semibold text-gray-900">
                {config.title}
              </h3>
              {showClose && (
                <button
                  onClick={close}
                  aria-label="Close"
                  className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                >
                  &times;
                </button>
              )}
            </div>
            <div className="text-sm text-gray-700 leading-relaxed">{config.content}</div>
          </div>
        </div>
      )}
    </div>
  )
}
