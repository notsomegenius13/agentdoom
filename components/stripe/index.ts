/**
 * Reusable Stripe Components & Templates
 *
 * Client-side:
 *   import PricingPageTemplate from '@/components/stripe/PricingPageTemplate'
 *
 * Server-side:
 *   import { createCheckoutSession } from '@/components/stripe/checkout-session'
 *   import { createWebhookHandler } from '@/components/stripe/webhook-handler'
 */

// Client components — import directly from their files to preserve 'use client' directive
// import PricingPageTemplate from '@/components/stripe/PricingPageTemplate'

// Server-side utilities
export { createCheckoutSession } from './checkout-session';
export type { CheckoutSessionParams } from './checkout-session';

export {
  createWebhookHandler,
  getCheckoutSession,
  getSubscription,
  getPaymentIntent,
  getAccount,
} from './webhook-handler';
export type { WebhookHandlerConfig, WebhookEventHandler } from './webhook-handler';
