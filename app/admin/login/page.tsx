'use client';

import { SignIn, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLoginPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/feed');
    }
  }, [isLoaded, isSignedIn, router]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#050505] px-6">
      <div className="mb-8 text-center">
        <h1 className="text-xl font-mono text-white/60 tracking-[0.15em] uppercase mb-2">
          Admin Access
        </h1>
        <p className="text-xs font-mono text-white/25">Sign in with an authorized Google account</p>
      </div>
      <SignIn
        routing="hash"
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'bg-[#0a0a0a] border border-white/[0.08] shadow-2xl',
            headerTitle: 'text-white/80',
            headerSubtitle: 'text-white/40',
            socialButtonsBlockButton: 'border-white/[0.08] text-white/70 hover:bg-white/[0.04]',
            formButtonPrimary: 'bg-white/10 hover:bg-white/20 text-white/80',
            footerActionLink: 'text-white/40 hover:text-white/60',
            formFieldInput: 'bg-transparent border-white/[0.08] text-white/80',
            formFieldLabel: 'text-white/40',
            identityPreviewEditButton: 'text-white/40',
            dividerLine: 'bg-white/[0.06]',
            dividerText: 'text-white/20',
          },
        }}
      />
    </main>
  );
}
