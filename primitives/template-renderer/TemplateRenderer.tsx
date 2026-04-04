'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { AppearanceConfig, PrimitiveWrapper } from '../theme'

export interface TemplateField {
  name: string
  label: string
  placeholder: string
  type?: 'text' | 'textarea' | 'select'
  options?: string[]
}

export interface TemplateRendererConfig {
  title: string
  fields: TemplateField[]
  template: string
  copyButton?: boolean
  appearance?: AppearanceConfig
}

export default function TemplateRenderer({ config }: { config: TemplateRendererConfig }) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState(false)

  const rendered = useMemo(() => {
    let text = config.template
    for (const field of config.fields) {
      const val = values[field.name] || field.placeholder
      text = text.replace(new RegExp(`\\{\\{${field.name}\\}\\}`, 'g'), val)
    }
    return text
  }, [config.template, config.fields, values])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(rendered)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = rendered
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [rendered])

  return (
    <PrimitiveWrapper appearance={config.appearance}>
    <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: 'var(--doom-surface, white)', color: 'var(--doom-text-primary, #18181b)' }}>
      <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--doom-text-primary, #111827)' }}>{config.title}</h2>

      <div className="space-y-3 mb-4">
        {config.fields.map(field => (
          <div key={field.name}>
            <label htmlFor={`tmpl-${field.name}`} className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                id={`tmpl-${field.name}`}
                value={values[field.name] || ''}
                onChange={e => setValues(prev => ({ ...prev, [field.name]: e.target.value }))}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-y min-h-[60px] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            ) : field.type === 'select' ? (
              <select
                id={`tmpl-${field.name}`}
                value={values[field.name] || ''}
                onChange={e => setValues(prev => ({ ...prev, [field.name]: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">{field.placeholder}</option>
                {(field.options || []).map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input
                id={`tmpl-${field.name}`}
                type="text"
                value={values[field.name] || ''}
                onChange={e => setValues(prev => ({ ...prev, [field.name]: e.target.value }))}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            )}
          </div>
        ))}
      </div>

      <div className="relative">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap" aria-live="polite">
          {rendered}
        </div>
        {config.copyButton !== false && (
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 text-xs text-purple-600 hover:text-purple-800 font-medium bg-white px-2 py-1 rounded border border-gray-200"
            aria-label="Copy to clipboard"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        )}
      </div>
    </div>
    </PrimitiveWrapper>
  )
}
