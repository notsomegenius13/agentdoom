'use client';

import React, { useState } from 'react';

export interface PricingFeature {
  text: string;
  included: boolean;
}

export interface PricingTierConfig {
  /** Tier name (e.g. "Free", "Pro", "Enterprise") */
  name: string;
  /** Short description */
  description: string;
  /** Monthly price in dollars (0 for free tier) */
  monthlyPrice: number;
  /** Annual price in dollars (total per year) */
  annualPrice: number;
  /** Currency symbol */
  currency?: string;
  /** Feature list with included/excluded state */
  features: PricingFeature[];
  /** CTA button text */
  ctaLabel: string;
  /** Stripe Price ID for monthly billing */
  monthlyPriceId?: string;
  /** Stripe Price ID for annual billing */
  annualPriceId?: string;
  /** Visually highlight this tier */
  highlighted?: boolean;
  /** Badge text (e.g. "POPULAR") */
  badge?: string;
  /** If true, CTA is a link instead of checkout (e.g. "Contact Sales") */
  ctaHref?: string;
}

export interface PricingPageConfig {
  /** Page heading */
  title: string;
  /** Subheading */
  subtitle?: string;
  /** Pricing tiers (2-4 recommended) */
  tiers: PricingTierConfig[];
  /** API endpoint for creating checkout sessions */
  checkoutApiUrl?: string;
  /** Show monthly/annual toggle */
  showToggle?: boolean;
  /** Accent color class (tailwind bg class, e.g. "bg-purple-600") */
  accentColor?: string;
  /** Accent hover class */
  accentHoverColor?: string;
  /** Callback before checkout — return false to cancel */
  onBeforeCheckout?: (tier: PricingTierConfig, isAnnual: boolean) => boolean | Promise<boolean>;
  /** Called after successful redirect */
  onCheckoutRedirect?: (url: string) => void;
}

export default function PricingPageTemplate({ config }: { config: PricingPageConfig }) {
  const {
    title,
    subtitle,
    tiers,
    checkoutApiUrl = '/api/stripe/checkout',
    showToggle = true,
    accentColor = 'bg-purple-600',
    accentHoverColor = 'bg-purple-700',
    onBeforeCheckout,
    onCheckoutRedirect,
  } = config;

  const [isAnnual, setIsAnnual] = useState(false);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const gridCols =
    tiers.length === 2
      ? 'grid-cols-1 md:grid-cols-2 max-w-4xl'
      : tiers.length === 3
        ? 'grid-cols-1 md:grid-cols-3 max-w-6xl'
        : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 max-w-7xl';

  const handleCheckout = async (tier: PricingTierConfig) => {
    if (tier.ctaHref) {
      window.location.href = tier.ctaHref;
      return;
    }

    const priceId = isAnnual ? tier.annualPriceId : tier.monthlyPriceId;
    if (!priceId && tier.monthlyPrice === 0) {
      // Free tier — just link somewhere
      return;
    }

    if (onBeforeCheckout) {
      const proceed = await onBeforeCheckout(tier, isAnnual);
      if (!proceed) return;
    }

    setLoadingTier(tier.name);
    setError(null);

    try {
      const res = await fetch(checkoutApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          productName: tier.name,
          priceCents: Math.round((isAnnual ? tier.annualPrice : tier.monthlyPrice * 12) * 100),
          mode: 'subscription',
          metadata: { tier: tier.name, billing: isAnnual ? 'annual' : 'monthly' },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to start checkout');
        return;
      }

      if (data.url) {
        if (onCheckoutRedirect) {
          onCheckoutRedirect(data.url);
        } else {
          window.location.href = data.url;
        }
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <div className="w-full py-16 px-4">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="mt-3 text-lg text-gray-500 max-w-2xl mx-auto">{subtitle}</p>}
      </div>

      {/* Billing Toggle */}
      {showToggle && (
        <div className="flex items-center justify-center gap-3 mb-12">
          <span className={`text-sm font-medium ${!isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
            Monthly
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={isAnnual}
            aria-label="Toggle annual billing"
            onClick={() => setIsAnnual(!isAnnual)}
            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
              isAnnual ? accentColor : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                isAnnual ? 'translate-x-8' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
            Annual
          </span>
        </div>
      )}

      {error && (
        <p className="text-center text-sm text-red-600 mb-6" role="alert">
          {error}
        </p>
      )}

      {/* Tier Cards */}
      <div className={`grid gap-6 mx-auto ${gridCols}`}>
        {tiers.map((tier) => {
          const currency = tier.currency || '$';
          const monthlyDisplay = isAnnual
            ? (tier.annualPrice / 12).toFixed(2)
            : tier.monthlyPrice.toFixed(0);
          const savingsPercent =
            tier.monthlyPrice > 0
              ? Math.round(
                  ((tier.monthlyPrice * 12 - tier.annualPrice) / (tier.monthlyPrice * 12)) * 100,
                )
              : 0;
          const isLoading = loadingTier === tier.name;
          const isFree = tier.monthlyPrice === 0;

          return (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-2xl border-2 p-8 transition-all ${
                tier.highlighted
                  ? 'border-purple-500 shadow-lg scale-[1.02]'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {tier.badge && tier.highlighted && (
                <span
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full ${accentColor} px-4 py-1 text-xs font-semibold text-white`}
                >
                  {tier.badge}
                </span>
              )}

              <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
              <p className="mt-1 text-sm text-gray-500">{tier.description}</p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-gray-900">
                  {isFree ? 'Free' : `${currency}${monthlyDisplay}`}
                </span>
                {!isFree && <span className="text-sm text-gray-500">/mo</span>}
                {isAnnual && savingsPercent > 0 && (
                  <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    Save {savingsPercent}%
                  </span>
                )}
              </div>
              {isAnnual && !isFree && (
                <p className="mt-1 text-xs text-gray-400">
                  {currency}
                  {tier.annualPrice}/yr billed annually
                </p>
              )}

              <ul className="mt-6 flex-1 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature.text} className="flex items-start gap-2 text-sm">
                    {feature.included ? (
                      <svg
                        className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg
                        className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    )}
                    <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => handleCheckout(tier)}
                disabled={isLoading}
                aria-busy={isLoading}
                className={`mt-8 w-full rounded-lg px-4 py-3 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
                  tier.highlighted
                    ? `${accentColor} text-white hover:opacity-90`
                    : 'border-2 border-purple-600 text-purple-600 hover:bg-purple-50'
                }`}
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Processing...
                  </span>
                ) : (
                  tier.ctaLabel
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
