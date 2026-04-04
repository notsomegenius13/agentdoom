/**
 * Subscription feature gates.
 * Placeholder that checks subscription status from user metadata.
 * Actual Stripe webhook integration will populate this data later.
 */

export type SubscriptionTier = 'free' | 'pro'

export interface SubscriptionStatus {
  tier: SubscriptionTier
  isPro: boolean
}

/** Feature limits by tier. */
export const TIER_LIMITS = {
  free: {
    dailyTools: 5,
    platformFeeRate: 0.2,
    customDomains: false,
    analytics: false,
    priorityGeneration: false,
    premiumPrimitives: false,
    removeBranding: false,
  },
  pro: {
    dailyTools: Infinity,
    platformFeeRate: 0.15,
    customDomains: true,
    analytics: true,
    priorityGeneration: true,
    premiumPrimitives: true,
    removeBranding: true,
  },
} as const

/**
 * Get subscription status for a user.
 * TODO: Replace with actual Stripe subscription lookup via webhook-synced DB field.
 */
export function getSubscriptionStatus(userMetadata?: {
  isPro?: boolean
}): SubscriptionStatus {
  const isPro = userMetadata?.isPro === true
  return {
    tier: isPro ? 'pro' : 'free',
    isPro,
  }
}

/**
 * Check if a user can perform an action based on their tier.
 */
export function canAccess(
  tier: SubscriptionTier,
  feature: keyof (typeof TIER_LIMITS)['pro']
): boolean {
  return !!TIER_LIMITS[tier][feature]
}
