/**
 * Reusable Stripe Webhook Handler Template
 *
 * Drop this into a Next.js API route. Register your event handlers
 * and this module handles signature verification and routing.
 *
 * Usage:
 *   import { createWebhookHandler } from '@/components/stripe/webhook-handler'
 *   import { getStripe } from '@/lib/stripe'
 *
 *   export const POST = createWebhookHandler({
 *     getStripe,
 *     webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
 *     handlers: {
 *       'checkout.session.completed': async (event) => {
 *         const session = event.data.object
 *         // Handle completed checkout...
 *       },
 *       'customer.subscription.created': async (event) => { ... },
 *       'customer.subscription.updated': async (event) => { ... },
 *       'customer.subscription.deleted': async (event) => { ... },
 *     },
 *   })
 */

import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';

export type WebhookEventHandler = (event: Stripe.Event) => Promise<void>;

export interface WebhookHandlerConfig {
  /** Function that returns an initialized Stripe client */
  getStripe: () => Stripe;
  /** Stripe webhook signing secret (from STRIPE_WEBHOOK_SECRET) */
  webhookSecret: string;
  /** Map of event types to handler functions */
  handlers: Record<string, WebhookEventHandler>;
  /** Called for any unhandled event type (optional) */
  onUnhandledEvent?: (eventType: string) => void;
}

export function createWebhookHandler(config: WebhookHandlerConfig) {
  const { getStripe: getStripeClient, webhookSecret, handlers, onUnhandledEvent } = config;

  return async function POST(req: NextRequest): Promise<NextResponse> {
    const stripe = getStripeClient();
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    if (!webhookSecret) {
      console.error('Stripe webhook secret is not configured');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    // Verify the event signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid signature';
      console.error('Webhook signature verification failed:', message);
      return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
    }

    // Route to the appropriate handler
    try {
      const handler = handlers[event.type];
      if (handler) {
        await handler(event);
      } else {
        onUnhandledEvent?.(event.type);
      }

      return NextResponse.json({ received: true });
    } catch (err) {
      console.error(`Error processing webhook ${event.type}:`, err);
      return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
    }
  };
}

/**
 * Common event handler helpers — extract typed objects from events.
 */
export function getCheckoutSession(event: Stripe.Event): Stripe.Checkout.Session {
  return event.data.object as Stripe.Checkout.Session;
}

export function getSubscription(event: Stripe.Event): Stripe.Subscription {
  return event.data.object as Stripe.Subscription;
}

export function getPaymentIntent(event: Stripe.Event): Stripe.PaymentIntent {
  return event.data.object as Stripe.PaymentIntent;
}

export function getAccount(event: Stripe.Event): Stripe.Account {
  return event.data.object as Stripe.Account;
}
