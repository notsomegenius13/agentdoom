'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface TickerItem {
  id: string
  slug: string
  title: string
  category: string
  creator: string
  creatorAvatar: string | null
  createdAt: string
}

export default function LiveTicker() {
  const [items, setItems] = useState<TickerItem[]>([])
  const [current, setCurrent] = useState(0)
  const eventSourceRef = useRef<EventSource | null>(null)

  // Connect to SSE live feed
  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout>

    const connect = () => {
      const es = new EventSource('/api/feed/live')
      eventSourceRef.current = es

      es.addEventListener('new_tool', (e) => {
        const tool = JSON.parse(e.data) as TickerItem
        setItems((prev) => {
          // Deduplicate and keep last 20
          const filtered = prev.filter((t) => t.id !== tool.id)
          return [tool, ...filtered].slice(0, 20)
        })
      })

      es.addEventListener('reconnect', (e) => {
        const { after } = JSON.parse(e.data)
        es.close()
        reconnectTimer = setTimeout(connect, after || 1000)
      })

      es.onerror = () => {
        es.close()
        reconnectTimer = setTimeout(connect, 3000)
      }
    }

    // Also seed with initial data from activity endpoint
    fetch('/api/feed/activity')
      .then((r) => r.json())
      .then((data) => {
        if (data.recentDeploys?.length > 0) {
          setItems(data.recentDeploys)
        }
      })
      .catch(() => {})

    connect()

    return () => {
      eventSourceRef.current?.close()
      clearTimeout(reconnectTimer)
    }
  }, [])

  // Rotate through items every 3s
  useEffect(() => {
    if (items.length <= 1) return
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % items.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [items.length])

  if (items.length === 0) return null

  const item = items[current % items.length]
  if (!item) return null

  return (
    <div className="w-full overflow-hidden bg-doom-black/40 backdrop-blur-md border-b border-white/5">
      <div className="mx-auto max-w-lg px-4 py-1.5 flex items-center gap-2">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full rounded-full bg-doom-green opacity-75 animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-doom-green" />
        </span>
        <AnimatePresence mode="wait">
          <motion.a
            key={item.id}
            href={`/t/${item.slug}`}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -12, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="text-[11px] text-gray-300 truncate hover:text-white transition-colors"
          >
            <span className="text-white font-medium">{item.creator}</span>
            {' just shipped '}
            <span className="text-doom-accent-light font-medium">{item.title}</span>
          </motion.a>
        </AnimatePresence>
      </div>
    </div>
  )
}
