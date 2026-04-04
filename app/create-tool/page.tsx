'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const CATEGORIES = [
  { key: 'money', label: 'Finance & Money', icon: '💰' },
  { key: 'productivity', label: 'Productivity', icon: '⚡' },
  { key: 'social', label: 'Social', icon: '🌐' },
  { key: 'creator', label: 'Creator Tools', icon: '🎨' },
  { key: 'business', label: 'Business', icon: '📊' },
  { key: 'utility', label: 'Utilities', icon: '🔧' },
]

const PRICING_OPTIONS = [
  { key: 'free', label: 'Free', desc: 'Anyone can use it' },
  { key: 'paid', label: 'Paid', desc: 'Set your own price' },
]

interface ToolDraft {
  category: string
  title: string
  description: string
  pricing: 'free' | 'paid'
  priceCents: number
}

interface ToolConfig {
  title: string
  description: string
  category: string
  primitives: Array<{
    type: string
    id: string
    props: Record<string, unknown>
    position: number
  }>
  layout: {
    type: string
    maxWidth: string
    padding: string
  }
  theme: {
    primaryColor: string
    backgroundColor: string
    fontFamily: string
    borderRadius: string
  }
}

const STEP_LABELS = ['Category', 'Describe', 'Preview & Publish']

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEP_LABELS.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div
            className={`flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold transition-colors ${
              i < current
                ? 'bg-doom-green text-white'
                : i === current
                  ? 'bg-doom-accent text-white'
                  : 'bg-doom-gray text-gray-500'
            }`}
          >
            {i < current ? '✓' : i + 1}
          </div>
          <span
            className={`text-sm font-medium hidden sm:block ${
              i === current ? 'text-white' : 'text-gray-500'
            }`}
          >
            {label}
          </span>
          {i < STEP_LABELS.length - 1 && (
            <div className="w-8 h-px bg-gray-800 hidden sm:block" />
          )}
        </div>
      ))}
    </div>
  )
}

function generatePreviewHtml(draft: ToolDraft): string {
  const colors: Record<string, string> = {
    money: '#10b981',
    productivity: '#6366f1',
    social: '#ec4899',
    creator: '#f59e0b',
    business: '#3b82f6',
    utility: '#8b5cf6',
  }
  const accent = colors[draft.category] || '#7c3aed'

  return `<!DOCTYPE html>
<html><head><style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: system-ui, sans-serif; background: #fafafa; display:flex; align-items:center; justify-content:center; min-height:100vh; padding:24px; }
  .card { background:white; border-radius:16px; padding:32px; max-width:420px; width:100%; box-shadow:0 1px 3px rgba(0,0,0,0.1); }
  h1 { font-size:20px; font-weight:700; color:#111; margin-bottom:8px; }
  p { font-size:14px; color:#666; line-height:1.5; margin-bottom:20px; }
  .btn { display:inline-block; background:${accent}; color:white; border:none; border-radius:10px; padding:10px 24px; font-size:14px; font-weight:600; cursor:pointer; }
  .badge { display:inline-block; background:${accent}20; color:${accent}; border-radius:6px; padding:4px 10px; font-size:12px; font-weight:600; margin-bottom:16px; }
</style></head><body>
  <div class="card">
    <span class="badge">${draft.category}</span>
    <h1>${draft.title || 'Untitled Tool'}</h1>
    <p>${draft.description || 'No description yet.'}</p>
    <button class="btn">Launch Tool</button>
  </div>
</body></html>`
}

