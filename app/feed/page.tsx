'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FeedTool, FeedResponse, FeedSection as FeedSectionType } from '@/lib/feed/types';
import CategoryFilter from '@/components/feed/CategoryFilter';
import UserNav from '@/components/feed/UserNav';
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

export default function FeedPage() {
  const [tools, setTools] = useState<FeedTool[]>([]);
  const [category, setCategory] = useState('');
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [remixTool, setRemixTool] = useState<FeedTool | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<HTMLDivElement>(null);

  // Engagement tracking
  const viewedToolsRef = useRef(new Set<string>());
  const viewObserverRef = useRef<IntersectionObserver | null>(null);
  const timeSpentRef = useRef(new TimeSpentTracker());
  const scrollDepthRef = useRef(new ScrollDepthTracker());

  // Initialize view observer (fires 'view' event once per tool after 1s visible)
  useEffect(() => {
    viewObserverRef.current = createViewObserver((toolId) => {
      if (!viewedToolsRef.current.has(toolId)) {
        viewedToolsRef.current.add(toolId);
        trackEvent(toolId, 'view');
      }
    });
    return () => viewObserverRef.current?.disconnect();
  }, []);

  // Flush time-spent on page hide/unload
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

  const fetchFeed = useCallback(
    async (opts: { cursor?: string; append?: boolean } = {}) => {
      const isAppend = opts.append && opts.cursor;
      if (isAppend) setLoadingMore(true);
      else setLoading(true);

      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (opts.cursor) params.set('cursor', opts.cursor);
      params.set('limit', '20');

      try {
        const res = await fetch(`/api/feed?${params}`);
        if (!res.ok) throw new Error('Feed fetch failed');
        const data: FeedResponse = await res.json();

        const allTools = data.sections.flatMap((s: FeedSectionType) => s.tools);

        if (isAppend) {
          setTools((prev) => [...prev, ...allTools]);
        } else {
          setTools(allTools);
        }

        setCursor(data.cursor);
        setHasMore(data.cursor !== null);
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [category],
  );

  useEffect(() => {
    setCursor(null);
    setHasMore(true);
    setActiveIndex(0);
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
      { rootMargin: '800px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [cursor, hasMore, loadingMore, fetchFeed]);

  // Track active card via scroll position + engagement signals
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const cardHeight = container.clientHeight;
      const index = Math.round(scrollTop / cardHeight);
      setActiveIndex(index);

      // Track time-spent on active tool
      if (tools[index]) {
        timeSpentRef.current.activate(tools[index].id);
      }

      // Track scroll depth
      scrollDepthRef.current.update(index, tools.length);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [tools]);

  return (
    <main className="h-screen w-screen overflow-hidden relative">
      {/* Top bar - floating over feed */}
      <header className="fixed top-0 left-0 right-0 z-20 pointer-events-none">
        <div className="mx-auto max-w-lg px-4 pt-4 flex items-center justify-between pointer-events-auto">
          <a href="/" className="text-xl font-bold tracking-tight drop-shadow-lg">
            <span className="text-doom-accent">Agent</span>Doom
          </a>
          <UserNav />
        </div>
      </header>

      {/* Category filter - floating */}
      <div className="fixed top-16 left-0 right-0 z-20 pointer-events-none">
        <div className="mx-auto max-w-lg px-4 pointer-events-auto">
          <CategoryFilter active={category} onChange={setCategory} />
        </div>
      </div>

      {/* Vertical scroll feed */}
      <div
        ref={scrollContainerRef}
        className="h-screen w-screen overflow-y-scroll snap-y snap-mandatory scrollbar-none"
      >
        {loading ? (
          <FeedSkeleton />
        ) : tools.length === 0 ? (
          <div className="h-screen flex flex-col items-center justify-center gap-4">
            <p className="text-gray-500 text-sm">No tools yet. Be the first to build one!</p>
            <a
              href="/"
              className="rounded-xl bg-doom-accent px-6 py-2.5 text-sm font-semibold text-white"
            >
              Create a Tool
            </a>
          </div>
        ) : (
          <>
            {tools.map((tool, i) => (
              <FeedCard
                key={tool.id}
                tool={tool}
                isActive={i === activeIndex}
                onRemix={() => {
                  trackEvent(tool.id, 'remix');
                  setRemixTool(tool);
                }}
                viewObserver={viewObserverRef.current}
              />
            ))}
            {/* Infinite scroll sentinel */}
            {hasMore && <div ref={observerRef} className="h-1" />}
            {loadingMore && (
              <div className="h-screen snap-start flex items-center justify-center">
                <div className="h-8 w-8 rounded-full border-2 border-doom-accent border-t-transparent animate-spin" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Scroll indicators */}
      {tools.length > 1 && (
        <div className="fixed right-3 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-1">
          {tools.slice(0, Math.min(tools.length, 10)).map((_, i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-300 ${
                i === activeIndex ? 'h-4 bg-doom-accent' : 'h-1.5 bg-gray-600'
              }`}
            />
          ))}
          {tools.length > 10 && <div className="w-1 h-1 rounded-full bg-gray-700" />}
        </div>
      )}

      {/* Remix Overlay */}
      <AnimatePresence>
        {remixTool && <RemixOverlay tool={remixTool} onClose={() => setRemixTool(null)} />}
      </AnimatePresence>
    </main>
  );
}

/* ─── Feed Card (Full-screen TikTok-style) ─── */
function FeedCard({
  tool,
  isActive,
  onRemix,
  viewObserver,
}: {
  tool: FeedTool;
  isActive: boolean;
  onRemix: () => void;
  viewObserver: IntersectionObserver | null;
}) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(tool.likesCount);
  const cardRef = useRef<HTMLDivElement>(null);
  const categoryStyle = CATEGORY_COLORS[tool.category] || CATEGORY_COLORS.utility;

  // Register with view observer for impression tracking
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
        body: JSON.stringify({
          toolId: tool.id,
          action: next ? 'like' : 'unlike',
        }),
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
        return; // user cancelled — don't track
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
      className="h-screen w-screen snap-start relative flex items-center justify-center"
    >
      {/* Tool preview - fills the card */}
      <div className="absolute inset-0">
        {tool.previewHtml ? (
          <iframe
            srcDoc={tool.previewHtml}
            className="w-full h-full"
            sandbox="allow-scripts"
            title={tool.title}
            loading={isActive ? 'eager' : 'lazy'}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-doom-dark via-doom-gray to-doom-dark flex items-center justify-center">
            <span className="text-6xl opacity-30">⚡</span>
          </div>
        )}
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-doom-black/80 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-doom-black/95 via-doom-black/60 to-transparent pointer-events-none" />

      {/* Right sidebar actions (TikTok-style) */}
      <div className="absolute right-3 bottom-40 flex flex-col items-center gap-5 z-10">
        {/* Like */}
        <button onClick={handleLike} className="flex flex-col items-center gap-1 group">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              liked ? 'bg-doom-red/20' : 'bg-white/10 backdrop-blur-sm'
            }`}
          >
            <svg
              className={`w-5 h-5 transition-all ${liked ? 'text-doom-red scale-110' : 'text-white group-hover:scale-110'}`}
              viewBox="0 0 24 24"
              fill={liked ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <span className="text-[11px] text-white font-medium">{formatCount(likeCount)}</span>
        </button>

        {/* Remix */}
        <button onClick={onRemix} className="flex flex-col items-center gap-1 group">
          <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-doom-accent/20 transition-all">
            <svg
              className="w-5 h-5 text-white group-hover:text-doom-accent-light"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </div>
          <span className="text-[11px] text-white font-medium">
            {formatCount(tool.remixesCount)}
          </span>
        </button>

        {/* Share */}
        <button onClick={handleShare} className="flex flex-col items-center gap-1 group">
          <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 transition-all">
            <svg
              className="w-5 h-5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />
            </svg>
          </div>
          <span className="text-[11px] text-white font-medium">Share</span>
        </button>

        {/* Open */}
        {tool.deployUrl && (
          <a
            href={tool.deployUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent(tool.id, 'use')}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-doom-green/20 transition-all">
              <svg
                className="w-5 h-5 text-white group-hover:text-doom-green"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
              </svg>
            </div>
            <span className="text-[11px] text-white font-medium">Open</span>
          </a>
        )}
      </div>

      {/* Bottom info overlay */}
      <div className="absolute bottom-6 left-4 right-16 z-10">
        {/* Creator */}
        <div className="flex items-center gap-2 mb-2">
          {tool.creator.avatarUrl ? (
            <img
              src={tool.creator.avatarUrl}
              alt={tool.creator.displayName || tool.creator.username}
              className="h-8 w-8 rounded-full border border-white/20"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-doom-gray border border-white/20 flex items-center justify-center text-sm text-gray-300">
              {(tool.creator.displayName || tool.creator.username).charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold text-white">
                {tool.creator.displayName || tool.creator.username}
              </span>
              {tool.creator.isVerified && (
                <svg
                  className="h-3.5 w-3.5 text-doom-accent"
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
            </div>
            <span className="text-[11px] text-gray-400">{timeAgo(tool.createdAt)}</span>
          </div>
        </div>

        {/* Title + description */}
        <h2 className="text-lg font-bold text-white mb-1 drop-shadow-lg">{tool.title}</h2>
        {tool.description && (
          <p className="text-sm text-gray-300 line-clamp-2 drop-shadow-md">{tool.description}</p>
        )}

        {/* Tags */}
        <div className="flex items-center gap-2 mt-2">
          <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${categoryStyle}`}>
            {tool.category}
          </span>
          {tool.prompt && (
            <span className="text-[11px] text-gray-400 truncate max-w-[200px]">
              &quot;{tool.prompt}&quot;
            </span>
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mt-2 text-[11px] text-gray-400">
          <span>{formatCount(tool.viewsCount)} views</span>
          <span>{formatCount(tool.remixesCount)} remixes</span>
          {tool.isPaid && (
            <span className="text-amber-400 font-medium">
              ${(tool.priceCents / 100).toFixed(2)}
            </span>
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
              setLogs((prev) => [...prev, `${event.stage}: ${event.message || ''}`]);
            }
            if (event.stage === 'deploying') setStatus('deploying');
            if (event.deployUrl) {
              setDeployUrl(event.deployUrl);
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="relative w-full sm:max-w-lg bg-doom-dark border-t sm:border border-gray-800 sm:rounded-2xl overflow-hidden max-h-[85vh]"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-700" />
        </div>

        {/* Header */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white">Remix</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Remixing <span className="text-white">{tool.title}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-doom-gray flex items-center justify-center text-gray-400 hover:text-white transition-colors"
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
        <div className="px-5 pb-3">
          <textarea
            ref={inputRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleRemix();
            }}
            placeholder="Describe how you want to change this tool..."
            rows={3}
            disabled={status === 'generating' || status === 'deploying'}
            className="w-full rounded-xl border border-gray-800 bg-doom-black px-4 py-3 text-sm text-white placeholder:text-gray-600 resize-none focus:outline-none focus:border-doom-accent disabled:opacity-50"
          />
        </div>

        {/* Streaming logs */}
        {logs.length > 0 && (
          <div className="px-5 pb-3">
            <div className="rounded-xl bg-doom-black border border-gray-800 p-3 max-h-32 overflow-y-auto scrollbar-thin">
              {logs.map((log, i) => (
                <p key={i} className="text-[11px] text-gray-400 font-mono leading-relaxed">
                  {log}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Deploy result */}
        {status === 'done' && deployUrl && (
          <div className="px-5 pb-3">
            <div className="rounded-xl bg-doom-green/10 border border-doom-green/30 p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-doom-green">Deployed!</p>
                <a
                  href={deployUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-doom-green/80 hover:text-doom-green underline"
                >
                  {deployUrl}
                </a>
              </div>
              <a
                href={deployUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-doom-green px-4 py-2 text-xs font-semibold text-white"
              >
                Open
              </a>
            </div>
          </div>
        )}

        {/* Action button */}
        <div className="px-5 pb-5">
          <button
            onClick={handleRemix}
            disabled={!prompt.trim() || status === 'generating' || status === 'deploying'}
            className="w-full rounded-xl bg-doom-accent px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-doom-accent-light disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
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
            <p className="text-center text-[11px] text-gray-600 mt-2">Cmd+Enter to submit</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Skeleton ─── */
function FeedSkeleton() {
  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 rounded-full border-2 border-doom-accent border-t-transparent animate-spin" />
        <p className="text-sm text-gray-500">Loading feed...</p>
      </div>
    </div>
  );
}
