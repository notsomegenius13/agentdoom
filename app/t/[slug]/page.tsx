'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import type { FeedTool } from '@/lib/feed/types';

interface ToolDetail extends FeedTool {
  creatorId?: string;
  creator: FeedTool['creator'] & {
    stripeAccountId?: string | null;
    isPro?: boolean;
  };
}

const PRICING_TIERS = [
  {
    name: 'Free',
    price: 'Free',
    description: 'Fork with attribution',
    features: ['Fork & remix', 'Creator attribution required', 'Community support'],
    cta: 'Fork for Free',
    accent: false,
  },
  {
    name: 'Premium',
    price: null, // dynamic from tool
    description: 'Remove attribution + commercial use',
    features: [
      'No attribution required',
      'Commercial license',
      'Priority support',
      'Future updates',
    ],
    cta: 'Buy Now',
    accent: true,
  },
  {
    name: 'Enterprise',
    price: 'Contact',
    description: 'Custom deployment & SLA',
    features: [
      'White-label license',
      'Custom deployment',
      'SLA & dedicated support',
      'Bulk pricing',
    ],
    cta: 'Contact Us',
    accent: false,
  },
];

const AVATAR_FALLBACK_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' rx='24' fill='%231F2A37'/%3E%3Ccircle cx='24' cy='18' r='8' fill='%233B82F6'/%3E%3Cpath d='M10 42c1.8-7.5 7-11 14-11s12.2 3.5 14 11' fill='%233B82F6'/%3E%3C/svg%3E";

