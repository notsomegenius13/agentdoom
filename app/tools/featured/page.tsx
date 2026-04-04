'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import type { FeedTool } from '@/lib/feed/types';

interface FeaturedItem {
  tool: FeedTool;
  featuredDate: string;
  reason: string | null;
  selectedBy: 'auto' | 'admin';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function FeaturedHistoryCard({ item }: { item: FeaturedItem }) {
  const { tool } = item;
  return (
    <Link href={`/t/${tool.slug}`}>
      <motion.div
        whileHover={{ y: -2 }}
        className="group rounded-2xl border border-amber-500/20 bg-doom-dark overflow-hidden transition-all hover:border-amber-500/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.08)]"
      >
        <div className="flex">
          {/* Preview */}
          {tool.previewHtml ? (
            <div className="w-32 h-32 shrink-0 overflow-hidden bg-white">
              <iframe
                srcDoc={tool.previewHtml}
                className="w-full h-full pointer-events-none"
                sandbox=""
                title={tool.title}
                loading="lazy"
              />
            </div>
          ) : (
            <div className="w-32 h-32 shrink-0 bg-doom-gray flex items-center justify-center">
              <span className="text-2xl text-amber-500/30">★</span>
            </div>
          )}

          {/* Info */}
          <div className="flex-1 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-400 font-medium">
                {formatDate(item.featuredDate)}
              </span>
              {item.selectedBy === 'admin' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500">
                  Pick
                </span>
              )}
            </div>
            <h3 className="font-semibold text-white text-sm group-hover:text-amber-300 transition-colors truncate">
              {tool.title}
            </h3>
            {item.reason && <p className="text-xs text-gray-500 italic">{item.reason}</p>}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{tool.creator.displayName || tool.creator.username}</span>
              <span>·</span>
              <span>{tool.likesCount} likes</span>
              <span>·</span>
              <span>{tool.viewsCount} views</span>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

export default function FeaturedHistoryPage() {
  const [items, setItems] = useState<FeaturedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchHistory = useCallback(async (loadCursor?: string) => {
    setLoading(true);
    const params = new URLSearchParams({ history: 'true' });
    if (loadCursor) params.append('cursor', loadCursor);

    const res = await fetch(`/api/feed/featured?${params}`);
    if (res.ok) {
      const data = await res.json();
      setItems((prev) => (loadCursor ? [...prev, ...data.items] : data.items));
      setCursor(data.cursor);
      setHasMore(!!data.cursor);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <main className="min-h-screen bg-doom-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-doom-dark/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">
            <span className="text-doom-accent">Agent</span>Doom
          </Link>
          <Link href="/feed" className="text-sm text-gray-400 hover:text-white transition-colors">
            Feed
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold">
            <span className="text-amber-400">★</span> Featured Tools
          </h1>
          <p className="mt-2 text-gray-400">Past Tools of the Day — the best of AgentDoom</p>
        </motion.div>

        <div className="mt-8 space-y-4">
          {items.map((item) => (
            <FeaturedHistoryCard key={item.featuredDate} item={item} />
          ))}

          {loading && (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
            </div>
          )}

          {!loading && items.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <p className="text-lg">No featured tools yet</p>
              <p className="mt-1 text-sm">Check back tomorrow!</p>
            </div>
          )}

          {!loading && hasMore && (
            <button
              onClick={() => cursor && fetchHistory(cursor)}
              className="w-full py-3 rounded-xl border border-gray-800 text-sm text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
            >
              Load more
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
