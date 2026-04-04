'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { AppearanceConfig, PrimitiveWrapper } from '../theme'

export interface ModalConfig {
  title: string
  triggerLabel: string
  content: string
  showCloseButton?: boolean
  size?: 'sm' | 'md' | 'lg'
  overlayDismiss?: boolean
  appearance?: AppearanceConfig
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
    <PrimitiveWrapper appearance={config.appearance}>
    <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: 'var(--doom-surface, white)', color: 'var(--doom-text-primary, #18181b)' }}>
      <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--doom-text-primary, #111827)' }}>{config.title}</h2>
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
      >
        {config.triggerLabel}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center animate-[fadeIn_200ms_ease-out]"
          data-testid="modal-overlay"
        >
          <div
            className="absolute inset-0 bg-black/50 animate-[fadeIn_200ms_ease-out]"
            onClick={overlayDismiss ? close : undefined}
            aria-hidden="true"
          />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            tabIndex={-1}
            className={`relative rounded-xl p-6 w-full mx-4 ${sizeClasses[size]} animate-[scaleIn_200ms_ease-out]`}
            style={{ backgroundColor: 'var(--doom-surface, white)', transformOrigin: 'center center', boxShadow: 'var(--doom-shadow, 0 25px 50px -12px rgba(0, 0, 0, 0.25))' }}
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
    </PrimitiveWrapper>
  )
}
