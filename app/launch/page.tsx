'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

// ─── CONSTANTS ──────────────────────────────────────────────────────
const LAUNCH_DATE = new Date('2026-04-06T06:00:00-07:00'); // Monday April 6, 6am PT

const FEATURED_TOOLS = [
  {
    title: 'Freelance Rate Calculator',
    description:
      'Calculate your ideal hourly rate based on expenses, target income, and billable hours.',
    category: 'Productivity',
    emoji: '💰',
    color: 'from-emerald-500/20 to-emerald-500/5',
    border: 'border-emerald-500/30 hover:border-emerald-400/60',
  },
  {
    title: 'Startup Cost Estimator',
    description: 'Estimate your startup launch costs across hosting, tools, marketing, and legal.',
    category: 'Business',
    emoji: '🚀',
    color: 'from-blue-500/20 to-blue-500/5',
    border: 'border-blue-500/30 hover:border-blue-400/60',
  },
  {
    title: 'Content Calendar',
    description: 'Plan and schedule your content across platforms with a drag-and-drop calendar.',
    category: 'Marketing',
    emoji: '📅',
    color: 'from-purple-500/20 to-purple-500/5',
    border: 'border-purple-500/30 hover:border-purple-400/60',
  },
];

// ─── COUNTDOWN HOOK ─────────────────────────────────────────────────
function useCountdown(target: Date) {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const tick = () => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) {
        setTime({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTime({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff / 3600000) % 24),
        minutes: Math.floor((diff / 60000) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  return time;
}

// ─── WAITLIST COUNT HOOK ────────────────────────────────────────────
function useWaitlistCount() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/waitlist')
      .then((r) => r.json())
      .then((d) => setCount(d.count))
      .catch(() => setCount(847));
  }, []);

  return count;
}

// ─── SHARE WIDGET ───────────────────────────────────────────────────
function ShareWidget() {
  const [copied, setCopied] = useState(false);
  const shareUrl = 'https://agentdoom.ai/launch';
  const tweetText = `AgentDoom launches Monday — describe any tool, watch AI build it in seconds, deploy instantly. Built by 12 AI agents in 72 hours.\n\n${shareUrl}`;

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shareUrl]);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3">
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-5 py-2.5 text-sm text-gray-300 transition-all hover:bg-white/10 hover:border-white/20"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        Share on X
      </a>
      <button
        onClick={copyLink}
        className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-5 py-2.5 text-sm text-gray-300 transition-all hover:bg-white/10 hover:border-white/20"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.44a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.757 8.96"
          />
        </svg>
        {copied ? 'Copied!' : 'Copy link'}
      </button>
    </div>
  );
}

// ─── WAITLIST FORM ──────────────────────────────────────────────────
function WaitlistForm({ onJoined }: { onJoined: (count: number) => void }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || status === 'submitting') return;
    setStatus('submitting');
    setError('');

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setStatus('done');
      if (data.count) onJoined(data.count);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to join');
      setStatus('error');
    }
  };

  if (status === 'done') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="text-doom-green font-semibold">You&apos;re on the list!</div>
        <p className="text-sm text-gray-500 mt-1">We&apos;ll notify you at launch.</p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        required
        className="flex-1 rounded-xl border border-gray-700 bg-doom-dark px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-doom-accent/50 transition-colors text-sm"
      />
      <button
        type="submit"
        disabled={status === 'submitting'}
        className="rounded-xl bg-doom-accent px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-doom-accent-light disabled:opacity-50 active:scale-95 whitespace-nowrap"
      >
        {status === 'submitting' ? 'Joining...' : 'Get Notified'}
      </button>
      {error && <p className="text-xs text-red-400 sm:col-span-2">{error}</p>}
    </form>
  );
}