export default function ToolDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const purchased = searchParams.get('purchased') === 'true';

  const [tool, setTool] = useState<ToolDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSlow, setLoadingSlow] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showReportMenu, setShowReportMenu] = useState(false);
  const [reportStatus, setReportStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [linkCopied, setLinkCopied] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);

  useEffect(() => {
    setLoading(true);
    setTool(null);
    setLoadingSlow(false);
    setFetchError(false);

    const controller = new AbortController();
    const slowTimer = setTimeout(() => {
      setLoadingSlow(true);
      controller.abort();
    }, 8000);

    const fetchTool = async () => {
      try {
        const res = await fetch(`/api/tools/${slug}`, { signal: controller.signal });
        clearTimeout(slowTimer);
        if (res.ok) {
          const data: ToolDetail = await res.json();
          if (data) {
            setTool(data);
            // Record view event
            fetch('/api/feed/events', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                toolId: data.id,
                eventType: 'view',
                referrer: document.referrer || undefined,
              }),
            }).catch(() => {});
          }
        }
      } catch {
        clearTimeout(slowTimer);
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchTool();
    return () => {
      controller.abort();
      clearTimeout(slowTimer);
    };
  }, [slug, retryCount]);

  const getToolUrl = () => `${window.location.origin}/t/${tool?.slug ?? slug}`;

  const handleShare = async (channel: string) => {
    if (!tool) return;
    const url = getToolUrl();
    if (channel === 'copy') {
      await navigator.clipboard.writeText(url).catch(() => {});
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } else if (channel === 'x') {
      window.open(
        `https://x.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`${tool.title} — built on @AgentDoom`)}`,
        '_blank',
      );
    } else if (channel === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${tool.title} ${url}`)}`, '_blank');
    } else if (channel === 'native') {
      if (navigator.share) {
        await navigator
          .share({
            title: tool.title,
            text: tool.description || `${tool.title} — built on AgentDoom`,
            url,
          })
          .catch(() => {});
      }
    }
    fetch('/api/feed/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolId: tool.id, eventType: 'share', referrer: channel }),
    }).catch(() => {});
  };

  const getEmbedCode = () => {
    if (!tool) return '';
    const url = `${window.location.origin}/t/${tool.slug}`;
    return `<iframe src="${url}?embed=1" width="100%" height="500" style="border:none;border-radius:12px;" title="${tool.title}" sandbox="allow-scripts allow-forms"></iframe>`;
  };

  const handleCopyEmbed = async () => {
    await navigator.clipboard.writeText(getEmbedCode()).catch(() => {});
    setEmbedCopied(true);
    setTimeout(() => setEmbedCopied(false), 2000);
  };

  const handleLike = async () => {
    if (!tool) return;
    setLiked(!liked);
    await fetch('/api/feed/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolId: tool.id, eventType: liked ? 'unlike' : 'like' }),
    });
  };

  const handleReport = async (reason: string) => {
    if (!tool || reportStatus === 'sending') return;
    setReportStatus('sending');
    try {
      const res = await fetch('/api/tools/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId: tool.id, reason }),
      });
      if (res.ok) {
        setReportStatus('sent');
        setShowReportMenu(false);
      } else {
        setReportStatus('error');
      }
    } catch {
      setReportStatus('error');
    }
  };

  const handleCheckout = async () => {
    if (!tool?.isPaid) return;
    const buyerId = localStorage.getItem('agentdoom_buyer_id') || crypto.randomUUID();
    localStorage.setItem('agentdoom_buyer_id', buyerId);

    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'tool',
        toolId: tool.id,
        toolTitle: tool.title,
        toolSlug: tool.slug,
        priceCents: tool.priceCents,
        creatorStripeAccountId: tool.creator.stripeAccountId ?? null,
        creatorIsPro: tool.creator.isPro ?? false,
        buyerId,
      }),
    });
    if (res.ok) {
      const { url } = await res.json();
      if (url) window.location.href = url;
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-doom-black flex flex-col items-center justify-center gap-3">
        <div className="h-6 w-6 rounded-full border-2 border-doom-accent border-t-transparent animate-spin" />
        {loadingSlow && <p className="text-sm text-gray-500">Taking longer than expected...</p>}
      </main>
    );
  }

  if (fetchError) {
    return (
      <main className="min-h-screen bg-doom-black text-white flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400">Failed to load. Try again?</p>
        <button
          onClick={() => setRetryCount((c) => c + 1)}
          className="rounded-xl bg-doom-accent px-6 py-2.5 text-sm font-semibold text-white hover:bg-doom-accent-light transition-colors"
        >
          Retry
        </button>
      </main>
    );
  }

  if (!tool) {
    return (
      <main className="min-h-screen bg-doom-black text-white flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400">Tool not found</p>
        <Link href="/marketplace" className="text-doom-accent hover:underline text-sm">
          Back to Marketplace
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-doom-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-doom-dark/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/marketplace" className="text-xl font-bold tracking-tight">
            <span className="text-doom-accent">Agent</span>Doom
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/marketplace"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Marketplace
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Purchase success banner */}
        {purchased && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl bg-doom-green/10 border border-doom-green/30 px-4 py-3 text-doom-green text-sm"
          >
            Purchase complete! You now have full access to this tool.
          </motion.div>
        )}

        {/* Tool Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{tool.title}</h1>
              <p className="mt-2 text-gray-400 max-w-2xl">{tool.description}</p>

              {/* Creator */}
              <Link
                href={`/u/${tool.creator.username}`}
                className="mt-3 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                {tool.creator.avatarUrl ? (
                  <img
                    src={tool.creator.avatarUrl}
                    alt=""
                    className="h-6 w-6 rounded-full"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = AVATAR_FALLBACK_SVG;
                    }}
                  />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-doom-accent/30" />
                )}
                <span>
                  {tool.creator.displayName || tool.creator.username}
                  {tool.creator.isVerified && <span className="ml-1 text-doom-accent">✓</span>}
                </span>
              </Link>

              {/* Forked from */}
              {tool.remixedFrom && (
                <p className="mt-2 text-xs text-gray-500">
                  Forked from{' '}
                  {tool.remixedFromSlug ? (
                    <Link
                      href={`/t/${tool.remixedFromSlug}`}
                      className="text-doom-accent hover:underline"
                    >
                      {tool.remixedFromTitle || tool.remixedFromSlug}
                    </Link>
                  ) : (
                    <span className="text-gray-400">another tool</span>
                  )}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
              <button
                onClick={handleLike}
                className={`rounded-xl border px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors ${
                  liked
                    ? 'border-doom-accent text-doom-accent'
                    : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
                }`}
              >
                {liked ? '♥' : '♡'} {tool.likesCount + (liked ? 1 : 0)}
              </button>

              <Link
                href={`/remix/${tool.id}`}
                className="rounded-xl border border-gray-700 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-300 hover:border-gray-500 hover:text-white transition-colors"
              >
                Fork
              </Link>

              {/* Share buttons */}
              <button
                onClick={() => handleShare('copy')}
                className={`rounded-xl border px-2 sm:px-3 py-2 text-xs sm:text-sm transition-colors ${
                  linkCopied
                    ? 'border-doom-green text-doom-green'
                    : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
                }`}
                title="Copy link"
              >
                {linkCopied ? 'Copied!' : 'Copy Link'}
              </button>
              <button
                onClick={() => handleShare('x')}
                className="hidden sm:inline-flex rounded-xl border border-gray-700 px-3 py-2 text-sm text-gray-400 hover:border-gray-500 hover:text-white transition-colors"
                title="Share on X"
              >
                Share on X
              </button>
              <button
                onClick={() => handleShare('whatsapp')}
                className="hidden sm:inline-flex rounded-xl border border-gray-700 px-3 py-2 text-sm text-gray-400 hover:border-gray-500 hover:text-white transition-colors"
                title="Share on WhatsApp"
              >
                WhatsApp
              </button>
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  onClick={() => handleShare('native')}
                  className="rounded-xl border border-gray-700 px-3 py-2 text-sm text-gray-400 hover:border-gray-500 hover:text-white transition-colors sm:hidden"
                  title="Share"
                >
                  Share...
                </button>
              )}

              {tool.isPaid ? (
                <button
                  onClick={() => setShowPricing(true)}
                  className="rounded-xl bg-doom-accent px-3 sm:px-6 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-doom-accent-light transition-colors"
                >
                  Buy — ${(tool.priceCents / 100).toFixed(2)}
                </button>
              ) : (
                <Link
                  href={`/remix/${tool.id}`}
                  className="rounded-xl bg-doom-accent px-3 sm:px-6 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-doom-accent-light transition-colors"
                >
                  Fork for Free
                </Link>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 flex flex-wrap items-center gap-3 sm:gap-6 text-sm text-gray-500">
            <span>{tool.viewsCount.toLocaleString()} views</span>
            <span>{tool.usesCount.toLocaleString()} uses</span>
            <span>{tool.remixesCount.toLocaleString()} forks</span>
            <span>{tool.sharesCount.toLocaleString()} shares</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-doom-gray text-gray-400">
              {tool.category}
            </span>

            {/* Report button */}
            <div className="relative ml-auto">
              {reportStatus === 'sent' ? (
                <span className="text-xs text-doom-green">Report submitted</span>
              ) : (
                <button
                  onClick={() => setShowReportMenu(!showReportMenu)}
                  className="text-xs text-gray-600 hover:text-red-400 transition-colors"
                >
                  Report
                </button>
              )}
              {showReportMenu && (
                <div className="absolute right-0 top-6 z-20 w-48 rounded-xl border border-gray-800 bg-doom-dark p-2 shadow-xl">
                  <p className="px-2 py-1 text-xs text-gray-500 font-medium">Report as:</p>
                  {(
                    [
                      'harmful',
                      'phishing',
                      'spam',
                      'nsfw',
                      'malware',
                      'copyright',
                      'other',
                    ] as const
                  ).map((reason) => (
                    <button
                      key={reason}
                      onClick={() => handleReport(reason)}
                      disabled={reportStatus === 'sending'}
                      className="w-full text-left px-2 py-1.5 text-xs text-gray-300 hover:bg-doom-gray rounded-lg transition-colors disabled:opacity-50 capitalize"
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-8 rounded-2xl border border-gray-800 overflow-hidden"
        >
          <div className="bg-doom-gray px-4 py-2 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-500/60" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
              <div className="h-3 w-3 rounded-full bg-green-500/60" />
            </div>
            <span className="text-xs text-gray-500 ml-2">{tool.deployUrl || 'Preview'}</span>
          </div>
          {tool.previewHtml ? (
            <iframe
              srcDoc={tool.previewHtml}
              className="w-full h-[300px] sm:h-[400px] md:h-[500px] bg-white"
              sandbox="allow-scripts allow-forms"
              referrerPolicy="no-referrer"
              title={tool.title}
            />
          ) : tool.deployUrl ? (
            <iframe
              src={tool.deployUrl}
              className="w-full h-[300px] sm:h-[400px] md:h-[500px] bg-white"
              sandbox="allow-scripts allow-forms"
              title={tool.title}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="h-[300px] flex items-center justify-center bg-doom-dark text-gray-600">
              No preview available
            </div>
          )}
        </motion.div>

        {/* Pricing Tiers Section */}
        {(showPricing || tool.isPaid) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-12"
            id="pricing"
          >
            <h2 className="text-2xl font-bold mb-6">Pricing</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PRICING_TIERS.map((tier) => (
                <div
                  key={tier.name}
                  className={`rounded-2xl border p-4 sm:p-6 transition-colors ${
                    tier.accent
                      ? 'border-doom-accent bg-doom-accent/5'
                      : 'border-gray-800 bg-doom-dark'
                  }`}
                >
                  <h3 className="text-lg font-bold">{tier.name}</h3>
                  <p className="mt-1 text-2xl font-bold">
                    {tier.price === null ? `$${(tool.priceCents / 100).toFixed(2)}` : tier.price}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">{tier.description}</p>
                  <ul className="mt-4 space-y-2">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                        <span className="text-doom-green text-xs">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={tier.accent ? handleCheckout : undefined}
                    className={`mt-6 w-full rounded-xl py-2.5 text-sm font-semibold transition-colors ${
                      tier.accent
                        ? 'bg-doom-accent text-white hover:bg-doom-accent-light'
                        : 'border border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white'
                    }`}
                  >
                    {tier.cta}
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Embed Code Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-12"
        >
          <button
            onClick={() => setShowEmbed(!showEmbed)}
            className="text-sm text-gray-500 hover:text-white transition-colors flex items-center gap-2"
          >
            <span>{showEmbed ? '▾' : '▸'}</span>
            Embed this tool
          </button>
          {showEmbed && (
            <div className="mt-3 rounded-xl border border-gray-800 bg-doom-dark p-4">
              <p className="text-xs text-gray-400 mb-2">
                Paste this code into Notion, Substack, your website, or email newsletter:
              </p>
              <div className="relative">
                <pre className="text-xs text-gray-300 bg-doom-black rounded-lg p-3 overflow-x-auto font-mono">
                  {getEmbedCode()}
                </pre>
                <button
                  onClick={handleCopyEmbed}
                  className={`absolute top-2 right-2 text-xs px-2 py-1 rounded-lg transition-colors ${
                    embedCopied
                      ? 'bg-doom-green/20 text-doom-green'
                      : 'bg-doom-gray text-gray-400 hover:text-white'
                  }`}
                >
                  {embedCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Built with AgentDoom footer */}
      <footer className="mt-16 border-t border-gray-800 bg-doom-dark/50">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            Built with{' '}
            <Link
              href="/"
              className="font-bold text-white hover:text-doom-accent transition-colors"
            >
              <span className="text-doom-accent">Agent</span>Doom
            </Link>
          </div>
          <Link
            href="/"
            className="rounded-xl bg-doom-accent px-6 py-2.5 text-sm font-semibold text-white hover:bg-doom-accent-light transition-colors"
          >
            Make your own tool
          </Link>
        </div>
      </footer>
    </main>
  );
}
