'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  FeedTool,
  FeedResponse,
  FeedSection as FeedSectionType,
  FeedSort,
} from '@/lib/feed/types';
import UserNav from '@/components/feed/UserNav';
import GlobalNav from '@/components/feed/GlobalNav';
import {
  trackEvent,
  createViewObserver,
  TimeSpentTracker,
  ScrollDepthTracker,
} from '@/lib/feed/tracker';

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

const CATEGORY_COLORS: Record<string, string> = {
  money: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  productivity: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  social: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  creator: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  business: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  utility: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

const CATEGORIES = ['', 'money', 'productivity', 'social', 'creator', 'business', 'utility'];
const CATEGORY_LABELS: Record<string, string> = {
  '': 'All',
  money: 'Money',
  productivity: 'Productivity',
  social: 'Social',
  creator: 'Creator',
  business: 'Business',
  utility: 'Utility',
};

const SORT_TABS: { key: FeedSort; label: string }[] = [
  { key: 'popular', label: 'Popular' },
  { key: 'trending', label: 'Trending' },
  { key: 'new', label: 'New' },
];

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function FeedPage() {
  return (
    <Suspense fallback={<FeedSkeleton />}>
      <FeedPageInner />
    </Suspense>
  );
}

function FeedPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialSort = (searchParams.get('sort') as FeedSort) || 'popular';
  const initialCategory = searchParams.get('category') || '';
  const initialSearch = searchParams.get('q') || '';

  const [tools, setTools] = useState<FeedTool[]>([]);
  const [sort, setSort] = useState<FeedSort>(initialSort);
  const [category, setCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [remixTool, setRemixTool] = useState<FeedTool | null>(null);
  const [searchTotal, setSearchTotal] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Engagement tracking
  const viewedToolsRef = useRef(new Set<string>());
  const viewObserverRef = useRef<IntersectionObserver | null>(null);
  const timeSpentRef = useRef(new TimeSpentTracker());
  const scrollDepthRef = useRef(new ScrollDepthTracker());

  useEffect(() => {
    const params = new URLSearchParams();
    if (sort !== 'popular') params.set('sort', sort);
    if (category) params.set('category', category);
    if (debouncedSearch) params.set('q', debouncedSearch);
    const qs = params.toString();
    router.replace(`/feed${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [sort, category, debouncedSearch, router]);

  useEffect(() => {
    viewObserverRef.current = createViewObserver((toolId) => {
      if (!viewedToolsRef.current.has(toolId)) {
        viewedToolsRef.current.add(toolId);
        trackEvent(toolId, 'view');
      }
    });
    return () => viewObserverRef.current?.disconnect();
  }, []);

  useEffect(() => {
    const flush = () => timeSpentRef.current.flush();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush();
    });
    window.addEventListener('beforeunload', flush);
    return () => {
      flush();
      window.removeEventListener('beforeunload', flush);
    };
  }, []);

  const isSearchMode = debouncedSearch.length >= 2;

  const fetchFeed = useCallback(
    async (opts: { cursor?: string; append?: boolean } = {}) => {
      const isAppend = opts.append && opts.cursor;
      if (isAppend) setLoadingMore(true);
      else setLoading(true);

      setError(null);
      setLoadMoreError(false);
      try {
        let allTools: FeedTool[];
        let nextCursor: string | null;

        if (isSearchMode) {
          const params = new URLSearchParams();
          params.set('q', debouncedSearch);
          if (category) params.set('category', category);
          if (opts.cursor) params.set('cursor', opts.cursor);
          params.set('limit', '20');

          const res = await fetch(`/api/feed/search?${params}`);
          if (!res.ok) throw new Error('Search failed');
          const data = await res.json();
          allTools = data.tools;
          nextCursor = data.cursor;
          setSearchTotal(data.total);
        } else {
          const params = new URLSearchParams();
          if (category) params.set('category', category);
          if (sort !== 'popular') params.set('sort', sort);
          if (opts.cursor) params.set('cursor', opts.cursor);
          params.set('limit', '20');

          const res = await fetch(`/api/feed?${params}`);
          if (!res.ok) throw new Error('Feed fetch failed');
          const data: FeedResponse = await res.json();
          allTools = data.sections.flatMap((s: FeedSectionType) => s.tools);
          nextCursor = data.cursor;
          setSearchTotal(null);
        }

        if (isAppend) {
          setTools((prev) => [...prev, ...allTools]);
        } else {
          setTools(allTools);
        }

        setCursor(nextCursor);
        setHasMore(nextCursor !== null);
      } catch {
        if (!isAppend) setError('Failed to load feed. Please try again.');
        else setLoadMoreError(true);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [category, sort, debouncedSearch, isSearchMode],
  );

  useEffect(() => {
    setCursor(null);
    setHasMore(true);
    fetchFeed();
  }, [fetchFeed]);

  // Infinite scroll observer
  useEffect(() => {
    if (!hasMore || loadingMore) return;
    const el = observerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && cursor && !loadingMore) {
          fetchFeed({ cursor, append: true });
        }
      },
      { rootMargin: '600px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [cursor, hasMore, loadingMore, fetchFeed]);

  // Scroll depth tracking
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        const depth = Math.round((scrollTop / docHeight) * tools.length);
        scrollDepthRef.current.update(depth, tools.length);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [tools]);

  return (
    <main className="min-h-screen bg-doom-black">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-doom-black/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <a href="/" className="text-lg font-semibold tracking-tight text-white shrink-0">
              AgentDoom
            </a>

            <GlobalNav />

            {/* Search */}
            <div className="flex-1 max-w-md mx-6 hidden sm:block">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tools..."
                  className="w-full h-9 pl-9 pr-4 rounded-lg bg-white/[0.06] border border-white/[0.08] text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/20 focus:bg-white/[0.08] transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Mobile search toggle */}
              <button
                onClick={() => {
                  const el = document.getElementById('mobile-search');
                  if (el) el.classList.toggle('hidden');
                }}
                className="sm:hidden w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                <svg
                  className="w-4.5 h-4.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
              </button>
              <UserNav />
            </div>
          </div>

          {/* Mobile search */}
          <div id="mobile-search" className="hidden sm:hidden pb-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tools..."
              className="w-full h-9 px-3 rounded-lg bg-white/[0.06] border border-white/[0.08] text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>
        </div>
      </header>

      {/* Filters bar */}
      <div className="sticky top-14 z-20 bg-doom-black/80 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-3 flex items-center gap-4 overflow-x-auto scrollbar-none">
          {/* Sort */}
          {!isSearchMode && (
            <div className="flex items-center gap-1 shrink-0">
              {SORT_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSort(tab.key)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    sort === tab.key
                      ? 'bg-white/[0.1] text-white'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {!isSearchMode && <div className="w-px h-5 bg-white/[0.08] shrink-0" />}

          {/* Categories */}
          <div className="flex items-center gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  category === cat
                    ? 'bg-white/[0.1] text-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          {isSearchMode && searchTotal !== null && (
            <span className="text-xs text-gray-500 shrink-0 ml-auto">
              {searchTotal} result{searchTotal !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        {loading ? (
          <FeedSkeleton />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <p className="text-gray-400 text-sm">{error}</p>
            <button
              onClick={() => fetchFeed()}
              className="rounded-lg bg-white/[0.08] px-5 py-2 text-sm font-medium text-white hover:bg-white/[0.12] transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : tools.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            {isSearchMode ? (
              <>
                <p className="text-gray-500 text-sm">
                  No tools found for &quot;{debouncedSearch}&quot;
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="rounded-lg bg-white/[0.08] px-5 py-2 text-sm font-medium text-gray-300 hover:bg-white/[0.12] transition-colors"
                >
                  Clear Search
                </button>
              </>
            ) : (
              <>
                <p className="text-gray-500 text-sm">No tools yet. Be the first to build one!</p>
                <a
                  href="/"
                  className="rounded-lg bg-white text-doom-black px-5 py-2 text-sm font-medium hover:bg-gray-100 transition-colors"
                >
                  Create a Tool
                </a>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Tool grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tools.map((tool) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  onRemix={() => {
                    trackEvent(tool.id, 'remix');
                    setRemixTool(tool);
                  }}
                  viewObserver={viewObserverRef.current}
                />
              ))}
            </div>

            {/* Infinite scroll sentinel */}
            {hasMore && <div ref={observerRef} className="h-1" />}

            {loadingMore && (
              <div className="flex justify-center py-12">
                <div className="h-5 w-5 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
              </div>
            )}

            {loadMoreError && (
              <div className="flex flex-col items-center py-12 gap-3">
                <p className="text-sm text-gray-500">Failed to load more.</p>
                <button
                  onClick={() => fetchFeed({ cursor: cursor ?? undefined, append: true })}
                  className="rounded-lg bg-white/[0.08] px-5 py-2 text-sm font-medium text-white hover:bg-white/[0.12] transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {!hasMore && !loadingMore && tools.length > 0 && (
              <p className="text-center text-xs text-gray-600 py-12">You&apos;ve seen everything</p>
            )}
          </>
        )}
      </div>

      {/* Remix Overlay */}
      <AnimatePresence>
        {remixTool && <RemixOverlay tool={remixTool} onClose={() => setRemixTool(null)} />}
      </AnimatePresence>
    </main>
  );
}

/* ─── Tool Card ─── */
function ToolCard({
  tool,
  onRemix,
  viewObserver,
}: {
  tool: FeedTool;
  onRemix: () => void;
  viewObserver: IntersectionObserver | null;
}) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(tool.likesCount);
  const cardRef = useRef<HTMLDivElement>(null);
  const categoryStyle = CATEGORY_COLORS[tool.category] || CATEGORY_COLORS.utility;

  useEffect(() => {
    const el = cardRef.current;
    if (!el || !viewObserver) return;
    viewObserver.observe(el);
    return () => viewObserver.unobserve(el);
  }, [viewObserver]);

  const handleLike = async () => {
    const next = !liked;
    setLiked(next);
    setLikeCount((prev) => prev + (next ? 1 : -1));
    try {
      await fetch('/api/feed/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId: tool.id, action: next ? 'like' : 'unlike' }),
      });
    } catch {
      setLiked(!next);
      setLikeCount((prev) => prev + (next ? -1 : 1));
    }
  };

  const handleShare = async () => {
    const url = tool.deployUrl || `${window.location.origin}/t/${tool.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: tool.title, url });
      } catch {
        return;
      }
    } else {
      await navigator.clipboard.writeText(url);
    }
    trackEvent(tool.id, 'share');
  };

  return (
    <div
      ref={cardRef}
      data-tool-id={tool.id}
      className="group relative rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-200"
    >
      {/* Preview */}
      <a href={`/t/${tool.slug}`} className="block">
        <div className="relative aspect-[16/10] rounded-t-xl overflow-hidden bg-doom-dark">
          {tool.previewHtml ? (
            <iframe
              srcDoc={tool.previewHtml}
              className="w-full h-full pointer-events-none"
              sandbox="allow-scripts"
              title={tool.title}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-doom-dark to-doom-gray">
              <svg
                className="w-8 h-8 text-white/[0.08]"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                />
              </svg>
            </div>
          )}
        </div>
      </a>

      {/* Info */}
      <div className="p-4">
        {/* Category + time */}
        <div className="flex items-center justify-between mb-2">
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${categoryStyle}`}>
            {tool.category}
          </span>
          <span className="text-[11px] text-gray-600">{timeAgo(tool.createdAt)}</span>
        </div>

        {/* Title */}
        <a href={`/t/${tool.slug}`}>
          <h3 className="text-sm font-semibold text-white leading-snug mb-1 group-hover:text-gray-100 line-clamp-1">
            {tool.title}
          </h3>
        </a>

        {/* Description */}
        {tool.description && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">
            {tool.description}
          </p>
        )}

        {/* Creator */}
        <div className="flex items-center gap-2 mb-3">
          {tool.creator.avatarUrl ? (
            <img
              src={tool.creator.avatarUrl}
              alt={tool.creator.displayName || tool.creator.username}
              className="h-5 w-5 rounded-full"
            />
          ) : (
            <div className="h-5 w-5 rounded-full bg-white/[0.06] flex items-center justify-center text-[10px] text-gray-400">
              {(tool.creator.displayName || tool.creator.username).charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-xs text-gray-400">
            {tool.creator.displayName || tool.creator.username}
          </span>
          {tool.creator.isVerified && (
            <svg className="h-3 w-3 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
          <div className="flex items-center gap-3">
            {/* Like */}
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 text-xs transition-colors ${
                liked ? 'text-red-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill={liked ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {likeCount > 0 && <span>{formatCount(likeCount)}</span>}
            </button>

            {/* Views */}
            <span className="text-xs text-gray-600">{formatCount(tool.viewsCount)} views</span>

            {/* Remix */}
            <button
              onClick={onRemix}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              Remix
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />
              </svg>
            </button>
          </div>

          {/* Try it */}
          {tool.deployUrl && (
            <a
              href={tool.deployUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent(tool.id, 'use')}
              className="rounded-md bg-white text-doom-black px-3 py-1 text-xs font-medium hover:bg-gray-100 transition-colors"
            >
              Try it
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Remix Overlay ─── */
function RemixOverlay({ tool, onClose }: { tool: FeedTool; onClose: () => void }) {
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<'idle' | 'generating' | 'deploying' | 'done' | 'error'>(
    'idle',
  );
  const [logs, setLogs] = useState<string[]>([]);
  const [deployUrl, setDeployUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleRemix = async () => {
    if (!prompt.trim() || status === 'generating' || status === 'deploying') return;
    setStatus('generating');
    setLogs(['Starting remix...']);
    setDeployUrl(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Remix of "${tool.title}": ${prompt}`,
          remixFromId: tool.id,
        }),
      });

      if (!res.ok) throw new Error('Generation failed');

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No stream');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6);
          if (raw === '[DONE]') continue;

          try {
            const event = JSON.parse(raw);
            if (event.stage) {
              const msg = event.line || event.message || '';
              setLogs((prev) => [...prev, `${event.stage}: ${msg}`]);
            }
            if (event.stage === 'deploying') setStatus('deploying');
            const finalUrl = event.deployUrl || event.url;
            if (finalUrl) {
              setDeployUrl(finalUrl);
              setStatus('done');
            }
            if (event.error) {
              setLogs((prev) => [...prev, `Error: ${event.error}`]);
              setStatus('error');
            }
          } catch {
            // not JSON
          }
        }
      }
    } catch {
      setStatus('error');
      setLogs((prev) => [...prev, 'Remix failed. Try again.']);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-lg mx-4 bg-doom-dark border border-white/[0.08] rounded-xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Remix</h3>
            <p className="text-xs text-gray-500 mt-0.5">{tool.title}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Input */}
        <div className="px-5 pb-4">
          <textarea
            ref={inputRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleRemix();
            }}
            placeholder="Describe your changes..."
            rows={3}
            disabled={status === 'generating' || status === 'deploying'}
            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-gray-600 resize-none focus:outline-none focus:border-white/20 disabled:opacity-50 transition-colors"
          />
        </div>

        {/* Logs */}
        {logs.length > 0 && (
          <div className="px-5 pb-4">
            <div className="rounded-lg bg-doom-black/50 border border-white/[0.04] p-3 max-h-28 overflow-y-auto scrollbar-thin">
              {logs.map((log, i) => (
                <p key={i} className="text-[11px] text-gray-500 font-mono leading-relaxed">
                  {log}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Deploy result */}
        {status === 'done' && deployUrl && (
          <div className="px-5 pb-4">
            <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-400">Deployed</p>
                <a
                  href={deployUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-emerald-500/70 hover:text-emerald-400 transition-colors"
                >
                  {deployUrl}
                </a>
              </div>
              <a
                href={deployUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md bg-white text-doom-black px-3 py-1.5 text-xs font-medium hover:bg-gray-100 transition-colors"
              >
                Open
              </a>
            </div>
          </div>
        )}

        {/* Action */}
        <div className="px-5 pb-5">
          <button
            onClick={handleRemix}
            disabled={!prompt.trim() || status === 'generating' || status === 'deploying'}
            className="w-full rounded-lg bg-white text-doom-black py-2.5 text-sm font-medium hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {status === 'generating'
              ? 'Generating...'
              : status === 'deploying'
                ? 'Deploying...'
                : status === 'done'
                  ? 'Remix Again'
                  : 'Remix & Deploy'}
          </button>
          {status === 'idle' && (
            <p className="text-center text-[11px] text-gray-600 mt-2">{'\u2318'}+Enter to submit</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Skeleton ─── */
function FeedSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden"
        >
          <div className="aspect-[16/10] bg-white/[0.03] animate-pulse" />
          <div className="p-4 space-y-3">
            <div className="h-3 w-16 bg-white/[0.05] rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-white/[0.05] rounded animate-pulse" />
            <div className="h-3 w-full bg-white/[0.03] rounded animate-pulse" />
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-white/[0.05] animate-pulse" />
              <div className="h-3 w-20 bg-white/[0.04] rounded animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
