#!/usr/bin/env node
/**
 * Create AgentDoom Pro subscription products and prices in Stripe.
 * Run once: node scripts/setup-stripe-products.js
 */
const Stripe = require('stripe')

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

async function main() {
  console.log('Creating AgentDoom Pro product...')

  // Create the product
  const product = await stripe.products.create({
    name: 'AgentDoom Pro',
    description: 'Unlimited tools, lower fees, custom domains, analytics, and premium primitives.',
    metadata: { tier: 'pro' },
  })
  console.log(`Product created: ${product.id}`)

  // Monthly price: $19/mo
  const monthlyPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 1900,
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: { plan: 'pro_monthly' },
  })
  console.log(`Monthly price created: ${monthlyPrice.id} ($19/mo)`)

  // Annual price: $149/yr (~$12.42/mo equivalent, ~35% savings)
  const annualPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 14900,
    currency: 'usd',
    recurring: { interval: 'year' },
    metadata: { plan: 'pro_annual' },
  })
  console.log(`Annual price created: ${annualPrice.id} ($149/yr)`)

  // Create a webhook endpoint
  const webhook = await stripe.webhookEndpoints.create({
    url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://agentdoom.com'}/api/stripe/webhook`,
    enabled_events: [
      'checkout.session.completed',
      'payment_intent.succeeded',
      'account.updated',
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
    ],
  })
  console.log(`Webhook endpoint created: ${webhook.id}`)
  console.log(`Webhook secret: ${webhook.secret}`)

  console.log('\n--- Add these to .env.local ---')
  console.log(`NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID=${monthlyPrice.id}`)
  console.log(`NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID=${annualPrice.id}`)
  console.log(`STRIPE_WEBHOOK_SECRET=${webhook.secret}`)
}

main().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
