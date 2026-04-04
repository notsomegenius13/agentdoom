'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function BuildingNowIndicator() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let cancelled = false

    const poll = async () => {
      try {
        const res = await fetch('/api/feed/activity')
        const data = await res.json()
        if (!cancelled) setCount(data.buildingNow ?? 0)
      } catch {
        // silently retry
      }
    }

    poll()
    const interval = setInterval(poll, 10000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="flex items-center gap-2 bg-doom-accent/10 border border-doom-accent/20 rounded-full px-3 py-1.5"
        >
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full rounded-full bg-doom-accent opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-doom-accent" />
          </span>
          <span className="text-[11px] text-doom-accent-light font-medium whitespace-nowrap">
            {count} tool{count !== 1 ? 's' : ''} building now
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
