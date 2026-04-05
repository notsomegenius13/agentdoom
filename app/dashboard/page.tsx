'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import GlobalNav from '@/components/feed/GlobalNav';

interface MyTool {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  isPaid: boolean;
  priceCents: number;
  previewHtml: string | null;
  createdAt: string | null;
  viewsCount: number;
  likesCount: number;
  remixesCount: number;
}

export default function CreatorDashboardPage() {
  const { data: session } = useSession();
  const [myTools, setMyTools] = useState<MyTool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMyTools() {
      try {
        const res = await fetch('/api/tools/list?creator=me');
        if (res.ok) {
          const data = await res.json();
          setMyTools(data.tools ?? []);
        }
      } catch {
        // silently show empty state
      } finally {
        setLoading(false);
      }
    }
    fetchMyTools();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-doom-black flex items-center justify-center">
        <div className="h-6 w-6 rounded-full border-2 border-doom-accent border-t-transparent animate-spin" />
      </main>
    );
  }

  const creatorName = session?.user?.name ?? null;

  return (
    <main className="min-h-screen bg-doom-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-doom-dark/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/feed" className="text-xl font-bold tracking-tight shrink-0">
            <span className="text-doom-accent">Agent</span>Doom
          </Link>
          <GlobalNav />
          <Link
            href="/create-tool"
            className="rounded-xl bg-doom-accent px-4 py-2 text-sm font-semibold text-white hover:bg-doom-accent-light transition-colors"
          >
            + New Tool
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold">
            {creatorName ? `Welcome back, ${creatorName}` : 'Creator Dashboard'}
          </h1>
          <p className="text-gray-400 text-sm mt-1">Manage your tools and grow your audience.</p>
        </motion.div>

        {/* My Tools */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">My Tools</h2>
            <Link
              href="/create-tool"
              className="text-sm text-doom-accent hover:text-doom-accent-light transition-colors"
            >
              + Create new
            </Link>
          </div>

          {myTools.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myTools.map((tool) => (
                <div
                  key={tool.id}
                  className="rounded-2xl border border-gray-800 bg-doom-dark overflow-hidden group"
                >
                  {tool.previewHtml ? (
                    <div className="h-32 overflow-hidden bg-white">
                      <iframe
                        srcDoc={tool.previewHtml}
                        className="w-full h-full pointer-events-none"
                        sandbox=""
                        title={tool.title}
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="h-32 bg-doom-gray flex items-center justify-center">
                      <span className="text-gray-600 text-sm">No preview</span>
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="rounded-full bg-doom-accent/20 text-doom-accent-light px-2 py-0.5 text-xs">
                        {tool.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        {tool.isPaid ? `$${(tool.priceCents / 100).toFixed(2)}` : 'Free'}
                      </span>
                    </div>
                    <h3 className="font-semibold text-white truncate">{tool.title}</h3>
                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-600">
                      <span>{tool.viewsCount} views</span>
                      <span>{tool.likesCount} likes</span>
                      <span>{tool.remixesCount} forks</span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Link
                        href={`/dashboard/tools/${tool.id}/edit`}
                        className="flex-1 text-center rounded-lg bg-doom-gray px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/t/${tool.slug}`}
                        className="flex-1 text-center rounded-lg bg-doom-accent/20 px-3 py-1.5 text-xs font-medium text-doom-accent-light hover:bg-doom-accent/30 transition-colors"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-gray-800 border-dashed bg-doom-dark/50 p-10 text-center">
              <div className="text-4xl mb-3 opacity-60">⚡</div>
              <h3 className="text-lg font-semibold text-white mb-2">No tools yet</h3>
              <p className="text-gray-500 text-sm mb-5 max-w-sm mx-auto">
                Describe any tool in plain English and watch it build itself. Your first creation is
                just a prompt away.
              </p>
              <Link
                href="/create-tool"
                className="inline-block rounded-xl bg-doom-accent px-6 py-2.5 text-sm font-semibold text-white hover:bg-doom-accent-light transition-colors"
              >
                Create Your First Tool
              </Link>
            </div>
          )}
        </motion.div>

        {/* Recent Sales */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-lg font-bold mb-4">Recent Sales</h2>
          <div className="text-center text-gray-500 py-12 rounded-xl border border-gray-800 border-dashed bg-doom-dark/50">
            <div className="text-3xl mb-3 opacity-60">💰</div>
            <p className="text-sm text-gray-400 font-medium">No earnings yet</p>
            <p className="text-xs text-gray-600 mt-1 mb-4">Share your tools to start earning!</p>
            <Link
              href="/feed"
              className="inline-block rounded-xl bg-doom-gray px-4 py-2 text-xs font-medium text-gray-300 hover:text-white transition-colors"
            >
              Browse the Feed
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
