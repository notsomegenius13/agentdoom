'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import ProBadge from '@/components/ProBadge';

interface LeaderboardCreator {
  rank: number;
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  isVerified: boolean;
  isPro: boolean;
  toolsCreated: number;
  followersCount: number;
  totalRemixes: number;
  totalViews: number;
  totalLikes: number;
  totalShares: number;
}

export default function TopCreatorsPage() {
  const [creators, setCreators] = useState<LeaderboardCreator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCreators = async () => {
      const res = await fetch('/api/creators?limit=30');
      if (res.ok) {
        const data = await res.json();
        setCreators(data.creators);
      }
      setLoading(false);
    };
    fetchCreators();
  }, []);

  return (
    <main className="min-h-screen bg-doom-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-doom-dark/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/feed" className="text-xl font-bold tracking-tight">
            <span className="text-doom-accent">Agent</span>Doom
          </Link>
          <Link href="/feed" className="text-sm text-gray-400 hover:text-white transition-colors">
            Feed
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl md:text-4xl font-bold">Top Creators</h1>
          <p className="mt-2 text-gray-400">The most remixed creators on AgentDoom</p>
        </motion.div>

        {loading ? (
          <div className="mt-12 flex justify-center">
            <div className="h-6 w-6 rounded-full border-2 border-doom-accent border-t-transparent animate-spin" />
          </div>
        ) : creators.length === 0 ? (
          <div className="mt-16 text-center text-gray-500">
            <p className="text-lg">No creators yet</p>
            <p className="mt-1 text-sm">Be the first to build something</p>
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {creators.map((creator, i) => (
              <motion.div
                key={creator.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Link href={`/u/${creator.username}`}>
                  <div className="group flex items-center gap-4 rounded-2xl border border-gray-800 bg-doom-dark p-4 transition-colors hover:border-doom-accent/40">
                    {/* Rank */}
                    <div
                      className={`w-8 text-center font-bold text-lg ${
                        creator.rank === 1
                          ? 'text-yellow-400'
                          : creator.rank === 2
                            ? 'text-gray-300'
                            : creator.rank === 3
                              ? 'text-amber-600'
                              : 'text-gray-600'
                      }`}
                    >
                      {creator.rank}
                    </div>

                    {/* Avatar */}
                    {creator.avatarUrl ? (
                      <img src={creator.avatarUrl} alt="" className="h-12 w-12 rounded-xl" />
                    ) : (
                      <div className="h-12 w-12 rounded-xl bg-doom-accent/20 flex items-center justify-center text-lg font-bold text-doom-accent">
                        {(creator.displayName || creator.username).charAt(0).toUpperCase()}
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white group-hover:text-doom-accent-light transition-colors truncate">
                          {creator.displayName || creator.username}
                        </span>
                        {creator.isVerified && (
                          <span className="text-doom-accent text-xs" title="Verified">
                            ✓
                          </span>
                        )}
                        {creator.isPro && <ProBadge size="sm" />}
                      </div>
                      <p className="text-xs text-gray-500 truncate">@{creator.username}</p>
                    </div>

                    {/* Stats */}
                    <div className="hidden sm:flex items-center gap-6 text-xs text-gray-500">
                      <div className="text-center">
                        <div className="font-semibold text-white">{creator.toolsCreated}</div>
                        <div>tools</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-white">
                          {creator.totalRemixes.toLocaleString()}
                        </div>
                        <div>remixes</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-white">
                          {creator.totalLikes.toLocaleString()}
                        </div>
                        <div>likes</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-white">
                          {creator.totalViews.toLocaleString()}
                        </div>
                        <div>views</div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
