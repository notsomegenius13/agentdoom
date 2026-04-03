'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

export default function UserNav() {
  const { data: session, status } = useSession();

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

  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })}
      className="h-8 w-8 rounded-full bg-doom-accent/20 border border-doom-accent/40 text-xs font-semibold text-doom-accent-light hover:bg-doom-accent/30 transition-colors flex items-center justify-center"
      title={session.user?.email || 'Account'}
    >
      {(session.user?.name || session.user?.email || 'U')[0].toUpperCase()}
    </button>
  );
}