function generateToolConfig(draft: ToolDraft): ToolConfig {
  const colorMap: Record<string, { primary: string; background: string }> = {
    money: { primary: '#10b981', background: '#f0fdf4' },
    productivity: { primary: '#6366f1', background: '#eef2ff' },
    social: { primary: '#ec4899', background: '#fdf2f8' },
    creator: { primary: '#f59e0b', background: '#fffbeb' },
    business: { primary: '#3b82f6', background: '#eff6ff' },
    utility: { primary: '#8b5cf6', background: '#f5f3ff' },
  }

  const colors = colorMap[draft.category] || { primary: '#7c3aed', background: '#f5f3ff' }

  return {
    title: draft.title,
    description: draft.description,
    category: draft.category,
    primitives: [
      {
        type: 'text',
        id: 'headline',
        props: {
          text: draft.title,
          variant: 'h1',
        },
        position: 0,
      },
      {
        type: 'text',
        id: 'description',
        props: {
          text: draft.description,
          variant: 'body',
        },
        position: 1,
      },
      {
        type: 'button',
        id: 'cta',
        props: {
          label: 'Launch Tool',
          style: 'primary',
        },
        position: 2,
      },
    ],
    layout: {
      type: 'single-column',
      maxWidth: '480px',
      padding: '24px',
    },
    theme: {
      primaryColor: colors.primary,
      backgroundColor: colors.background,
      fontFamily: 'system-ui, sans-serif',
      borderRadius: '12px',
    },
  }
}

