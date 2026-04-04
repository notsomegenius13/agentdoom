'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { FeedTool } from '@/lib/feed/types';
import ProBadge from '@/components/ProBadge';

interface CreatorProfile {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  isVerified: boolean;
  isPro: boolean;
  toolsCreated: number;
  followersCount: number;
  stripeChargesEnabled: boolean;
  createdAt: string;
}

const FOLLOW_STORAGE_KEY = 'agentdoom_follows';

function getFollows(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(FOLLOW_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function setFollows(follows: string[]) {
  localStorage.setItem(FOLLOW_STORAGE_KEY, JSON.stringify(follows));
}

export default function CreatorProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [tools, setTools] = useState<FeedTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setIsFollowing(getFollows().includes(username));
  }, [username]);

  useEffect(() => {
    const fetchProfile = async () => {
      const [profileRes, toolsRes] = await Promise.all([
        fetch(`/api/profile/${username}`),
        fetch(`/api/feed?creator=${username}`),
      ]);

      if (profileRes.ok) {
        setProfile(await profileRes.json());
      }
      if (toolsRes.ok) {
        const data = await toolsRes.json();
        setTools(data.sections?.flatMap((s: { tools: FeedTool[] }) => s.tools) || []);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [username]);

  const toggleFollow = useCallback(() => {
    const follows = getFollows();
    if (follows.includes(username)) {
      setFollows(follows.filter((u) => u !== username));
      setIsFollowing(false);
    } else {
      setFollows([...follows, username]);
      setIsFollowing(true);
    }
  }, [username]);

  const shareProfile = useCallback(async () => {
    const url = `${window.location.origin}/u/${username}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${profile?.displayName || username} on AgentDoom`, url });
        return;
      } catch {
        // fallback to clipboard
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [username, profile]);

  const totalForks = tools.reduce((sum, t) => sum + t.remixesCount, 0);
  const totalLikes = tools.reduce((sum, t) => sum + t.likesCount, 0);
  const totalViews = tools.reduce((sum, t) => sum + t.viewsCount, 0);

  if (loading) {
    return (
      <main className="min-h-screen bg-doom-black flex items-center justify-center">
        <div className="h-6 w-6 rounded-full border-2 border-doom-accent border-t-transparent animate-spin" />
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-doom-black text-white flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400">Creator not found</p>
        <Link href="/feed" className="text-doom-accent hover:underline text-sm">
          Browse Tools
        </Link>
      </main>
    );
  }

  const joinedDate = new Date(profile.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <main className="min-h-screen bg-doom-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-doom-dark/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/feed" className="text-xl font-bold tracking-tight">
            <span className="text-doom-accent">Agent</span>Doom
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/creators"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Top Creators
            </Link>
            <Link href="/feed" className="text-sm text-gray-400 hover:text-white transition-colors">
              Feed
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start gap-6"
        >
          {/* Avatar */}
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt="" className="h-24 w-24 rounded-2xl" />
          ) : (
            <div className="h-24 w-24 rounded-2xl bg-doom-accent/20 flex items-center justify-center text-3xl font-bold text-doom-accent">
              {(profile.displayName || profile.username).charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">{profile.displayName || profile.username}</h1>
              {profile.isVerified && (
                <span className="text-doom-accent text-sm" title="Verified">
                  ✓ Verified
                </span>
              )}
              {profile.isPro && <ProBadge size="md" />}
            </div>
            <p className="text-sm text-gray-500">@{profile.username}</p>
            {profile.bio && <p className="mt-2 text-gray-400 max-w-xl">{profile.bio}</p>}
            <p className="mt-1 text-xs text-gray-600">Joined {joinedDate}</p>

            {/* Stats Row */}
            <div className="mt-4 flex items-center gap-6 text-sm">
              <div>
                <span className="font-semibold text-white">{profile.toolsCreated}</span>
                <span className="ml-1 text-gray-500">tools</span>
              </div>
              <div>
                <span className="font-semibold text-white">{totalViews.toLocaleString()}</span>
                <span className="ml-1 text-gray-500">views</span>
              </div>
              <div>
                <span className="font-semibold text-white">{totalForks.toLocaleString()}</span>
                <span className="ml-1 text-gray-500">remixes</span>
              </div>
              <div>
                <span className="font-semibold text-white">{totalLikes.toLocaleString()}</span>
                <span className="ml-1 text-gray-500">likes</span>
              </div>
              <div>
                <span className="font-semibold text-white">
                  {profile.followersCount.toLocaleString()}
                </span>
                <span className="ml-1 text-gray-500">followers</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={toggleFollow}
                className={`rounded-xl px-5 py-2 text-sm font-semibold transition-colors ${
                  isFollowing
                    ? 'bg-doom-gray text-gray-300 hover:bg-doom-red/20 hover:text-doom-red'
                    : 'bg-doom-accent text-white hover:bg-doom-accent-light'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
              <button
                onClick={shareProfile}
                className="rounded-xl px-5 py-2 text-sm font-semibold bg-doom-gray text-gray-300 hover:text-white transition-colors"
              >
                {copied ? 'Copied!' : 'Share Profile'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Published Tools Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-10"
        >
          <h2 className="text-xl font-bold mb-4">Published Tools</h2>
          {tools.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tools.map((tool) => (
                <Link key={tool.id} href={`/t/${tool.slug}`}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    className="group rounded-2xl border border-gray-800 bg-doom-dark overflow-hidden transition-colors hover:border-doom-accent/40"
                  >
                    {tool.previewHtml ? (
                      <div className="h-36 overflow-hidden bg-white">
                        <iframe
                          srcDoc={tool.previewHtml}
                          className="w-full h-full pointer-events-none"
                          sandbox=""
                          title={tool.title}
                        />
                      </div>
                    ) : (
                      <div className="h-36 bg-doom-gray flex items-center justify-center">
                        <span className="text-gray-600 text-sm">No preview</span>
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold text-white truncate group-hover:text-doom-accent-light transition-colors">
                        {tool.title}
                      </h3>
                      {tool.description && (
                        <p className="mt-1 text-xs text-gray-400 line-clamp-2">
                          {tool.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-3">
                          <span>{tool.viewsCount} views</span>
                          <span>{tool.remixesCount} remixes</span>
                          <span>{tool.likesCount} ♥</span>
                        </div>
                        {tool.isPaid && (
                          <span className="text-doom-green font-semibold">
                            ${(tool.priceCents / 100).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              <p>No tools published yet</p>
            </div>
          )}
        </motion.div>
      </div>
    </main>
  );
}
