'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { AppearanceConfig, PrimitiveWrapper } from '../theme'

export interface DemoExample {
  id: string
  label: string
  code: string
  language?: string
}

export interface InteractiveDemoConfig {
  title: string
  description?: string
  examples: DemoExample[]
  defaultExampleId?: string
  editable?: boolean
  showLineNumbers?: boolean
  previewType?: 'html' | 'text' | 'json'
  appearance?: AppearanceConfig
}

export default function InteractiveDemo({
  title,
  description,
  examples,
  defaultExampleId,
  editable = false,
  showLineNumbers = false,
  previewType = 'html',
  appearance,
}: InteractiveDemoConfig) {
  const initialExampleId = defaultExampleId ?? examples[0]?.id ?? ''

  const [activeExampleId, setActiveExampleId] = useState(initialExampleId)
  const [codeOverrides, setCodeOverrides] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState(false)

  const activeExample = useMemo(
    () => examples.find((ex) => ex.id === activeExampleId) ?? examples[0],
    [examples, activeExampleId]
  )

  const currentCode = useMemo(() => {
    if (!activeExample) return ''
    return codeOverrides[activeExample.id] ?? activeExample.code
  }, [activeExample, codeOverrides])

  const lineNumbers = useMemo(() => {
    if (!showLineNumbers) return []
    const lines = currentCode.split('\n')
    return lines.map((_, i) => i + 1)
  }, [currentCode, showLineNumbers])

  const handleCodeChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (!activeExample) return
      setCodeOverrides((prev) => ({
        ...prev,
        [activeExample.id]: e.target.value,
      }))
    },
    [activeExample]
  )

  const handleReset = useCallback(() => {
    if (!activeExample) return
    setCodeOverrides((prev) => {
      const next = { ...prev }
      delete next[activeExample.id]
      return next
    })
  }, [activeExample])

  const handleCopy = useCallback(async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(currentCode)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: silently fail
    }
  }, [currentCode])

  const renderedPreview = useMemo(() => {
    if (!currentCode) return null

    if (previewType === 'json') {
      let formatted = currentCode
      try {
        formatted = JSON.stringify(JSON.parse(currentCode), null, 2)
      } catch {
        // If invalid JSON, display as-is
      }
      return (
        <pre className="text-sm font-mono whitespace-pre-wrap break-words text-gray-800 p-4">
          {formatted}
        </pre>
      )
    }

    if (previewType === 'text') {
      return (
        <pre className="text-sm font-mono whitespace-pre-wrap break-words text-gray-800 p-4">
          {currentCode}
        </pre>
      )
    }

    // HTML preview
    return (
      <div
        className="p-4"
        dangerouslySetInnerHTML={{ __html: currentCode }}
      />
    )
  }, [currentCode, previewType])

  if (!examples || examples.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
        <p>No examples available.</p>
      </div>
    )
  }

  return (
    <PrimitiveWrapper appearance={appearance}>
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
      </div>

      {/* Example Tabs */}
      {examples.length > 1 && (
        <div className="px-6 pt-4 flex flex-wrap gap-2" role="tablist">
          {examples.map((ex) => (
            <button
              key={ex.id}
              role="tab"
              aria-selected={ex.id === activeExampleId}
              onClick={() => setActiveExampleId(ex.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                ex.id === activeExampleId
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {ex.label}
            </button>
          ))}
        </div>
      )}

      {/* Split Pane */}
      <div className="flex flex-col md:flex-row">
        {/* Code Pane */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              {activeExample?.language ?? 'Code'}
            </span>
            <div className="flex items-center gap-2">
              {editable && codeOverrides[activeExample?.id ?? ''] !== undefined && (
                <button
                  onClick={handleReset}
                  className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded"
                >
                  Reset
                </button>
              )}
              <button
                onClick={handleCopy}
                className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded"
              >
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
            </div>
          </div>
          <div className="relative" style={{ backgroundColor: '#1e1e2e' }}>
            <div className="flex">
              {showLineNumbers && (
                <div
                  className="flex-shrink-0 py-4 pl-4 pr-2 text-right select-none"
                  aria-hidden="true"
                >
                  {lineNumbers.map((num) => (
                    <div
                      key={num}
                      className="text-xs leading-6 font-mono text-gray-600"
                    >
                      {num}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex-1 min-w-0">
                {editable ? (
                  <textarea
                    value={currentCode}
                    onChange={handleCodeChange}
                    spellCheck={false}
                    className="w-full h-full min-h-[200px] p-4 bg-transparent text-gray-200 font-mono text-sm leading-6 resize-y outline-none border-none"
                    style={{ tabSize: 2 }}
                  />
                ) : (
                  <pre className="p-4 text-gray-200 font-mono text-sm leading-6 overflow-x-auto whitespace-pre">
                    {currentCode}
                  </pre>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Preview Pane */}
        <div className="flex-1 min-w-0 border-t md:border-t-0 md:border-l border-gray-200">
          <div className="flex items-center px-4 py-2 bg-gray-50 border-b border-gray-200">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Preview
            </span>
          </div>
          <div className="overflow-auto min-h-[200px]">{renderedPreview}</div>
        </div>
      </div>
    </div>
    </PrimitiveWrapper>
  )
}
