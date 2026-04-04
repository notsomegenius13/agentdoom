'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const INTERESTS = [
  { key: 'money', label: 'Finance & Money' },
  { key: 'productivity', label: 'Productivity' },
  { key: 'social', label: 'Social & Community' },
  { key: 'creator', label: 'Creator Tools' },
  { key: 'business', label: 'Business' },
  { key: 'utility', label: 'Utilities' },
]

export default function BecomeCreatorPage() {
  const router = useRouter()
  const [step, setStep] = useState<'form' | 'submitting' | 'done'>('form')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [bio, setBio] = useState('')
  const [interests, setInterests] = useState<string[]>([])

  const toggleInterest = (key: string) => {
    setInterests((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const canSubmit = name.trim() && email.trim() && interests.length > 0

  const handleSubmit = async () => {
    if (!canSubmit) return
    setStep('submitting')
    // Mock submission delay
    await new Promise((r) => setTimeout(r, 1200))
    // Store creator profile in localStorage for the onboarding flow
    localStorage.setItem(
      'agentdoom_creator',
      JSON.stringify({
        name: name.trim(),
        email: email.trim(),
        bio: bio.trim(),
        interests,
        createdAt: new Date().toISOString(),
      })
    )
    setStep('done')
  }

  if (step === 'done') {
    return (
      <main className="min-h-screen bg-doom-black text-white flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md"
        >
          <div className="text-5xl mb-4">&#x1f389;</div>
          <h1 className="text-3xl font-bold">Welcome, {name}!</h1>
          <p className="mt-3 text-gray-400">
            Your creator account is set up. Let&apos;s build your first tool.
          </p>
          <button
            onClick={() => router.push('/create-tool')}
            className="mt-6 rounded-xl bg-doom-accent px-6 py-3 text-sm font-semibold text-white hover:bg-doom-accent-light transition-colors"
          >
            Create Your First Tool
          </button>
          <Link href="/dashboard" className="block mt-3 text-sm text-gray-500 hover:text-gray-300">
            Go to Dashboard instead
          </Link>
        </motion.div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-doom-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-doom-dark/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">
            <span className="text-doom-accent">Agent</span>Doom
          </Link>
          <Link href="/sign-in" className="text-sm text-gray-400 hover:text-white transition-colors">
            Already a creator? Sign in
          </Link>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl md:text-4xl font-bold">Become a Creator</h1>
          <p className="mt-2 text-gray-400">
            Build AI-powered tools, publish to the marketplace, and earn money.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-8 space-y-6"
        >
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name or brand"
              className="w-full rounded-xl border border-gray-800 bg-doom-dark px-4 py-3 text-white placeholder-gray-600 focus:border-doom-accent focus:outline-none transition-colors"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-gray-800 bg-doom-dark px-4 py-3 text-white placeholder-gray-600 focus:border-doom-accent focus:outline-none transition-colors"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Bio <span className="text-gray-600">(optional)</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell people what you build..."
              rows={3}
              className="w-full rounded-xl border border-gray-800 bg-doom-dark px-4 py-3 text-white placeholder-gray-600 focus:border-doom-accent focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Interests */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              What do you want to build?
            </label>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => toggleInterest(cat.key)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    interests.includes(cat.key)
                      ? 'bg-doom-accent text-white'
                      : 'bg-doom-gray text-gray-400 hover:text-white border border-gray-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || step === 'submitting'}
            className={`w-full rounded-xl py-3 text-sm font-semibold transition-all ${
              canSubmit && step !== 'submitting'
                ? 'bg-doom-accent text-white hover:bg-doom-accent-light'
                : 'bg-doom-gray text-gray-600 cursor-not-allowed'
            }`}
          >
            {step === 'submitting' ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Setting up your account...
              </span>
            ) : (
              'Create Creator Account'
            )}
          </button>

          <p className="text-xs text-gray-600 text-center">
            By signing up you agree to our Terms of Service. Creators earn 80-85% of every sale.
          </p>
        </motion.div>
      </div>
    </main>
  )
}
