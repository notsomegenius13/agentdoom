'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type GenerationState = 'idle' | 'classifying' | 'generating' | 'assembling' | 'deploying' | 'done' | 'error'

const STATUS_MESSAGES: Record<GenerationState, string> = {
  idle: '',
  classifying: 'Understanding your intent...',
  generating: 'Building your tool...',
  assembling: 'Assembling components...',
  deploying: 'Deploying to the edge...',
  done: 'Your tool is live!',
  error: 'Something went wrong. Try again.',
}

export default function GeneratePage() {
  const [prompt, setPrompt] = useState('')
  const [state, setState] = useState<GenerationState>('idle')
  const [preview, setPreview] = useState<string | null>(null)
  const [deployUrl, setDeployUrl] = useState<string | null>(null)
  const [streamLines, setStreamLines] = useState<string[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || state !== 'idle') return

    setState('classifying')
    setStreamLines([])
    setPreview(null)
    setDeployUrl(null)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() }),
      })

      if (!res.ok) throw new Error('Generation failed')

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No stream')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') continue

          try {
            const event = JSON.parse(data)
            if (event.stage) setState(event.stage as GenerationState)
            if (event.line) setStreamLines(prev => [...prev, event.line])
            if (event.preview) setPreview(event.preview)
            if (event.url) setDeployUrl(event.url)
          } catch {
            // skip malformed events
          }
        }
      }

      setState('done')
    } catch {
      setState('error')
    }
  }, [prompt, state])

  const handleReset = () => {
    setState('idle')
    setPrompt('')
    setPreview(null)
    setDeployUrl(null)
    setStreamLines([])
    textareaRef.current?.focus()
  }

  const isGenerating = state !== 'idle' && state !== 'done' && state !== 'error'

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          <span className="text-doom-accent">Agent</span>Doom
        </h1>
        <p className="mt-2 text-gray-400 text-sm md:text-base">
          Describe any tool. Watch it build itself. Deploy in seconds.
        </p>
      </motion.div>

      {/* Prompt Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-2xl"
      >
        <div className="relative rounded-2xl border border-gray-800 bg-doom-dark p-1 focus-within:border-doom-accent/50 transition-colors">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleGenerate()
              }
            }}
            placeholder="A tip calculator that splits the bill between friends..."
            disabled={isGenerating}
            rows={3}
            className="w-full resize-none bg-transparent px-4 py-3 text-white placeholder-gray-500 focus:outline-none disabled:opacity-50 text-base md:text-lg"
          />
          <div className="flex items-center justify-between px-3 pb-2">
            <span className="text-xs text-gray-600">
              {prompt.length > 0 ? `${prompt.length} chars` : 'Press Enter to generate'}
            </span>
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="rounded-xl bg-doom-accent px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-doom-accent-light disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
            >
              {isGenerating ? 'Building...' : 'Generate'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Status + Streaming Preview */}
      <AnimatePresence mode="wait">
        {state !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full max-w-2xl mt-6"
          >
            {/* Status bar */}
            <div className="flex items-center gap-3 mb-4">
              {isGenerating && (
                <div className="h-2 w-2 rounded-full bg-doom-accent animate-pulse" />
              )}
              {state === 'done' && (
                <div className="h-2 w-2 rounded-full bg-doom-green" />
              )}
              {state === 'error' && (
                <div className="h-2 w-2 rounded-full bg-doom-red" />
              )}
              <span className="text-sm text-gray-400">
                {STATUS_MESSAGES[state]}
              </span>
            </div>

            {/* Stream output */}
            {streamLines.length > 0 && (
              <div className={`rounded-xl border border-gray-800 bg-doom-dark p-4 font-mono text-xs md:text-sm overflow-auto max-h-64 ${isGenerating ? 'pulse-glow' : ''}`}>
                {streamLines.map((line, i) => (
                  <div key={i} className="text-gray-300 leading-relaxed">
                    <span className="text-doom-accent-light mr-2">{'>'}</span>
                    {line}
                  </div>
                ))}
              </div>
            )}

            {/* Preview iframe */}
            {preview && (
              <div className="mt-4 rounded-xl border border-gray-800 overflow-hidden">
                <div className="bg-doom-gray px-4 py-2 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-500/60" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                    <div className="h-3 w-3 rounded-full bg-green-500/60" />
                  </div>
                  <span className="text-xs text-gray-500 ml-2">Preview</span>
                </div>
                <iframe
                  srcDoc={preview}
                  className="w-full h-[400px] bg-white"
                  sandbox="allow-scripts"
                  title="Tool Preview"
                />
              </div>
            )}

            {/* Deploy button / URL */}
            {state === 'done' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 flex flex-col sm:flex-row items-center gap-3"
              >
                {deployUrl ? (
                  <a
                    href={deployUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto text-center rounded-xl bg-doom-green px-8 py-3 text-sm font-semibold text-white transition-all hover:bg-emerald-400 active:scale-95"
                  >
                    View Live Tool
                  </a>
                ) : (
                  <button className="w-full sm:w-auto rounded-xl bg-doom-green px-8 py-3 text-sm font-semibold text-white transition-all hover:bg-emerald-400 active:scale-95">
                    Deploy
                  </button>
                )}
                <button
                  onClick={handleReset}
                  className="w-full sm:w-auto rounded-xl border border-gray-700 px-8 py-3 text-sm font-semibold text-gray-300 transition-all hover:border-gray-500 active:scale-95"
                >
                  Build Another
                </button>
              </motion.div>
            )}

            {state === 'error' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4"
              >
                <button
                  onClick={handleReset}
                  className="rounded-xl border border-gray-700 px-8 py-3 text-sm font-semibold text-gray-300 transition-all hover:border-gray-500 active:scale-95"
                >
                  Try Again
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="fixed bottom-4 text-center text-xs text-gray-600">
        Built with AgentDoom
      </div>
    </main>
  )
}
