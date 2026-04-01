'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { FeedTool } from '@/lib/feed/types';
import ProBadge from '@/components/ProBadge';
import { trackEvent } from '@/lib/feed/tracker';

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const CATEGORY_COLORS: Record<string, string> = {
  money: 'bg-emerald-500/20 text-emerald-400',
  productivity: 'bg-blue-500/20 text-blue-400',
  social: 'bg-pink-500/20 text-pink-400',
  creator: 'bg-purple-500/20 text-purple-400',
  business: 'bg-amber-500/20 text-amber-400',
  utility: 'bg-gray-500/20 text-gray-400',
};

export default function ToolCard({ tool }: { tool: FeedTool }) {
  const categoryStyle = CATEGORY_COLORS[tool.category] || CATEGORY_COLORS.utility;
  const cardRef = useRef<HTMLDivElement>(null);
  const viewedRef = useRef(false);

  // Track view when card is ≥50% visible for 1 second
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
    <motion.article
      ref={cardRef}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative rounded-2xl border border-gray-800 bg-doom-dark overflow-hidden transition-colors hover:border-doom-accent/40"
    >
      {/* Preview */}
      {tool.previewHtml ? (
        <div className="relative h-48 overflow-hidden bg-white">
          <iframe
            srcDoc={tool.previewHtml}
            className="w-full h-full pointer-events-none"
            sandbox=""
            title={tool.title}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-doom-dark/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      ) : (
        <div className="h-48 bg-doom-gray flex items-center justify-center">
          <span className="text-3xl text-gray-600">⚡</span>
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Category + Time */}
        <div className="flex items-center justify-between">
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${categoryStyle}`}>
            {tool.category}
          </span>
          <span className="text-[11px] text-gray-500">{timeAgo(tool.createdAt)}</span>
        </div>

        {/* Title + Description */}
        <div>
          <h3 className="font-semibold text-sm text-white truncate">{tool.title}</h3>
          {tool.description && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{tool.description}</p>
          )}
        </div>

        {/* Creator */}
        <div className="flex items-center gap-2">
          {tool.creator.avatarUrl ? (
            <img
              src={tool.creator.avatarUrl}
              alt={tool.creator.displayName || tool.creator.username}
              className="h-5 w-5 rounded-full"
            />
          ) : (
            <div className="h-5 w-5 rounded-full bg-doom-gray flex items-center justify-center text-[10px] text-gray-400">
              {(tool.creator.displayName || tool.creator.username).charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-xs text-gray-400 truncate">
            {tool.creator.displayName || tool.creator.username}
          </span>
          {tool.creator.isVerified && (
            <svg
              className="h-3 w-3 text-doom-accent flex-shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {tool.creator.isPro && <ProBadge />}
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-4 text-[11px] text-gray-500">
          <span>{formatCount(tool.viewsCount)} views</span>
          <span>{formatCount(tool.remixesCount)} remixes</span>
          <span>{formatCount(tool.likesCount)} likes</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          {tool.deployUrl && (
            <a
              href={tool.deployUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent(tool.id, 'use')}
              className="flex-1 text-center rounded-lg bg-doom-accent/10 text-doom-accent-light px-3 py-1.5 text-xs font-medium transition-colors hover:bg-doom-accent/20"
            >
              Open
            </a>
          )}
          <a
            href={`/remix/${tool.slug}`}
            onClick={() => trackEvent(tool.id, 'remix')}
            className="flex-1 text-center rounded-lg bg-doom-green/10 text-doom-green px-3 py-1.5 text-xs font-medium transition-colors hover:bg-doom-green/20"
          >
            Fork
          </a>
          {tool.isPaid && (
            <span className="text-[11px] font-medium text-amber-400">
              ${(tool.priceCents / 100).toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
}
