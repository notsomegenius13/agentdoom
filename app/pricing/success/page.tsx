'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function PricingSuccessPage() {
  useEffect(() => {
    // Confetti-like effect on mount (optional future enhancement)
  }, [])

  return (
    <main className="min-h-screen bg-doom-black text-white flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center"
      >
        {/* Glow */}
        <div className="relative inline-block mb-8">
          <div className="absolute inset-0 bg-doom-accent/20 blur-3xl rounded-full" />
          <div className="relative h-20 w-20 mx-auto rounded-2xl bg-doom-accent/20 flex items-center justify-center">
            <svg className="h-10 w-10 text-doom-accent" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-3">
          Welcome to <span className="text-doom-accent">Pro</span>
        </h1>
        <p className="text-gray-400 mb-8">
          You now have unlimited tool creation, lower fees, custom domains,
          analytics, and premium primitives.
        </p>

        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full rounded-xl bg-doom-accent px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-doom-accent-light active:scale-[0.98]"
          >
            Start Building
          </Link>
          <Link
            href="/marketplace"
            className="block w-full rounded-xl border border-gray-700 px-6 py-3 text-sm font-semibold text-gray-300 transition-all hover:border-gray-500 active:scale-[0.98]"
          >
            Browse Marketplace
          </Link>
        </div>
      </motion.div>
    </main>
  )
}
