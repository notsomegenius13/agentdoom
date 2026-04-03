'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';

const FREE_FEATURES = [
  { name: '5 tools per day', included: true },
  { name: 'AgentDoom branding on tools', included: true },
  { name: 'Basic categories', included: true },
  { name: 'Community feed access', included: true },
  { name: 'Fork public tools', included: true },
  { name: 'Remove branding', included: false },
  { name: 'Custom domains', included: false },
  { name: 'Analytics dashboard', included: false },
  { name: 'Priority generation', included: false },
  { name: 'Premium primitives', included: false },
];

const PRO_FEATURES = [
  { name: 'Unlimited tools', included: true },
  { name: 'No AgentDoom branding', included: true },
  { name: 'All categories + premium', included: true },
  { name: 'Community feed access', included: true },
  { name: 'Fork public tools', included: true },
  { name: 'Custom domains', included: true },
  { name: 'Analytics dashboard', included: true },
  { name: 'Priority generation queue', included: true },
  { name: 'Premium primitives', included: true },
  { name: '15% platform fee (vs 20%)', included: true },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isSignedIn } = useUser();

  const monthlyPrice = 14;
  const annualMonthlyPrice = 10;
  const annualTotalPrice = 120;
  const displayPrice = annual ? annualMonthlyPrice : monthlyPrice;

  const handleUpgrade = async () => {
    if (!isSignedIn) {
      window.location.href = '/sign-up?redirect_url=/pricing';
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'pro',
          userId: user?.id,
          email: user?.primaryEmailAddress?.emailAddress,
          priceId: annual
            ? process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID
            : process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Unable to start checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-doom-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-doom-dark/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">
            <span className="text-doom-accent">Agent</span>Doom
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/marketplace"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Marketplace
            </Link>
            {!isSignedIn && (
              <Link
                href="/sign-in"
                className="text-sm text-doom-accent hover:text-doom-accent-light transition-colors"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-16">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
            Build more. <span className="text-doom-accent">Earn more.</span>
          </h1>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Upgrade to Pro for unlimited tool creation, lower platform fees, custom domains,
            analytics, and premium primitives.
          </p>
        </motion.div>

        {/* Billing Toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-center gap-2 sm:gap-4 mb-12"
        >
          <span className={`text-sm ${!annual ? 'text-white' : 'text-gray-500'}`}>Monthly</span>
          <button
            onClick={() => setAnnual(!annual)}
            className={`relative h-7 w-12 rounded-full transition-colors ${
              annual ? 'bg-doom-accent' : 'bg-gray-700'
            }`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition-transform ${
                annual ? 'translate-x-5.5 left-0' : 'left-0.5'
              }`}
              style={{ transform: annual ? 'translateX(22px)' : 'translateX(0)' }}
            />
          </button>
          <span className={`text-sm ${annual ? 'text-white' : 'text-gray-500'}`}>Annual</span>
          {annual && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-doom-green/20 text-doom-green">
              Save 29%
            </span>
          )}
        </motion.div>

        {/* Social Proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex items-center justify-center gap-8 mb-12 text-sm text-gray-500"
        >
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-doom-accent" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span>1,000+ tools created</span>
          </div>
          <div className="hidden sm:block h-4 w-px bg-gray-700" />
          <div className="hidden sm:flex items-center gap-2">
            <svg className="h-4 w-4 text-doom-green" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                clipRule="evenodd"
              />
            </svg>
            <span>500+ creators</span>
          </div>
          <div className="hidden md:block h-4 w-px bg-gray-700" />
          <div className="hidden md:flex items-center gap-2">
            <svg className="h-4 w-4 text-doom-accent" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Powered by Stripe</span>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Free Tier */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl border border-gray-800 bg-doom-dark p-4 sm:p-8"
          >
            <div className="mb-6">
              <h2 className="text-xl font-bold">Free</h2>
              <p className="text-sm text-gray-400 mt-1">Get started building tools</p>
            </div>

            <div className="mb-8">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-gray-500 ml-1">/mo</span>
            </div>

            <Link
              href="/sign-up"
              className="block w-full text-center rounded-xl border border-gray-700 px-6 py-3 text-sm font-semibold text-gray-300 transition-all hover:border-gray-500 active:scale-[0.98]"
            >
              Get Started
            </Link>

            <ul className="mt-8 space-y-3">
              {FREE_FEATURES.map((feature) => (
                <li key={feature.name} className="flex items-center gap-3 text-sm">
                  {feature.included ? (
                    <svg
                      className="h-4 w-4 text-doom-green flex-shrink-0"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-4 w-4 text-gray-600 flex-shrink-0"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  <span className={feature.included ? 'text-gray-300' : 'text-gray-600'}>
                    {feature.name}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Pro Tier */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="relative rounded-2xl border border-doom-accent/50 bg-doom-dark p-4 sm:p-8 overflow-hidden"
          >
            {/* Glow effect */}
            <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-doom-accent/10 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-doom-accent/5 blur-3xl" />

            <div className="relative">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Pro</h2>
                  <p className="text-sm text-gray-400 mt-1">For serious creators</p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-doom-accent/20 text-doom-accent-light">
                  POPULAR
                </span>
              </div>

              <div className="mb-8">
                <span className="text-4xl font-bold">
                  ${annual ? annualMonthlyPrice.toFixed(2) : displayPrice}
                </span>
                <span className="text-gray-500 ml-1">/mo</span>
                {annual && (
                  <p className="text-xs text-gray-500 mt-1">
                    ${annualTotalPrice}/yr billed annually
                  </p>
                )}
              </div>

              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full rounded-xl bg-doom-accent px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-doom-accent-light disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {loading ? 'Redirecting...' : 'Upgrade to Pro'}
              </button>

              {error && <p className="mt-2 text-xs text-red-400 text-center">{error}</p>}

              <p className="mt-3 text-xs text-gray-500 text-center">
                Cancel anytime. No questions asked.
              </p>

              <ul className="mt-8 space-y-3">
                {PRO_FEATURES.map((feature) => (
                  <li key={feature.name} className="flex items-center gap-3 text-sm">
                    <svg
                      className="h-4 w-4 text-doom-accent flex-shrink-0"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-300">{feature.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-20 max-w-2xl mx-auto"
        >
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="border-b border-gray-800 pb-6">
              <h3 className="font-semibold text-white">Can I cancel anytime?</h3>
              <p className="mt-2 text-sm text-gray-400">
                Yes. Cancel your subscription at any time from your profile settings. You&apos;ll
                keep Pro features until the end of your billing period.
              </p>
            </div>
            <div className="border-b border-gray-800 pb-6">
              <h3 className="font-semibold text-white">What happens to my tools if I downgrade?</h3>
              <p className="mt-2 text-sm text-gray-400">
                Your existing tools stay published. You&apos;ll lose access to premium primitives
                for new tools and the daily limit will apply again.
              </p>
            </div>
            <div className="border-b border-gray-800 pb-6">
              <h3 className="font-semibold text-white">What&apos;s the platform fee difference?</h3>
              <p className="mt-2 text-sm text-gray-400">
                Free creators pay a 20% platform fee on tool sales. Pro creators pay only 15%,
                keeping more of their revenue.
              </p>
            </div>
            <div className="pb-6">
              <h3 className="font-semibold text-white">Do I need Pro to sell tools?</h3>
              <p className="mt-2 text-sm text-gray-400">
                No. Any creator can sell tools on the marketplace. Pro just gives you a lower fee
                rate and premium features.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
