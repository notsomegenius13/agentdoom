'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminLoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push('/feed');
    }
  }, [status, session, router]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('error') === 'AccessDenied') {
      setError('Access denied. Your Google account is not authorized as an admin.');
    } else if (params.get('error')) {
      setError('Sign-in failed. Please try again.');
    }
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#050505] px-6">
      <div className="mb-8 text-center">
        <h1 className="text-xl font-mono text-white/90 tracking-[0.15em] uppercase mb-2">
          Admin Access
        </h1>
        <p className="text-xs font-mono text-white/50">Sign in with an authorized Google account</p>
      </div>

      <div className="w-full max-w-sm bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-8 shadow-2xl">
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-xs font-mono text-red-400 text-center">{error}</p>
          </div>
        )}

        {status === 'loading' ? (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          </div>
        ) : (
          <button
            onClick={() => signIn('google', { callbackUrl: '/feed' })}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-white/20 bg-white/[0.05] text-white hover:bg-white/[0.1] hover:border-white/40 transition-colors font-mono text-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </button>
        )}
      </div>

      <p className="mt-6 text-[10px] font-mono text-white/40">
        Only authorized accounts can access the platform
      </p>
    </main>
  );
}
