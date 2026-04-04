'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { FeedTool } from '@/lib/feed/types'
import { trackEvent } from '@/lib/feed/tracker'

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

export default function FeaturedCarousel({ tools }: { tools: FeedTool[] }) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % tools.length)
  }, [tools.length])

  // Auto-rotate every 5s unless paused
  useEffect(() => {
    if (tools.length <= 1 || paused) return
    const interval = setInterval(next, 5000)
    return () => clearInterval(interval)
  }, [tools.length, paused, next])

  if (tools.length === 0) return null

  const tool = tools[current]

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={tool.id}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.35 }}
        >
          <a
            href={`/t/${tool.slug}`}
            className="block group rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-doom-dark to-doom-dark overflow-hidden hover:border-amber-400/50 transition-all"
          >
            <div className="flex items-stretch">
              {/* Preview thumbnail */}
              <div className="relative w-24 sm:w-32 shrink-0 bg-white overflow-hidden">
                {tool.previewHtml ? (
                  <iframe
                    srcDoc={tool.previewHtml}
                    className="w-full h-full pointer-events-none scale-[0.5] origin-top-left"
                    style={{ width: '200%', height: '200%' }}
                    sandbox=""
                    title={tool.title}
                  />
                ) : (
                  <div className="w-full h-full bg-doom-gray flex items-center justify-center">
                    <span className="text-2xl text-amber-500/40">★</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 p-3 sm:p-4 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full">
                    ★ FEATURED
                  </span>
                  {tool.isPaid && (
                    <span className="text-[10px] font-semibold text-amber-300">
                      ${(tool.priceCents / 100).toFixed(2)}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                  {tool.title}
                </h3>
                {tool.description && (
                  <p className="text-[11px] text-gray-400 truncate mt-0.5">{tool.description}</p>
                )}
                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-500">
                  <span className="text-gray-300 font-medium">
                    {tool.creator.displayName || tool.creator.username}
                  </span>
                  <span>{formatCount(tool.viewsCount)} views</span>
                  <span>{formatCount(tool.likesCount)} likes</span>
                </div>
              </div>

              {/* Try it button */}
              {tool.deployUrl && (
                <div className="hidden sm:flex items-center pr-4">
                  <span
                    onClick={(e) => {
                      e.preventDefault()
                      trackEvent(tool.id, 'use')
                      window.open(tool.deployUrl!, '_blank')
                    }}
                    className="rounded-lg bg-amber-500 text-black px-4 py-2 text-xs font-semibold hover:bg-amber-400 transition-colors cursor-pointer"
                  >
                    Try it
                  </span>
                </div>
              )}
            </div>
          </a>
        </motion.div>
      </AnimatePresence>

      {/* Dots indicator */}
      {tools.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {tools.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1 rounded-full transition-all ${
                i === current ? 'w-4 bg-amber-400' : 'w-1.5 bg-gray-600 hover:bg-gray-500'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
