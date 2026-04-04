import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { getDb } from '@/lib/db';
import type Stripe from 'stripe';

/** Post a revenue alert to #revenue-factory Slack channel. Fire-and-forget. */
async function slackRevenueAlert(message: string) {
  const webhookUrl = process.env.SLACK_REVENUE_WEBHOOK_URL;
  if (!webhookUrl) return;
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
    });
  } catch {
    console.error('[slack] Failed to post revenue alert');
  }
}

/**
 * POST /api/stripe/webhook
 * Handle Stripe webhook events for purchases, subscriptions, and account updates.
 */
export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  // Use Connect webhook secret if the event is from a connected account,
  // otherwise use the main webhook secret.
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid signature';
    console.error('Webhook signature verification failed:', message);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionCancelled(event.data.object as Stripe.Subscription);
        break;

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(`Error processing webhook ${event.type}:`, err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const db = getDb();
  const toolId = session.metadata?.tool_id;
  const buyerId = session.metadata?.buyer_id;
  const userId = session.metadata?.user_id;

  // Pro subscription checkout — save stripe_customer_id so subscription
  // lifecycle webhooks (created/updated/deleted) can map back to this user.
  if (userId && session.mode === 'subscription' && session.customer) {
    const customerId =
      typeof session.customer === 'string' ? session.customer : session.customer.id;

    await db`
      UPDATE users SET stripe_customer_id = ${customerId}, is_pro = true, updated_at = now()
      WHERE id = ${userId}
    `;
    // Slack alert: new Pro subscriber
    const userRows = await db`SELECT username, display_name FROM users WHERE id = ${userId}`;
    const u = userRows[0];
    const displayName = u?.display_name || u?.username || userId;
    slackRevenueAlert(`💰 New Pro subscriber: *${displayName}* just upgraded to Pro!`);
    return;
  }

  // Tool purchase checkout
  if (!toolId || !buyerId) return;

  // Record the purchase
  await db`
    INSERT INTO purchases (tool_id, buyer_id, amount_cents, stripe_session_id, status)
    VALUES (${toolId}, ${buyerId}, ${session.amount_total || 0}, ${session.id}, 'completed')
  `;

  // Slack alert: tool purchase
  const amountFormatted = `$${((session.amount_total || 0) / 100).toFixed(2)}`;
  const toolRows = await db`SELECT title FROM tools WHERE id = ${toolId}`;
  const toolTitle = toolRows[0]?.title || toolId;
  slackRevenueAlert(`🛒 New purchase: *${toolTitle}* sold for *${amountFormatted}*`);
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const stripe = getStripe();
  const remixRoyaltyCents = parseInt(paymentIntent.metadata?.remix_royalty_cents || '0', 10);
  const originalCreatorAccount = paymentIntent.metadata?.original_creator_account;

  // If there's a remix royalty, create a transfer to the original creator
  if (remixRoyaltyCents > 0 && originalCreatorAccount) {
    await stripe.transfers.create({
      amount: remixRoyaltyCents,
      currency: 'usd',
      destination: originalCreatorAccount,
      source_transaction: paymentIntent.latest_charge as string,
      metadata: {
        type: 'remix_royalty',
        tool_id: paymentIntent.metadata?.tool_id || '',
      },
    });
  }
}

async function handleAccountUpdated(account: Stripe.Account) {
  const db = getDb();
  const userId = account.metadata?.agentdoom_user_id;
  if (!userId) return;

  await db`
    UPDATE users
    SET stripe_account_id = ${account.id},
        stripe_charges_enabled = ${account.charges_enabled},
        stripe_payouts_enabled = ${account.payouts_enabled},
        updated_at = now()
    WHERE id = ${userId}
  `;
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const db = getDb();
  // The customer email or metadata links back to our user
  const customerId = subscription.customer as string;
  const isActive = subscription.status === 'active' || subscription.status === 'trialing';

  await db`
    UPDATE users SET is_pro = ${isActive}, updated_at = now()
    WHERE stripe_customer_id = ${customerId}
  `;
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  const db = getDb();
  const customerId = subscription.customer as string;

  const cancelledRows = await db`
    UPDATE users SET is_pro = false, updated_at = now()
    WHERE stripe_customer_id = ${customerId}
    RETURNING username, display_name
  `;

  const cu = cancelledRows[0];
  if (cu) {
    const name = cu.display_name || cu.username || customerId;
    slackRevenueAlert(`⚠️ Pro churn: *${name}* cancelled their subscription`);
  }
}