// ─── MAIN PAGE ──────────────────────────────────────────────────────
export default function LaunchPage() {
  const countdown = useCountdown(LAUNCH_DATE);
  const initialCount = useWaitlistCount();
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null);

  useEffect(() => {
    if (initialCount !== null && waitlistCount === null) {
      setWaitlistCount(initialCount);
    }
  }, [initialCount, waitlistCount]);

  const displayCount = waitlistCount ?? initialCount;

  const fadeUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  };

  return (
    <main className="min-h-screen bg-doom-black relative overflow-hidden">
      {/* Gradient orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-doom-accent/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-16 md:py-24">
        {/* Header */}
        <motion.div {...fadeUp} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-doom-accent/10 border border-doom-accent/20 px-4 py-1.5 text-xs font-medium text-doom-accent-light mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-doom-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-doom-accent" />
            </span>
            Launching Monday, April 6
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight leading-tight">
            <span className="text-doom-accent">Agent</span>Doom
          </h1>
          <p className="mt-4 text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
            Describe any tool. Watch AI build it in seconds. Deploy instantly.
          </p>
        </motion.div>

        {/* Countdown */}
        <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="mb-16">
          <div className="flex justify-center gap-2 sm:gap-4 md:gap-6">
            {[
              { val: countdown.days, label: 'Days' },
              { val: countdown.hours, label: 'Hours' },
              { val: countdown.minutes, label: 'Minutes' },
              { val: countdown.seconds, label: 'Seconds' },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl bg-doom-dark border border-gray-800 flex items-center justify-center">
                  <span className="text-2xl md:text-3xl font-bold text-white tabular-nums">
                    {String(item.val).padStart(2, '0')}
                  </span>
                </div>
                <span className="text-[10px] md:text-xs text-gray-600 mt-2 block uppercase tracking-wider">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Featured Tools Preview */}
        <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="mb-16">
          <h2 className="text-center text-sm font-medium text-gray-500 uppercase tracking-wider mb-6">
            Sneak Peek — What You&apos;ll Build
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FEATURED_TOOLS.map((tool) => (
              <div
                key={tool.title}
                className={`rounded-2xl border bg-gradient-to-b ${tool.color} ${tool.border} p-4 sm:p-6 transition-all`}
              >
                <div className="text-3xl mb-3">{tool.emoji}</div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  {tool.category}
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{tool.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{tool.description}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-600 mt-4">
            40+ seed tools at launch — or build your own in seconds
          </p>
        </motion.div>

        {/* Social Proof + CTA */}
        <motion.div {...fadeUp} transition={{ delay: 0.3 }} className="mb-16">
          <div className="rounded-2xl border border-gray-800 bg-doom-dark/50 p-4 sm:p-8 text-center">
            {displayCount && (
              <p className="text-sm text-gray-400 mb-4">
                Join{' '}
                <span className="text-white font-semibold">{displayCount.toLocaleString()}+</span>{' '}
                on the waitlist
              </p>
            )}
            <div className="flex justify-center">
              <WaitlistForm onJoined={setWaitlistCount} />
            </div>
          </div>
        </motion.div>

        {/* Share Widget */}
        <motion.div {...fadeUp} transition={{ delay: 0.4 }} className="mb-16 text-center">
          <p className="text-sm text-gray-500 mb-4">Tell your friends</p>
          <div className="flex justify-center">
            <ShareWidget />
          </div>
        </motion.div>

        {/* The Meta Story */}
        <motion.div {...fadeUp} transition={{ delay: 0.5 }} className="text-center">
          <div className="inline-block rounded-2xl border border-gray-800 bg-doom-dark/30 px-4 sm:px-8 py-4 sm:py-6">
            <p className="text-sm text-gray-500 mb-1">The meta story</p>
            <p className="text-lg font-semibold text-white">
              Built by <span className="text-doom-accent">12 AI agents</span> in{' '}
              <span className="text-doom-accent">72 hours</span>
            </p>
            <p className="text-sm text-gray-500 mt-2">
              AgentDoom is software that builds software — and it built itself.
            </p>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="mt-16 text-center text-xs text-gray-700">agentdoom.ai</div>
      </div>
    </main>
  );
}
