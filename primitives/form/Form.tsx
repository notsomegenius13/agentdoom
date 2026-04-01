'use client'

import React, { useState, useCallback } from 'react'

export interface FormField {
  name: string
  label: string
  type: 'text' | 'number' | 'email' | 'textarea' | 'select' | 'checkbox'
  placeholder?: string
  options?: string[]
  required?: boolean
}

export interface FormConfig {
  title: string
  fields: FormField[]
  submitLabel: string
  successMessage: string
}

export default function Form({ config }: { config: FormConfig }) {
  const [values, setValues] = useState<Record<string, string | boolean>>({})
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = useCallback((name: string, value: string | boolean) => {
    setValues(prev => ({ ...prev, [name]: value }))
    setErrors(prev => {
      const next = { ...prev }
      delete next[name]
      return next
    })
  }, [])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    for (const field of config.fields) {
      if (field.required && !values[field.name] && values[field.name] !== false) {
        newErrors[field.name] = `${field.label} is required`
      }
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    setSubmitted(true)
  }, [config.fields, values])

  if (submitted) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm" role="status">
        <div className="text-center py-8">
          <div className="text-4xl mb-3" aria-hidden="true">✓</div>
          <p className="text-lg font-semibold text-gray-800">{config.successMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4 text-gray-900">{config.title}</h2>
      <form onSubmit={handleSubmit} noValidate>
        {config.fields.map(field => (
          <div key={field.name} className="mb-3">
            {field.type !== 'checkbox' && (
              <label
                htmlFor={`form-${field.name}`}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {field.label}
                {field.required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
              </label>
            )}

            {field.type === 'textarea' ? (
              <textarea
                id={`form-${field.name}`}
                placeholder={field.placeholder}
                value={(values[field.name] as string) || ''}
                onChange={e => handleChange(field.name, e.target.value)}
                required={field.required}
                aria-invalid={!!errors[field.name]}
                aria-describedby={errors[field.name] ? `err-${field.name}` : undefined}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-y min-h-[80px] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            ) : field.type === 'select' ? (
              <select
                id={`form-${field.name}`}
                value={(values[field.name] as string) || ''}
                onChange={e => handleChange(field.name, e.target.value)}
                required={field.required}
                aria-invalid={!!errors[field.name]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select...</option>
                {(field.options || []).map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : field.type === 'checkbox' ? (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  id={`form-${field.name}`}
                  type="checkbox"
                  checked={!!values[field.name]}
                  onChange={e => handleChange(field.name, e.target.checked)}
                  className="w-4 h-4 accent-purple-600"
                />
                <span className="text-sm text-gray-700">{field.label}</span>
              </label>
            ) : (
              <input
                id={`form-${field.name}`}
                type={field.type}
                placeholder={field.placeholder}
                value={(values[field.name] as string) || ''}
                onChange={e => handleChange(field.name, e.target.value)}
                required={field.required}
                aria-invalid={!!errors[field.name]}
                aria-describedby={errors[field.name] ? `err-${field.name}` : undefined}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            )}

            {errors[field.name] && (
              <p id={`err-${field.name}`} className="text-red-500 text-xs mt-1" role="alert">
                {errors[field.name]}
              </p>
            )}
          </div>
        ))}

        <button
          type="submit"
          className="w-full mt-2 px-4 py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        >
          {config.submitLabel}
        </button>
      </form>
    </div>
  )
}
