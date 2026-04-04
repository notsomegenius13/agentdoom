'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

const CATEGORIES = [
  { key: 'money', label: 'Finance & Money' },
  { key: 'productivity', label: 'Productivity' },
  { key: 'social', label: 'Social' },
  { key: 'creator', label: 'Creator Tools' },
  { key: 'business', label: 'Business' },
  { key: 'utility', label: 'Utilities' },
]

interface ToolData {
  id: string
  slug: string
  title: string
  description: string
  category: string
  pricing: 'free' | 'paid'
  priceCents: number
  previewHtml: string | null
  publishedAt: string
  viewsCount: number
  likesCount: number
  remixesCount: number
}

export default function EditToolPage() {
  const params = useParams()
  const router = useRouter()
  const toolId = params.toolId as string

  const [tool, setTool] = useState<ToolData | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [pricing, setPricing] = useState<'free' | 'paid'>('free')
  const [priceCents, setPriceCents] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('agentdoom_tools')
    if (!stored) return

    try {
      const tools: ToolData[] = JSON.parse(stored)
      const found = tools.find((t) => t.id === toolId)
      if (found) {
        setTool(found)
        setTitle(found.title)
        setDescription(found.description)
        setCategory(found.category)
        setPricing(found.pricing)
        setPriceCents(found.priceCents)
      }
    } catch {}
  }, [toolId])

  const handleSave = async () => {
    if (!tool) return
    setSaving(true)
    setSaved(false)

    await new Promise((r) => setTimeout(r, 800))

    const stored = localStorage.getItem('agentdoom_tools')
    if (stored) {
      try {
        const tools: ToolData[] = JSON.parse(stored)
        const idx = tools.findIndex((t) => t.id === toolId)
        if (idx >= 0) {
          const slug = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
          tools[idx] = {
            ...tools[idx],
            title,
            description,
            category,
            pricing,
            priceCents: pricing === 'free' ? 0 : priceCents,
            slug,
          }
          localStorage.setItem('agentdoom_tools', JSON.stringify(tools))
        }
      } catch {}
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleDelete = () => {
    const stored = localStorage.getItem('agentdoom_tools')
    if (stored) {
      try {
        const tools: ToolData[] = JSON.parse(stored)
        localStorage.setItem(
          'agentdoom_tools',
          JSON.stringify(tools.filter((t) => t.id !== toolId))
        )
      } catch {}
    }
    router.push('/dashboard')
  }

  if (!tool) {
    return (
      <main className="min-h-screen bg-doom-black text-white flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400">Tool not found</p>
        <Link href="/dashboard" className="text-doom-accent hover:underline text-sm">
          Back to Dashboard
        </Link>
      </main>
    )
  }

  const canSave = title.trim().length >= 3 && description.trim().length >= 10

  return (
    <main className="min-h-screen bg-doom-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-doom-dark/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold tracking-tight">
            <span className="text-doom-accent">Agent</span>Doom
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={!canSave || saving}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                canSave && !saving
                  ? 'bg-doom-green text-white hover:bg-emerald-400'
                  : 'bg-doom-gray text-gray-600 cursor-not-allowed'
              }`}
            >
              {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold mb-1">Edit Tool</h1>
          <p className="text-gray-400 text-sm mb-8">
            Update your tool&apos;s details, pricing, and description.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-gray-800 bg-doom-dark px-4 py-3 text-white placeholder-gray-600 focus:border-doom-accent focus:outline-none transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-gray-800 bg-doom-dark px-4 py-3 text-white placeholder-gray-600 focus:border-doom-accent focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setCategory(cat.key)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    category === cat.key
                      ? 'bg-doom-accent text-white'
                      : 'bg-doom-gray text-gray-400 hover:text-white border border-gray-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Pricing</label>
            <div className="flex gap-3">
              <button
                onClick={() => { setPricing('free'); setPriceCents(0) }}
                className={`flex-1 rounded-xl border p-3 text-left transition-all ${
                  pricing === 'free'
                    ? 'border-doom-accent bg-doom-accent/10'
                    : 'border-gray-800 bg-doom-dark hover:border-gray-700'
                }`}
              >
                <p className="text-sm font-medium text-white">Free</p>
                <p className="text-xs text-gray-500 mt-0.5">Anyone can use it</p>
              </button>
              <button
                onClick={() => { setPricing('paid'); setPriceCents(priceCents || 499) }}
                className={`flex-1 rounded-xl border p-3 text-left transition-all ${
                  pricing === 'paid'
                    ? 'border-doom-accent bg-doom-accent/10'
                    : 'border-gray-800 bg-doom-dark hover:border-gray-700'
                }`}
              >
                <p className="text-sm font-medium text-white">Paid</p>
                <p className="text-xs text-gray-500 mt-0.5">Set your own price</p>
              </button>
            </div>

            {pricing === 'paid' && (
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
                    value={(priceCents / 100).toFixed(2)}
                    onChange={(e) =>
                      setPriceCents(Math.round(parseFloat(e.target.value || '0') * 100))
                    }
                    className="w-28 rounded-lg border border-gray-800 bg-doom-dark px-3 py-2 text-white focus:border-doom-accent focus:outline-none transition-colors"
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  You earn ${((priceCents * 0.85) / 100).toFixed(2)} per sale (85% revenue share)
                </p>
              </motion.div>
            )}
          </div>

          {/* Preview */}
          {tool.previewHtml && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Preview</label>
              <div className="rounded-xl border border-gray-800 overflow-hidden h-48 bg-white">
                <iframe
                  srcDoc={tool.previewHtml}
                  className="w-full h-full pointer-events-none"
                  sandbox=""
                  title="Tool preview"
                />
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="rounded-xl border border-gray-800 bg-doom-dark p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Stats</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-bold">{tool.viewsCount}</p>
                <p className="text-xs text-gray-500">Views</p>
              </div>
              <div>
                <p className="text-lg font-bold">{tool.likesCount}</p>
                <p className="text-xs text-gray-500">Likes</p>
              </div>
              <div>
                <p className="text-lg font-bold">{tool.remixesCount}</p>
                <p className="text-xs text-gray-500">Forks</p>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-4">
            <h3 className="text-sm font-medium text-red-400 mb-2">Danger Zone</h3>
            <p className="text-xs text-gray-500 mb-3">
              Deleting a tool removes it from the marketplace permanently.
            </p>
            <button
              onClick={handleDelete}
              className="rounded-lg bg-red-900/40 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-900/60 transition-colors"
            >
              Delete Tool
            </button>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
