import { getStripe } from './index'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

/**
 * Generate a Stripe Connect Express onboarding link for a creator.
 * Creates a new Express account if stripeAccountId is not provided,
 * or generates a fresh onboarding link for an existing account.
 */
export async function createConnectOnboardingLink(opts: {
  stripeAccountId?: string
  email: string
  userId: string
}): Promise<{ accountId: string; url: string }> {
  const stripe = getStripe()

  let accountId = opts.stripeAccountId
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      email: opts.email,
      metadata: { agentdoom_user_id: opts.userId },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    })
    accountId = account.id
  }

  const link = await stripe.accountLinks.create({
    account: accountId,
    type: 'account_onboarding',
    refresh_url: `${BASE_URL}/api/stripe/connect?refresh=true&account=${accountId}`,
    return_url: `${BASE_URL}/profile/settings?stripe=connected`,
  })

  return { accountId, url: link.url }
}

/**
 * Check whether a connected account has completed onboarding
 * and can accept payments.
 */
export async function checkAccountStatus(stripeAccountId: string): Promise<{
  chargesEnabled: boolean
  payoutsEnabled: boolean
  detailsSubmitted: boolean
}> {
  const stripe = getStripe()
  const account = await stripe.accounts.retrieve(stripeAccountId)
  return {
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    detailsSubmitted: account.details_submitted ?? false,
  }
}

/**
 * Generate a login link for a creator to access their Express Dashboard.
 */
export async function createDashboardLink(stripeAccountId: string): Promise<string> {
  const stripe = getStripe()
  const link = await stripe.accounts.createLoginLink(stripeAccountId)
  return link.url
}
