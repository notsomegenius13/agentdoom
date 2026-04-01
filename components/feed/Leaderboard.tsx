'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface LeaderboardTool {
  rank: number;
  id: string;
  slug: string;
  title: string;
  category: string;
  viewsCount: number;
  forksCount: number;
  likesCount: number;
  isPaid: boolean;
  priceCents: number;
  creator: {
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    isVerified: boolean;
  };
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

type LeaderboardMode = 'views' | 'forks';

export default function Leaderboard() {
  const [mode, setMode] = useState<LeaderboardMode>('views');
  const [tools, setTools] = useState<LeaderboardTool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      const res = await fetch(`/api/leaderboard?by=${mode}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setTools(data.tools);
      }
      setLoading(false);
    };
    fetchLeaderboard();
  }, [mode]);

  return (
    <div className="rounded-2xl border border-gray-800 bg-doom-dark p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-white text-sm">Leaderboard</h3>
        <div className="flex rounded-lg bg-doom-gray p-0.5">
          <button
            onClick={() => setMode('views')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
              mode === 'views' ? 'bg-doom-accent text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Most Viewed
          </button>
          <button
            onClick={() => setMode('forks')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
              mode === 'forks' ? 'bg-doom-accent text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Most Forked
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="h-4 w-4 rounded-full border-2 border-doom-accent border-t-transparent animate-spin" />
        </div>
      ) : tools.length === 0 ? (
        <p className="text-xs text-gray-500 text-center py-4">No tools yet</p>
      ) : (
        <div className="space-y-1">
          {tools.map((tool) => (
            <Link key={tool.id} href={`/t/${tool.slug}`}>
              <div className="flex items-center gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-doom-gray/50 group">
                <span
                  className={`w-5 text-center text-xs font-bold ${
                    tool.rank === 1
                      ? 'text-yellow-400'
                      : tool.rank === 2
                        ? 'text-gray-300'
                        : tool.rank === 3
                          ? 'text-amber-600'
                          : 'text-gray-600'
                  }`}
                >
                  {tool.rank}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate group-hover:text-doom-accent-light transition-colors">
                    {tool.title}
                  </p>
                  <p className="text-[10px] text-gray-500 truncate">
                    by {tool.creator.displayName || tool.creator.username}
                    {tool.creator.isVerified && (
                      <span className="ml-0.5 text-doom-accent">&#10003;</span>
                    )}
                  </p>
                </div>

                <span className="text-[11px] text-gray-500 tabular-nums shrink-0">
                  {mode === 'views'
                    ? `${formatCount(tool.viewsCount)} views`
                    : `${formatCount(tool.forksCount)} forks`}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
