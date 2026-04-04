'use client'

import React, { useState, useCallback } from 'react'
import { AppearanceConfig, PrimitiveWrapper } from '../theme'

export interface TextGeneratorConfig {
  title: string
  inputLabel: string
  inputPlaceholder?: string
  buttonLabel: string
  templates: string[]
  outputLabel: string
  appearance?: AppearanceConfig
}

export default function TextGenerator({ config }: { config: TextGeneratorConfig }) {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  const generate = useCallback(() => {
    if (!input.trim() || !config.templates.length) return
    setGenerating(true)

    // Simulate generation delay for UX
    setTimeout(() => {
      const template = config.templates[Math.floor(Math.random() * config.templates.length)]
      const result = template.replace(/\{\{input\}\}/g, input.trim())
      setOutput(result)
      setGenerating(false)
    }, 300)
  }, [input, config.templates])

  const copyToClipboard = useCallback(async () => {
    if (!output) return
    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = output
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [output])

  return (
    <PrimitiveWrapper appearance={config.appearance}>
    <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: 'var(--doom-surface, white)', color: 'var(--doom-text-primary, #18181b)' }}>
      <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--doom-text-primary, #111827)' }}>{config.title}</h2>

      <label htmlFor="gen-input" className="block text-sm font-medium text-gray-700 mb-1">
        {config.inputLabel}
      </label>
      <textarea
        id="gen-input"
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder={config.inputPlaceholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-y min-h-[80px] mb-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      />

      <button
        onClick={generate}
        disabled={generating || !input.trim()}
        className="w-full px-4 py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
      >
        {generating ? 'Generating...' : config.buttonLabel}
      </button>

      {output && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-gray-700">{config.outputLabel}</label>
            <button
              onClick={copyToClipboard}
              className="text-xs text-purple-600 hover:text-purple-800 font-medium"
              aria-label="Copy to clipboard"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div
            className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap"
            role="status"
            aria-live="polite"
          >
            {output}
          </div>
        </div>
      )}
    </div>
    </PrimitiveWrapper>
  )
}
