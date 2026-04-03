import { getStripe, calculatePlatformFee, calculateRemixRoyalty } from './index';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

interface ToolCheckoutParams {
  toolId: string;
  toolTitle: string;
  toolSlug: string;
  priceCents: number;
  creatorStripeAccountId?: string | null;
  creatorIsPro: boolean;
  buyerId: string;
  /** If this tool is a remix, the original creator's Stripe account. */
  originalCreatorStripeAccountId?: string;
}

/**
 * Create a Stripe Checkout Session for purchasing a tool.
 * Handles platform fees and optional remix royalties via transfers.
 */
export async function createToolCheckoutSession(params: ToolCheckoutParams): Promise<string> {
  const stripe = getStripe();

  const platformFee = calculatePlatformFee(params.priceCents, params.creatorIsPro);

  // If this is a remix, add the royalty to the platform fee so we can
  // distribute it separately after the payment succeeds (via webhook).
  let totalApplicationFee = platformFee;
  let remixRoyalty = 0;
  if (params.originalCreatorStripeAccountId) {
    remixRoyalty = calculateRemixRoyalty(params.priceCents);
    totalApplicationFee += remixRoyalty;
  }

  const paymentIntentData: {
    application_fee_amount: number;
    transfer_data?: { destination: string };
    metadata: Record<string, string>;
  } = {
    application_fee_amount: totalApplicationFee,
    metadata: {
      tool_id: params.toolId,
      buyer_id: params.buyerId,
      remix_royalty_cents: String(remixRoyalty),
      original_creator_account: params.originalCreatorStripeAccountId || '',
    },
  };

  if (params.creatorStripeAccountId) {
    paymentIntentData.transfer_data = {
      destination: params.creatorStripeAccountId,
    };
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: params.toolTitle,
            metadata: { tool_id: params.toolId },
          },
          unit_amount: params.priceCents,
        },
        quantity: 1,
      },
    ],
    payment_intent_data: paymentIntentData,
    success_url: `${BASE_URL}/t/${params.toolSlug}?purchased=true`,
    cancel_url: `${BASE_URL}/t/${params.toolSlug}`,
    metadata: {
      tool_id: params.toolId,
      buyer_id: params.buyerId,
    },
  });

  return session.url!;
}

/**
 * Create a Stripe Checkout Session for Pro subscription ($14/mo or $120/yr).
 */
export async function createProSubscriptionSession(opts: {
  userId: string;
  email: string;
  priceId: string;
}): Promise<string> {
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: opts.priceId, quantity: 1 }],
    customer_email: opts.email,
    success_url: `${BASE_URL}/pricing/success`,
    cancel_url: `${BASE_URL}/pricing`,
    metadata: { user_id: opts.userId },
  });

  return session.url!;
}
