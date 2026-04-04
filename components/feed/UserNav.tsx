'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

export default function UserNav() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (status === 'loading') {
    return <div className="h-8 w-8 rounded-full bg-doom-gray animate-pulse" />;
  }

  if (!session) {
    return (
      <Link
        href="/sign-in"
        className="rounded-full bg-doom-accent px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-doom-accent-light"
      >
        Sign In
      </Link>
    );
  }

  const initial = (session.user?.name || session.user?.email || 'U')[0].toUpperCase();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="h-8 w-8 rounded-full bg-doom-accent/20 border border-doom-accent/40 text-xs font-semibold text-doom-accent-light hover:bg-doom-accent/30 transition-colors flex items-center justify-center"
        title={session.user?.email || 'Account'}
      >
        {initial}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-44 rounded-xl border border-gray-800 bg-doom-dark shadow-xl py-1">
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/[0.05] transition-colors"
          >
            My Tools
          </Link>
          <Link
            href="/create-tool"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/[0.05] transition-colors"
          >
            Create Tool
          </Link>
          <div className="my-1 border-t border-gray-800" />
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-400 hover:text-red-400 hover:bg-white/[0.05] transition-colors"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