export default function CreateToolPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [publishing, setPublishing] = useState(false)
  const [draft, setDraft] = useState<ToolDraft>({
    category: '',
    title: '',
    description: '',
    pricing: 'free',
    priceCents: 0,
  })

  const update = useCallback(
    (patch: Partial<ToolDraft>) => setDraft((prev) => ({ ...prev, ...patch })),
    []
  )

  const canAdvance = () => {
    if (step === 0) return !!draft.category
    if (step === 1) return draft.title.trim().length >= 3 && draft.description.trim().length >= 10
    return true
  }

  const handlePublish = async () => {
    setPublishing(true)
    const fallbackSlug = draft.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    const previewHtml = generatePreviewHtml(draft)
    const config = generateToolConfig(draft)

    let persistedTool: Record<string, unknown> | null = null
    try {
      const creator = JSON.parse(localStorage.getItem('agentdoom_creator') || 'null') as
        | { name?: string }
        | null
      const res = await fetch('/api/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: draft.title,
          description: draft.description,
          category: draft.category,
          pricing: draft.pricing,
          priceCents: draft.priceCents,
          previewHtml,
          config,
          creatorName: creator?.name,
        }),
      })

      if (res.ok) {
        persistedTool = await res.json()
      }
    } catch {
      // DB persistence failed; local fallback still keeps flow working
    }

    const tool = {
      id: (persistedTool?.id as string) || `tool-${Date.now()}`,
      slug: (persistedTool?.slug as string) || fallbackSlug,
      ...draft,
      previewHtml,
      publishedAt: new Date().toISOString(),
      viewsCount: 0,
      likesCount: 0,
      remixesCount: 0,
    }

    const existing = JSON.parse(localStorage.getItem('agentdoom_tools') || '[]')
    existing.push(tool)
    localStorage.setItem('agentdoom_tools', JSON.stringify(existing))

    router.push('/dashboard')
  }

  return (
    <main className="min-h-screen bg-doom-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-doom-dark/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">
            <span className="text-doom-accent">Agent</span>Doom
          </Link>
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">
            Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-10">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Create a Tool</h1>
          <p className="text-gray-400 text-sm mb-6">
            Follow the steps to build and publish your tool to the marketplace.
          </p>
        </motion.div>

        <StepIndicator current={step} />

        <AnimatePresence mode="wait">
          {/* Step 1: Category */}
          {step === 0 && (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-lg font-semibold mb-4">Pick a category</h2>
              <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => update({ category: cat.key })}
                    className={`rounded-xl border p-3 sm:p-4 text-left transition-all ${
                      draft.category === cat.key
                        ? 'border-doom-accent bg-doom-accent/10'
                        : 'border-gray-800 bg-doom-dark hover:border-gray-700'
                    }`}
                  >
                    <span className="text-2xl">{cat.icon}</span>
                    <p className="mt-2 text-sm font-medium text-white">{cat.label}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Describe */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <h2 className="text-lg font-semibold">Describe your tool</h2>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Title</label>
                <input
                  type="text"
                  value={draft.title}
                  onChange={(e) => update({ title: e.target.value })}
                  placeholder="e.g. Budget Planner, Invoice Generator"
                  className="w-full rounded-xl border border-gray-800 bg-doom-dark px-4 py-3 text-white placeholder-gray-600 focus:border-doom-accent focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
                <textarea
                  value={draft.description}
                  onChange={(e) => update({ description: e.target.value })}
                  placeholder="What does your tool do? Who is it for?"
                  rows={4}
                  className="w-full rounded-xl border border-gray-800 bg-doom-dark px-4 py-3 text-white placeholder-gray-600 focus:border-doom-accent focus:outline-none transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Pricing</label>
                <div className="flex gap-3">
                  {PRICING_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() =>
                        update({
                          pricing: opt.key as 'free' | 'paid',
                          priceCents: opt.key === 'free' ? 0 : draft.priceCents || 499,
                        })
                      }
                      className={`flex-1 rounded-xl border p-3 text-left transition-all ${
                        draft.pricing === opt.key
                          ? 'border-doom-accent bg-doom-accent/10'
                          : 'border-gray-800 bg-doom-dark hover:border-gray-700'
                      }`}
                    >
                      <p className="text-sm font-medium text-white">{opt.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>

                {draft.pricing === 'paid' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3"
                  >
                    <label className="block text-xs text-gray-400 mb-1">Price (USD)</label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">$</span>
                      <input
                        type="number"
                        min={1}
                        max={999}
                        step={1}
                        value={(draft.priceCents / 100).toFixed(2)}
                        onChange={(e) =>
                          update({ priceCents: Math.round(parseFloat(e.target.value || '0') * 100) })
                        }
                        className="w-28 rounded-lg border border-gray-800 bg-doom-dark px-3 py-2 text-white focus:border-doom-accent focus:outline-none transition-colors"
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      You earn {((draft.priceCents * 0.85) / 100).toFixed(2)} per sale (85% revenue share)
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 3: Preview & Publish */}
          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-lg font-semibold mb-4">Preview & Publish</h2>

              {/* Preview Card */}
              <div className="rounded-2xl border border-gray-800 bg-doom-dark overflow-hidden mb-6">
                <div className="h-56 bg-white">
                  <iframe
                    srcDoc={generatePreviewHtml(draft)}
                    className="w-full h-full pointer-events-none"
                    sandbox=""
                    title="Tool Preview"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="rounded-full bg-doom-accent/20 text-doom-accent-light px-2.5 py-0.5 text-xs font-medium">
                      {draft.category}
                    </span>
                    {draft.pricing === 'paid' && (
                      <span className="text-xs font-semibold text-doom-green">
                        ${(draft.priceCents / 100).toFixed(2)}
                      </span>
                    )}
                    {draft.pricing === 'free' && (
                      <span className="text-xs text-gray-500">Free</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-white">{draft.title}</h3>
                  <p className="mt-1 text-sm text-gray-400">{draft.description}</p>
                </div>
              </div>

              {/* Publish */}
              <button
                onClick={handlePublish}
                disabled={publishing}
                className={`w-full rounded-xl py-3 text-sm font-semibold transition-all ${
                  publishing
                    ? 'bg-doom-gray text-gray-500 cursor-not-allowed'
                    : 'bg-doom-green text-white hover:bg-emerald-400'
                }`}
              >
                {publishing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Publishing to marketplace...
                  </span>
                ) : (
                  'Publish to Marketplace'
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              step > 0
                ? 'text-gray-400 hover:text-white'
                : 'text-transparent cursor-default'
            }`}
            disabled={step === 0}
          >
            Back
          </button>

          {step < 2 && (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canAdvance()}
              className={`rounded-xl px-6 py-2 text-sm font-semibold transition-all ${
                canAdvance()
                  ? 'bg-doom-accent text-white hover:bg-doom-accent-light'
                  : 'bg-doom-gray text-gray-600 cursor-not-allowed'
              }`}
            >
              Next
            </button>
          )}
        </div>
      </div>
    </main>
  )
}
