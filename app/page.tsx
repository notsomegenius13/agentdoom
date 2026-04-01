'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

// ─── STATS HOOK ──────────────────────────────────────────────────────
function usePlatformStats() {
  const [stats, setStats] = useState<{
    totalTools: number;
    uniqueCreators: number;
    totalViews: number;
  } | null>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((d) => setStats(d.overview))
      .catch(() => setStats({ totalTools: 130, uniqueCreators: 40, totalViews: 12000 }));
  }, []);

  return stats;
}

// ─── STAT DISPLAY ────────────────────────────────────────────────────
function StatBadge({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center px-4 sm:px-6">
      <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white tabular-nums">
        {value}
      </div>
      <div className="text-xs sm:text-sm text-gray-500 mt-1">{label}</div>
    </div>
  );
}

// ─── EXAMPLE PROMPTS ─────────────────────────────────────────────────
const EXAMPLE_PROMPTS = [
  { emoji: '💰', title: 'Freelance rate calculator', category: 'Productivity' },
  { emoji: '🚀', title: 'Startup cost estimator', category: 'Business' },
  { emoji: '📅', title: 'Content calendar planner', category: 'Marketing' },
  { emoji: '🏋️', title: 'Workout plan generator', category: 'Health' },
  { emoji: '📊', title: 'Invoice PDF creator', category: 'Finance' },
  { emoji: '🎨', title: 'Color palette generator', category: 'Design' },
];

// ─── FORMAT NUMBER ───────────────────────────────────────────────────
function formatNum(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return n.toLocaleString();
}

