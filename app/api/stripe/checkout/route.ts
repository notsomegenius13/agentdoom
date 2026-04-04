import { NextRequest, NextResponse } from 'next/server'
import { createToolCheckoutSession, createProSubscriptionSession } from '@/lib/stripe/checkout'
import { getDb } from '@/lib/db'
import { randomUUID } from 'crypto'

/**
 * POST /api/stripe/checkout
 * Create a Stripe Checkout Session for tool purchase or Pro subscription.
 *
 * Tool purchase body:
 * { type: "tool", toolId, toolTitle, toolSlug, priceCents,
 *   creatorStripeAccountId, creatorIsPro, buyerId,
 *   originalCreatorStripeAccountId? }
 *
 * Pro subscription body:
 * { type: "pro", userId, email, priceId }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const sql = getDb()

    if (body.type === 'pro') {
      const { userId, email, priceId } = body
      if (!userId || !email || !priceId) {
        return NextResponse.json(
          { error: 'userId, email, and priceId are required for Pro checkout' },
          { status: 400 }
        )
      }
      const url = await createProSubscriptionSession({ userId, email, priceId })
      return NextResponse.json({ url })
    }

    // Default: tool purchase
    let {
      toolId, toolTitle, toolSlug, priceCents,
      creatorStripeAccountId, creatorIsPro, buyerId,
      originalCreatorStripeAccountId,
    } = body as {
      toolId?: string
      toolTitle?: string
      toolSlug?: string
      priceCents?: number
      creatorStripeAccountId?: string | null
      creatorIsPro?: boolean
      buyerId?: string
      originalCreatorStripeAccountId?: string
    }

    if (!toolId) {
      return NextResponse.json({ error: 'toolId is required for tool checkout' }, { status: 400 })
    }

    if (!toolTitle || !toolSlug || !priceCents) {
      const rows = (await sql`
        SELECT t.id, t.slug, t.title, t.price_cents,
               u.stripe_account_id AS creator_stripe_account_id,
               u.is_pro AS creator_is_pro
        FROM tools t
        LEFT JOIN users u ON u.id = t.creator_id
        WHERE t.id::text = ${toolId} OR t.slug = ${toolId}
        LIMIT 1
      `) as Record<string, unknown>[]

      if (rows.length === 0) {
        return NextResponse.json({ error: 'Tool not found' }, { status: 404 })
      }

      const tool = rows[0]
      toolId = tool.id as string
      toolTitle = tool.title as string
      toolSlug = tool.slug as string
      priceCents = tool.price_cents as number
      creatorStripeAccountId = (creatorStripeAccountId ?? tool.creator_stripe_account_id) as string | null
      creatorIsPro = Boolean(creatorIsPro ?? tool.creator_is_pro)
    }

    if ((priceCents ?? 0) < 300) {
      return NextResponse.json(
        { error: 'Minimum tool price is $3.00 (300 cents)' },
        { status: 400 }
      )
    }

    if (!buyerId) {
      buyerId = randomUUID()
    }

    const url = await createToolCheckoutSession({
      toolId: toolId!,
      toolTitle: toolTitle!,
      toolSlug: toolSlug!,
      priceCents: priceCents!,
      creatorStripeAccountId,
      creatorIsPro: creatorIsPro ?? false,
      buyerId,
      originalCreatorStripeAccountId,
    })

    return NextResponse.json({ url })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create checkout session'
    console.error('Stripe checkout error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
