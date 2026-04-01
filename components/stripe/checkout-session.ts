/**
 * Reusable Stripe Checkout Session Creator
 *
 * Drop this into any Next.js API route. Handles both one-time payments
 * and subscriptions with a unified interface.
 *
 * Usage in an API route:
 *   import { createCheckoutSession } from '@/components/stripe/checkout-session'
 *
 *   export async function POST(req: NextRequest) {
 *     const body = await req.json()
 *     const url = await createCheckoutSession({ ...body, stripe })
 *     return NextResponse.json({ url })
 *   }
 */

import type Stripe from 'stripe';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export interface CheckoutSessionParams {
  /** Initialized Stripe client instance */
  stripe: Stripe;
  /** 'payment' for one-time, 'subscription' for recurring */
  mode: 'payment' | 'subscription';
  /** Product display name (used if no stripePriceId) */
  productName?: string;
  /** Price in cents (used if no stripePriceId) */
  priceCents?: number;
  /** Pre-configured Stripe Price ID (takes precedence over priceCents) */
  stripePriceId?: string;
  /** Currency code (default: 'usd') */
  currency?: string;
  /** Customer email for receipts */
  customerEmail?: string;
  /** Existing Stripe Customer ID */
  customerId?: string;
  /** Redirect after success */
  successUrl?: string;
  /** Redirect on cancel */
  cancelUrl?: string;
  /** Metadata attached to the session */
  metadata?: Record<string, string>;
  /** Application fee in cents (for Connect) */
  applicationFeeCents?: number;
  /** Connected account destination (for Connect) */
  transferDestination?: string;
}

export async function createCheckoutSession(params: CheckoutSessionParams): Promise<string> {
  const {
    stripe,
    mode,
    productName,
    priceCents,
    stripePriceId,
    currency = 'usd',
    customerEmail,
    customerId,
    successUrl = `${BASE_URL}/checkout/success`,
    cancelUrl = `${BASE_URL}/checkout/cancel`,
    metadata = {},
    applicationFeeCents,
    transferDestination,
  } = params;

  // Build line items — either from a Price ID or ad-hoc price data
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = stripePriceId
    ? [{ price: stripePriceId, quantity: 1 }]
    : [
        {
          price_data: {
            currency,
            product_data: { name: productName || 'Product' },
            unit_amount: priceCents || 0,
            ...(mode === 'subscription' ? { recurring: { interval: 'month' as const } } : {}),
          },
          quantity: 1,
        },
      ];

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode,
    line_items: lineItems,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
  };

  // Attach customer identification
  if (customerId) {
    sessionParams.customer = customerId;
  } else if (customerEmail) {
    sessionParams.customer_email = customerEmail;
  }

  // Stripe Connect: application fees and transfer destination
  if (mode === 'payment' && (applicationFeeCents || transferDestination)) {
    sessionParams.payment_intent_data = {
      ...(applicationFeeCents ? { application_fee_amount: applicationFeeCents } : {}),
      ...(transferDestination ? { transfer_data: { destination: transferDestination } } : {}),
      metadata,
    };
  }

  if (mode === 'subscription' && applicationFeeCents) {
    sessionParams.subscription_data = {
      application_fee_percent: undefined, // Set via Stripe Dashboard or pass explicitly
      metadata,
    };
  }

  const session = await stripe.checkout.sessions.create(sessionParams);
  return session.url!;
}
