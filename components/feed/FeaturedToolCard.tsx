'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import type { FeedTool } from '@/lib/feed/types';
import { trackEvent } from '@/lib/feed/tracker';

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export default function FeaturedToolCard({ tool }: { tool: FeedTool }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const viewedRef = useRef(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !viewedRef.current) {
          const timer = setTimeout(() => {
            viewedRef.current = true;
            trackEvent(tool.id, 'view');
          }, 1000);
          return () => clearTimeout(timer);
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [tool.id]);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="col-span-full"
    >
      <Link href={`/t/${tool.slug}`} className="block">
        <div className="group relative rounded-2xl border-2 border-amber-500/60 bg-gradient-to-br from-amber-500/10 via-doom-dark to-doom-dark overflow-hidden transition-all hover:border-amber-400 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]">
          {/* Featured badge */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full bg-amber-500/90 px-3 py-1 text-xs font-bold text-black backdrop-blur-sm">
            <span>★</span>
            <span>Tool of the Day</span>
          </div>

          <div className="flex flex-col md:flex-row">
            {/* Preview — larger */}
            {tool.previewHtml ? (
              <div className="relative h-40 sm:h-56 md:h-64 md:w-1/2 overflow-hidden bg-white">
                <iframe
                  srcDoc={tool.previewHtml}
                  className="w-full h-full pointer-events-none"
                  sandbox=""
                  title={tool.title}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-doom-dark/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity md:bg-gradient-to-r" />
              </div>
            ) : (
              <div className="h-40 sm:h-56 md:h-64 md:w-1/2 bg-doom-gray flex items-center justify-center">
                <span className="text-5xl text-amber-500/40">★</span>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 p-4 sm:p-6 flex flex-col justify-center space-y-3 sm:space-y-4">
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-white group-hover:text-amber-300 transition-colors">
                  {tool.title}
                </h3>
                {tool.description && (
                  <p className="mt-2 text-sm text-gray-400 line-clamp-3">{tool.description}</p>
                )}
              </div>

              {/* Creator */}
              <div className="flex items-center gap-2">
                {tool.creator.avatarUrl ? (
                  <img
                    src={tool.creator.avatarUrl}
                    alt={tool.creator.displayName || tool.creator.username}
                    className="h-6 w-6 rounded-full"
                  />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-amber-500/20 flex items-center justify-center text-xs text-amber-400">
                    {(tool.creator.displayName || tool.creator.username).charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-sm text-gray-300">
                  {tool.creator.displayName || tool.creator.username}
                </span>
                {tool.creator.isVerified && (
                  <span className="text-amber-400 text-xs">✓</span>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>{formatCount(tool.viewsCount)} views</span>
                <span>{formatCount(tool.remixesCount)} remixes</span>
                <span>{formatCount(tool.likesCount)} likes</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                {tool.deployUrl && (
                  <a
                    href={tool.deployUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => { e.stopPropagation(); trackEvent(tool.id, 'use'); }}
                    className="rounded-lg bg-amber-500 text-black px-5 py-2 text-sm font-semibold transition-colors hover:bg-amber-400"
                  >
                    Try it now
                  </a>
                )}
                <a
                  href={`/remix/${tool.slug}`}
                  onClick={(e) => { e.stopPropagation(); trackEvent(tool.id, 'remix'); }}
                  className="rounded-lg border border-amber-500/30 text-amber-400 px-5 py-2 text-sm font-medium transition-colors hover:bg-amber-500/10"
                >
                  Fork
                </a>
                {tool.isPaid && (
                  <span className="text-sm font-semibold text-amber-400">
                    ${(tool.priceCents / 100).toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
