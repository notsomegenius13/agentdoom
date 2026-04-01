'use client';

import Link from 'next/link';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 text-6xl font-extrabold tracking-tighter text-doom-red opacity-80">
        Oops
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
      <p className="text-gray-400 mb-8 max-w-md">
        An unexpected error occurred. You can try again or head back home.
      </p>

      <div className="flex items-center gap-4">
        <button
          onClick={reset}
          className="rounded-xl bg-doom-accent px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-doom-accent-light active:scale-95"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-xl border border-white/10 bg-doom-dark px-6 py-3 text-sm font-semibold text-gray-300 transition-all hover:border-doom-accent/50 hover:bg-doom-gray"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
