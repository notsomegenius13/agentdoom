'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import type { FeedTool, FeedResponse } from '@/lib/feed/types';
import Leaderboard from '@/components/feed/Leaderboard';

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'money', label: 'Money' },
  { key: 'productivity', label: 'Productivity' },
  { key: 'social', label: 'Social' },
  { key: 'creator', label: 'Creator' },
  { key: 'business', label: 'Business' },
  { key: 'utility', label: 'Utility' },
];

function ToolCard({ tool }: { tool: FeedTool }) {
  return (
    <Link href={`/t/${tool.slug}`}>
      <motion.div
        whileHover={{ y: -4 }}
        className="group rounded-2xl border border-gray-800 bg-doom-dark overflow-hidden transition-colors hover:border-doom-accent/40"
      >
        {/* Preview */}
        {tool.previewHtml ? (
          <div className="h-40 overflow-hidden bg-white">
            <iframe
              srcDoc={tool.previewHtml}
              className="w-full h-full pointer-events-none"
              sandbox=""
              title={tool.title}
              loading="lazy"
            />
          </div>
        ) : (
          <div className="h-40 bg-doom-gray flex items-center justify-center">
            <span className="text-gray-600 text-sm">No preview</span>
          </div>
        )}

        {/* Info */}
        <div className="p-4">
          <h3 className="font-semibold text-white truncate group-hover:text-doom-accent-light transition-colors">
            {tool.title}
          </h3>
          <p className="mt-1 text-xs text-gray-400 line-clamp-2">{tool.description}</p>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {tool.creator.avatarUrl ? (
                <img src={tool.creator.avatarUrl} alt="" className="h-5 w-5 rounded-full" />
              ) : (
                <div className="h-5 w-5 rounded-full bg-doom-accent/30" />
              )}
              <span className="text-xs text-gray-500">
                {tool.creator.displayName || tool.creator.username}
                {tool.creator.isVerified && (
                  <span className="ml-1 text-doom-accent" title="Verified">
                    ✓
                  </span>
                )}
              </span>
            </div>
            {tool.isPaid ? (
              <span className="text-xs font-semibold text-doom-green">
                ${(tool.priceCents / 100).toFixed(2)}
              </span>
            ) : (
              <span className="text-xs text-gray-500">Free</span>
            )}
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-600">
            <span>{tool.likesCount} ♥</span>
            <span>{tool.remixesCount} forks</span>
            <span>{tool.viewsCount} views</span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

export default function MarketplacePage() {
  const [feed, setFeed] = useState<FeedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category !== 'all') params.append('category', category);

    const res = await fetch(`/api/feed?${params}`);
    if (res.ok) {
      const data: FeedResponse = await res.json();
      setFeed(data);
    }
    setLoading(false);
  }, [category]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  return (
    <main className="min-h-screen bg-doom-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-doom-dark/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">
            <span className="text-doom-accent">Agent</span>Doom
          </Link>
          <Link
            href="/"
            className="rounded-xl bg-doom-accent px-4 py-2 text-sm font-semibold text-white hover:bg-doom-accent-light transition-colors"
          >
            Build a Tool
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Title */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl md:text-4xl font-bold">Marketplace</h1>
          <p className="mt-2 text-gray-400">Discover, fork, and remix AI-built tools</p>
        </motion.div>

        {/* Category Tabs */}
        <div className="mt-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                category === cat.key
                  ? 'bg-doom-accent text-white'
                  : 'bg-doom-gray text-gray-400 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Main content + Sidebar */}
        <div className="mt-8 flex gap-6">
          {/* Feed Sections */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-12 flex justify-center"
                >
                  <div className="h-6 w-6 rounded-full border-2 border-doom-accent border-t-transparent animate-spin" />
                </motion.div>
              ) : (
                <motion.div
                  key="feed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {feed?.sections.map((section) => (
                    <div key={section.type + section.title} className="mt-6 first:mt-0">
                      <h2 className="text-xl font-bold mb-4">{section.title}</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {section.tools.map((tool) => (
                          <ToolCard key={tool.id} tool={tool} />
                        ))}
                      </div>
                    </div>
                  ))}

                  {(!feed || feed.sections.length === 0) && (
                    <div className="mt-16 text-center text-gray-500">
                      <p className="text-lg">No tools found</p>
                      <p className="mt-1 text-sm">Be the first to build something</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar — Leaderboard */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-20">
              <Leaderboard />
              <div className="mt-4">
                <Link
                  href="/creators"
                  className="block text-center rounded-xl border border-gray-800 bg-doom-dark px-4 py-3 text-xs font-medium text-gray-400 hover:text-white hover:border-gray-700 transition-colors"
                >
                  View Top Creators
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
