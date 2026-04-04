'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { AppearanceConfig, PrimitiveWrapper } from '../theme'

export interface WizardField {
  name: string
  label: string
  type: 'text' | 'number' | 'email' | 'textarea' | 'select' | 'checkbox'
  placeholder?: string
  options?: string[]
  required?: boolean
}

export interface WizardStep {
  id: string
  title: string
  description?: string
  fields: WizardField[]
}

export interface WizardFormConfig {
  title: string
  steps: WizardStep[]
  submitLabel?: string
  successMessage?: string
  showReview?: boolean
  appearance?: AppearanceConfig
}

type FormData = Record<string, string | boolean>

export default function WizardForm(config: WizardFormConfig) {
  const {
    title,
    steps,
    submitLabel = 'Submit',
    successMessage = 'Form submitted successfully!',
    showReview = false,
  } = config

  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [formData, setFormData] = useState<FormData>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isReviewing, setIsReviewing] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const totalSteps = steps.length
  const currentStep = steps[currentStepIndex] ?? null

  const setFieldValue = useCallback((name: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[name]
      return next
    })
  }, [])

  const validateCurrentStep = useCallback((): boolean => {
    if (!currentStep) return true
    const newErrors: Record<string, string> = {}
    for (const field of currentStep.fields) {
      if (field.required) {
        const value = formData[field.name]
        if (field.type === 'checkbox') {
          if (!value) {
            newErrors[field.name] = `${field.label} is required`
          }
        } else {
          if (!value || (typeof value === 'string' && value.trim() === '')) {
            newErrors[field.name] = `${field.label} is required`
          }
        }
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [currentStep, formData])

  const handleNext = useCallback(() => {
    if (!validateCurrentStep()) return
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex((prev) => prev + 1)
    } else if (showReview) {
      setIsReviewing(true)
    } else {
      setIsSubmitted(true)
    }
  }, [validateCurrentStep, currentStepIndex, totalSteps, showReview])

  const handleBack = useCallback(() => {
    if (isReviewing) {
      setIsReviewing(false)
    } else if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1)
    }
  }, [isReviewing, currentStepIndex])

  const handleSubmit = useCallback(() => {
    setIsSubmitted(true)
  }, [])

  const stepIndicator = useMemo(() => {
    if (totalSteps === 0) return null
    return (
      <div className="flex items-center justify-center mb-8 flex-wrap gap-y-2">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex || isSubmitted || isReviewing
          const isCurrent = index === currentStepIndex && !isReviewing && !isSubmitted
          return (
            <React.Fragment key={step.id}>
              {index > 0 && (
                <div
                  className={`h-0.5 w-6 sm:w-12 transition-colors duration-300 ${
                    index <= currentStepIndex || isReviewing || isSubmitted
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                />
              )}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200 ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isCurrent
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-gray-200 text-gray-500'
                }`}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
            </React.Fragment>
          )
        })}
      </div>
    )
  }, [steps, currentStepIndex, isReviewing, isSubmitted, totalSteps])

  const renderField = useCallback(
    (field: WizardField) => {
      const value = formData[field.name] ?? (field.type === 'checkbox' ? false : '')
      const error = errors[field.name]

      if (field.type === 'checkbox') {
        return (
          <div key={field.name} className="mb-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!value}
                onChange={(e) => setFieldValue(field.name, e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-gray-700">{field.label}</span>
              {field.required && <span className="text-red-500">*</span>}
            </label>
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
          </div>
        )
      }

      if (field.type === 'textarea') {
        return (
          <div key={field.name} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              value={value as string}
              onChange={(e) => setFieldValue(field.name, e.target.value)}
              placeholder={field.placeholder}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
          </div>
        )
      }

      if (field.type === 'select') {
        return (
          <div key={field.name} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              value={value as string}
              onChange={(e) => setFieldValue(field.name, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">{field.placeholder || 'Select an option'}</option>
              {field.options?.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
          </div>
        )
      }

      return (
        <div key={field.name} className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type={field.type}
            value={value as string}
            onChange={(e) => setFieldValue(field.name, e.target.value)}
            placeholder={field.placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
      )
    },
    [formData, errors, setFieldValue]
  )

  const renderReview = useCallback(() => {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Review Your Information</h3>
        {steps.map((step) => (
          <div key={step.id} className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">{step.title}</h4>
            <div className="space-y-1">
              {step.fields.map((field) => {
                const value = formData[field.name]
                const displayValue =
                  field.type === 'checkbox'
                    ? value
                      ? 'Yes'
                      : 'No'
                    : (value as string) || '(not provided)'
                return (
                  <div key={field.name} className="flex justify-between text-sm">
                    <span className="text-gray-500">{field.label}</span>
                    <span className="text-gray-900 font-medium">{displayValue}</span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    )
  }, [steps, formData])

  if (isSubmitted) {
    return (
      <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: 'var(--doom-surface, white)', color: 'var(--doom-text-primary, #18181b)' }}>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{successMessage}</h2>
          <p className="text-sm text-gray-500">Thank you for your submission.</p>
        </div>
      </div>
    )
  }

  if (totalSteps === 0) {
    return (
      <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: 'var(--doom-surface, white)', color: 'var(--doom-text-primary, #18181b)' }}>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
        <p className="text-sm text-gray-500">No steps configured.</p>
      </div>
    )
  }

  return (
    <PrimitiveWrapper appearance={config.appearance}>
    <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: 'var(--doom-surface, white)', color: 'var(--doom-text-primary, #18181b)' }}>
      <h2 className="text-lg font-semibold text-gray-900 mb-6">{title}</h2>

      {stepIndicator}

      {isReviewing ? (
        <>
          {renderReview()}
          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700"
            >
              {submitLabel}
            </button>
          </div>
        </>
      ) : currentStep ? (
        <>
          <div className="mb-6">
            <h3 className="text-base font-semibold text-gray-900">{currentStep.title}</h3>
            {currentStep.description && (
              <p className="text-sm text-gray-500 mt-1">{currentStep.description}</p>
            )}
          </div>

          <div>
            {currentStep.fields.map((field) => renderField(field))}
          </div>

          <div className="flex justify-between mt-8">
            {currentStepIndex > 0 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
            ) : (
              <div />
            )}
            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700"
            >
              {currentStepIndex === totalSteps - 1
                ? showReview
                  ? 'Review'
                  : submitLabel
                : 'Next'}
            </button>
          </div>
        </>
      ) : null}
    </div>
    </PrimitiveWrapper>
  )
}
