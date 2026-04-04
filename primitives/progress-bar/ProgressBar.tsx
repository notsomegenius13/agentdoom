'use client'

import React, { useState, useCallback } from 'react'
import { AppearanceConfig, PrimitiveWrapper } from '../theme'

export interface ProgressBarConfig {
  title: string
  mode: 'bar' | 'stepper'
  // Bar mode
  value?: number // 0-100
  showPercentage?: boolean
  animated?: boolean
  striped?: boolean
  size?: 'sm' | 'md' | 'lg'
  color?: string
  // Stepper mode
  steps?: { label: string; description?: string }[]
  currentStep?: number // 0-indexed
  allowClickNavigation?: boolean
  appearance?: AppearanceConfig
}

const sizeClasses = {
  sm: 'h-1.5',
  md: 'h-3',
  lg: 'h-5',
} as const

const sizeLabelClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
} as const

export default function ProgressBar({ config }: { config: ProgressBarConfig }) {
  const [activeStep, setActiveStep] = useState(config.currentStep ?? 0)

  const size = config.size ?? 'md'
  const color = config.color ?? '#9333ea'
  const value = Math.max(0, Math.min(100, config.value ?? 0))
  const showPercentage = config.showPercentage ?? true
  const animated = config.animated ?? true
  const striped = config.striped ?? false
  const steps = config.steps ?? []

  const handleStepClick = useCallback(
    (index: number) => {
      if (config.allowClickNavigation) {
        setActiveStep(index)
      }
    },
    [config.allowClickNavigation]
  )

  return (
    <PrimitiveWrapper appearance={config.appearance}>
    <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: 'var(--doom-surface, white)', color: 'var(--doom-text-primary, #18181b)' }}>
      <h2 className="text-lg font-semibold mb-1 text-gray-900">{config.title}</h2>
      <p className="text-xs text-gray-400 mb-4 capitalize">{config.mode}</p>

      {config.mode === 'bar' ? (
        <div>
          {/* Progress bar */}
          <div
            role="progressbar"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={config.title}
            className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}
          >
            <div
              className={`h-full rounded-full ${animated ? 'transition-all duration-500 ease-out' : ''} ${
                striped ? 'bg-stripes' : ''
              }`}
              style={{
                width: `${value}%`,
                backgroundColor: color,
                ...(striped
                  ? {
                      backgroundImage: `repeating-linear-gradient(
                        45deg,
                        transparent,
                        transparent 8px,
                        rgba(255,255,255,0.2) 8px,
                        rgba(255,255,255,0.2) 16px
                      )`,
                      backgroundSize: '200% 100%',
                      animation: animated ? 'stripeMove 1s linear infinite' : undefined,
                    }
                  : {}),
              }}
            />
          </div>

          {/* Percentage label */}
          {showPercentage && (
            <p className={`mt-2 font-medium text-gray-700 ${sizeLabelClasses[size]}`}>
              {value}%
            </p>
          )}

          {/* Stripe animation keyframes */}
          {striped && animated && (
            <style>{`
              @keyframes stripeMove {
                0% { background-position: 0 0; }
                100% { background-position: 32px 0; }
              }
            `}</style>
          )}
        </div>
      ) : (
        <div>
          {/* Stepper */}
          <div
            role="progressbar"
            aria-valuenow={activeStep + 1}
            aria-valuemin={1}
            aria-valuemax={steps.length}
            aria-label={config.title}
            className="flex items-start"
          >
            {steps.map((step, index) => {
              const isCompleted = index < activeStep
              const isActive = index === activeStep
              const isUpcoming = index > activeStep
              const isLast = index === steps.length - 1

              return (
                <div key={index} className="flex items-start flex-1">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStepClick(index)}
                      disabled={!config.allowClickNavigation}
                      aria-label={`Step ${index + 1}: ${step.label}`}
                      data-testid={`step-${index}`}
                      className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                        transition-all duration-300
                        ${isCompleted ? 'bg-purple-600 text-white' : ''}
                        ${isActive ? 'bg-purple-600 text-white ring-4 ring-purple-100' : ''}
                        ${isUpcoming ? 'bg-gray-200 text-gray-500' : ''}
                        ${config.allowClickNavigation ? 'cursor-pointer hover:ring-4 hover:ring-purple-100' : 'cursor-default'}
                      `}
                    >
                      {isCompleted ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        index + 1
                      )}
                    </button>
                    <p
                      className={`mt-2 text-xs font-medium text-center max-w-[80px] ${
                        isActive ? 'text-purple-600' : isCompleted ? 'text-gray-700' : 'text-gray-400'
                      }`}
                    >
                      {step.label}
                    </p>
                    {step.description && (
                      <p className="text-[10px] text-gray-400 text-center max-w-[80px] mt-0.5">
                        {step.description}
                      </p>
                    )}
                  </div>

                  {/* Connector line */}
                  {!isLast && (
                    <div className="flex-1 mt-4 mx-2">
                      <div className="h-0.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-purple-600 rounded-full transition-all duration-500 ${
                            isCompleted ? 'w-full' : 'w-0'
                          }`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
    </PrimitiveWrapper>
  )
}
