'use client';

import { useState, useEffect, useCallback } from 'react';

interface WaitlistEntry {
  id: string;
  email: string;
  grantedAt: string | null;
  createdAt: string;
}

interface WaitlistData {
  total: number;
  granted: number;
  entries: WaitlistEntry[];
}

export default function AdminWaitlistPage() {
  const [data, setData] = useState<WaitlistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'granted' | 'pending'>('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/waitlist');
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAction = async (email: string, action: 'grant' | 'revoke') => {
    setActionLoading(email);
    try {
      const res = await fetch('/api/admin/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, action }),
      });
      if (res.ok) {
        showToast(
          action === 'grant' ? `Access granted to ${email}` : `Access revoked for ${email}`,
          'success',
        );
        await fetchData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Action failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredEntries = (data?.entries ?? []).filter((entry) => {
    const matchesSearch = entry.email.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === 'all' ||
      (filter === 'granted' && entry.grantedAt) ||
      (filter === 'pending' && !entry.grantedAt);
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <main className="min-h-screen bg-doom-black flex items-center justify-center">
        <div className="h-6 w-6 rounded-full border-2 border-doom-accent border-t-transparent animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-doom-black text-white">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-xl transition-all ${
            toast.type === 'success'
              ? 'bg-doom-green/20 border border-doom-green/40 text-doom-green'
              : 'bg-red-500/20 border border-red-500/40 text-red-400'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="border-b border-gray-800 bg-doom-dark/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">
              <span className="text-doom-accent">Agent</span>Doom Waitlist
            </h1>
            {data && (
              <p className="text-[10px] text-gray-500">
                {data.total} total · {data.granted} granted · {data.total - data.granted} pending
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <a
              href="/admin/analytics"
              className="text-xs text-gray-500 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-gray-800 hover:border-gray-600"
            >
              Analytics
            </a>
            <a
              href="/admin/revenue"
              className="text-xs text-gray-500 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-gray-800 hover:border-gray-600"
            >
              Revenue
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-gray-800 bg-doom-dark p-4 text-center">
            <p className="text-2xl font-bold text-white">{data?.total ?? 0}</p>
            <p className="text-xs text-gray-500 mt-0.5 uppercase tracking-wider">Total</p>
          </div>
          <div className="rounded-xl border border-doom-green/30 bg-doom-green/5 p-4 text-center">
            <p className="text-2xl font-bold text-doom-green">{data?.granted ?? 0}</p>
            <p className="text-xs text-gray-500 mt-0.5 uppercase tracking-wider">Granted</p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-doom-dark p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">
              {(data?.total ?? 0) - (data?.granted ?? 0)}
            </p>
            <p className="text-xs text-gray-500 mt-0.5 uppercase tracking-wider">Pending</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Search emails..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] bg-doom-dark border border-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-600"
          />
          <div className="flex gap-1">
            {(['all', 'pending', 'granted'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors capitalize ${
                  filter === f
                    ? 'bg-doom-accent text-white'
                    : 'bg-doom-dark border border-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-gray-800 bg-doom-dark overflow-hidden">
          {filteredEntries.length === 0 ? (
            <div className="py-12 text-center text-gray-600 text-sm">
              {search ? 'No results match your search.' : 'No waitlist entries yet.'}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500 text-xs">
                  <th className="text-left px-4 py-3 font-medium">Email</th>
                  <th className="text-left px-3 py-3 font-medium hidden sm:table-cell">Joined</th>
                  <th className="text-left px-3 py-3 font-medium hidden sm:table-cell">Granted</th>
                  <th className="text-right px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-gray-800/50 hover:bg-doom-gray/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="text-white font-mono text-xs">{entry.email}</span>
                      {entry.grantedAt && (
                        <span className="ml-2 inline-block text-[10px] px-1.5 py-0.5 rounded bg-doom-green/20 text-doom-green">
                          ✓ granted
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-gray-500 text-xs hidden sm:table-cell">
                      {new Date(entry.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-3 py-3 text-gray-500 text-xs hidden sm:table-cell">
                      {entry.grantedAt
                        ? new Date(entry.grantedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {entry.grantedAt ? (
                        <button
                          onClick={() => handleAction(entry.email, 'revoke')}
                          disabled={actionLoading === entry.email}
                          className="text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === entry.email ? '...' : 'Revoke'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAction(entry.email, 'grant')}
                          disabled={actionLoading === entry.email}
                          className="text-xs px-3 py-1.5 rounded-lg border border-doom-green/40 text-doom-green hover:bg-doom-green/10 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === entry.email ? '...' : 'Grant Access'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <p className="text-xs text-gray-600 text-center pb-4">
          Granting access allows this user to sign in and use the platform. They must sign in after
          being granted access for it to take effect.
        </p>
      </div>
    </main>
  );
}
