import Stripe from 'stripe'

let stripeClient: Stripe | null = null

/**
 * Get a singleton Stripe client instance.
 */
export function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set')
    }
    stripeClient = new Stripe(key, { apiVersion: '2026-03-25.dahlia' })
  }
  return stripeClient
}

/** Platform fee percentage (0-1). 0.15 = 15%. */
export const PLATFORM_FEE_RATE = 0.15

/** Minimum price in cents for paid tools. */
export const MIN_PRICE_CENTS = 300 // $3.00

/** Calculate the platform fee in cents for a given price. */
export function calculatePlatformFee(priceCents: number, isPro: boolean): number {
  const rate = isPro ? 0.15 : 0.20
  return Math.round(priceCents * rate)
}

/** Calculate remix royalty in cents (7.5% of sale price). */
export function calculateRemixRoyalty(priceCents: number): number {
  return Math.round(priceCents * 0.075)
}