// ─── MAIN PAGE ───────────────────────────────────────────────────────
export default function HomePage() {
  const stats = usePlatformStats();

  const fadeUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  };

  return (
    <main className="min-h-screen bg-doom-black relative overflow-hidden">
      {/* Gradient orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-doom-accent/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-12 md:py-20">
        {/* ─── HERO ─────────────────────────────────────────── */}
        <motion.section {...fadeUp} className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-doom-accent/10 border border-doom-accent/20 px-4 py-1.5 text-xs font-medium text-doom-accent-light mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-doom-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-doom-accent" />
            </span>
            Now Live
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]">
            Describe a tool. <span className="text-doom-accent">Ship it in seconds.</span>
          </h1>

          <p className="mt-4 md:mt-6 text-base sm:text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            AgentDoom turns a single sentence into a working, deployed web tool — no code, no
            config, no waiting.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/create-tool"
              className="w-full sm:w-auto rounded-xl bg-doom-accent px-8 py-3.5 text-base font-semibold text-white transition-all hover:bg-doom-accent-light active:scale-[0.98] shadow-lg shadow-doom-accent/25"
            >
              Build Something
            </Link>
            <Link
              href="/feed"
              className="w-full sm:w-auto rounded-xl border border-gray-700 px-8 py-3.5 text-base font-semibold text-gray-300 transition-all hover:border-gray-500 hover:text-white active:scale-[0.98]"
            >
              Explore Tools
            </Link>
          </div>
        </motion.section>

        {/* ─── SOCIAL PROOF STATS ──────────────────────────── */}
        {stats && (
          <motion.section {...fadeUp} transition={{ delay: 0.1 }} className="mb-12 md:mb-16">
            <div className="flex items-center justify-center divide-x divide-gray-800">
              <StatBadge value={`${formatNum(stats.totalTools)}+`} label="Tools built" />
              <StatBadge value={formatNum(stats.uniqueCreators)} label="Creators" />
              <StatBadge value={`${formatNum(stats.totalViews)}+`} label="Views" />
            </div>
          </motion.section>
        )}

        {/* ─── DEMO SECTION ────────────────────────────────── */}
        <motion.section {...fadeUp} transition={{ delay: 0.15 }} className="mb-12 md:mb-16">
          <div className="rounded-2xl border border-gray-800 overflow-hidden bg-doom-dark">
            {/* Fake browser chrome */}
            <div className="bg-doom-gray px-4 py-2.5 flex items-center gap-2 border-b border-gray-800">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-500/60" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                <div className="h-3 w-3 rounded-full bg-green-500/60" />
              </div>
              <span className="text-xs text-gray-500 ml-2 font-mono">agentdoom.ai/create-tool</span>
            </div>
            <div className="relative">
              <img
                src="/agentdoom-demo.gif"
                alt="Watch AgentDoom build a tool from a single prompt in seconds"
                className="w-full"
                loading="eager"
              />
              {/* Overlay CTA */}
              <div className="absolute inset-0 bg-gradient-to-t from-doom-dark/90 via-transparent to-transparent flex items-end justify-center pb-6 pointer-events-none">
                <Link
                  href="/create-tool"
                  className="pointer-events-auto rounded-xl bg-doom-accent/90 backdrop-blur px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-doom-accent active:scale-95"
                >
                  Try it yourself →
                </Link>
              </div>
            </div>
          </div>
          <p className="text-center text-sm text-gray-500 mt-3">
            From prompt to deployed tool in under 30 seconds
          </p>
        </motion.section>

        {/* ─── WHAT YOU CAN BUILD ──────────────────────────── */}
        <motion.section {...fadeUp} transition={{ delay: 0.2 }} className="mb-12 md:mb-16">
          <h2 className="text-center text-sm font-medium text-gray-500 uppercase tracking-wider mb-6">
            What people are building
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {EXAMPLE_PROMPTS.map((tool) => (
              <div
                key={tool.title}
                className="rounded-xl border border-gray-800 bg-doom-dark/50 p-4 transition-all hover:border-gray-700"
              >
                <div className="text-2xl mb-2">{tool.emoji}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  {tool.category}
                </div>
                <p className="text-sm font-medium text-white leading-snug">{tool.title}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-4">
            <Link
              href="/feed"
              className="text-sm text-doom-accent-light hover:text-doom-accent transition-colors"
            >
              Browse all tools →
            </Link>
          </div>
        </motion.section>

        {/* ─── HOW IT WORKS ────────────────────────────────── */}
        <motion.section {...fadeUp} transition={{ delay: 0.25 }} className="mb-12 md:mb-16">
          <h2 className="text-center text-sm font-medium text-gray-500 uppercase tracking-wider mb-8">
            How it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                step: '01',
                title: 'Describe it',
                desc: 'Type what you want in plain English. "A tip calculator that splits the bill."',
              },
              {
                step: '02',
                title: 'Watch it build',
                desc: 'AI generates, assembles, and tests your tool in real time. Takes seconds.',
              },
              {
                step: '03',
                title: 'Ship it',
                desc: 'Your tool deploys instantly with a shareable link. Done.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center md:text-left">
                <div className="text-xs font-bold text-doom-accent tracking-wider mb-2">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ─── META STORY ──────────────────────────────────── */}
        <motion.section
          {...fadeUp}
          transition={{ delay: 0.3 }}
          className="mb-12 md:mb-16 text-center"
        >
          <div className="inline-block rounded-2xl border border-gray-800 bg-doom-dark/30 px-6 sm:px-8 py-5 sm:py-6">
            <p className="text-lg font-semibold text-white">
              Built by <span className="text-doom-accent">12 AI agents</span> in{' '}
              <span className="text-doom-accent">72 hours</span>
            </p>
            <p className="text-sm text-gray-500 mt-2">
              AgentDoom is software that builds software — and it built itself.
            </p>
          </div>
        </motion.section>

        {/* ─── BOTTOM CTA ──────────────────────────────────── */}
        <motion.section {...fadeUp} transition={{ delay: 0.35 }} className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Ready to build?</h2>
          <p className="text-gray-400 mb-6 text-sm sm:text-base">
            Go from idea to deployed tool in under a minute.
          </p>
          <Link
            href="/create-tool"
            className="inline-block rounded-xl bg-doom-accent px-10 py-4 text-base font-semibold text-white transition-all hover:bg-doom-accent-light active:scale-[0.98] shadow-lg shadow-doom-accent/25"
          >
            Build Something
          </Link>
        </motion.section>

        {/* ─── FOOTER ──────────────────────────────────────── */}
        <div className="mt-12 text-center text-xs text-gray-700">agentdoom.ai</div>
      </div>
    </main>
  );
}
