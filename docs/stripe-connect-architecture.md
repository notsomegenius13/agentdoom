# AgentDoom — Stripe Connect Architecture & Marketplace Economics

**Author:** Ledger (Head of Revenue)
**Date:** 2026-03-31
**Status:** Research Complete — Ready for Implementation
**Related:** PROJECT_DOOM_MASTER_SPEC.md (Sections 2.4, 3.2)

---

## 1. Stripe Connect Account Type Recommendation

### Options Evaluated

| Feature | Standard | Express | Custom |
|---------|----------|---------|--------|
| **Onboarding** | Creator leaves AgentDoom, manages own Stripe Dashboard | Stripe-hosted onboarding form (< 5 min) | Fully custom UI built by us |
| **Dashboard** | Full Stripe Dashboard | Stripe Express Dashboard (limited) | We build everything |
| **Payout control** | Creator manages | We set schedule, creator sees Express Dashboard | Full control |
| **Platform liability** | Low | Low | High — we handle disputes, compliance |
| **Dev effort** | Low | Low-Medium | Very High |
| **Branding** | Stripe-branded | Stripe-branded with our logo | Fully our brand |
| **KYC/Identity** | Stripe handles | Stripe handles | We must build or integrate |
| **Best for** | SaaS platforms | Marketplaces, gig platforms | Financial platforms |

### Recommendation: Express Connect

**Express is the right choice for AgentDoom.** Rationale:

1. **Lowest friction for creators.** Onboarding takes < 5 minutes via Stripe-hosted form. Creators don't need to understand Stripe — they just fill out a form and start selling. This matches AgentDoom's "normie-first" philosophy.

2. **We control payouts and fees.** Express lets us set the platform fee (15-20%) and payout schedule programmatically. Creators see a simplified Express Dashboard for their earnings.

3. **Stripe handles compliance.** KYC, identity verification, tax reporting (1099s) — all handled by Stripe. For a marketplace launching fast, this is critical. Custom Connect would require months of compliance work.

4. **Upgrade path exists.** If we outgrow Express (e.g., need white-labeled onboarding for Enterprise tier), we can migrate to Custom later. Express → Custom migration is supported by Stripe.

5. **Cost-effective.** Same Stripe fees as Custom. No additional platform fee from Stripe for Express.

**When to reconsider Custom:** Only if Enterprise customers ($99-499/mo) demand fully white-labeled payment experiences. This is a Phase 3+ concern.

---

## 2. Platform Fee Implementation

### Fee Structure

```
Buyer pays:  $X (tool price set by creator)
Stripe fee:  2.9% + $0.30 (standard US card processing)
Platform fee: 15% of tool price (launch default)
Creator receives: $X - Stripe fee - Platform fee
```

### Implementation Approach: `application_fee_amount`

Use Stripe's `application_fee_amount` on each PaymentIntent/Checkout Session. This is the standard Express Connect pattern:

```typescript
// When creating a Checkout Session for a tool purchase
const session = await stripe.checkout.sessions.create({
  mode: 'payment',
  line_items: [{
    price_data: {
      currency: 'usd',
      product_data: { name: tool.title },
      unit_amount: tool.priceInCents, // e.g., 500 = $5.00
    },
    quantity: 1,
  }],
  payment_intent_data: {
    application_fee_amount: Math.round(tool.priceInCents * 0.15), // 15% platform fee
    transfer_data: {
      destination: creator.stripeConnectAccountId,
    },
  },
  success_url: `${BASE_URL}/t/${tool.slug}?purchased=true`,
  cancel_url: `${BASE_URL}/t/${tool.slug}`,
});
```

### Fee Tiers (Future)

| Tier | Platform Fee | When |
|------|-------------|------|
| Standard (free creators) | 20% | Launch default |
| Pro ($14/mo subscribers) | 15% | Reduced fee as Pro perk |
| Enterprise | 10% | Negotiated |

Start at **15% flat** for simplicity. Introduce tiered fees when Pro subscriptions launch.

---

## 3. Marketplace Economics Model

### Unit Economics Per Transaction

Assumes standard US card processing: **2.9% + $0.30** Stripe fee.
Platform fee: **15%** (launch rate).

| Tool Price | Stripe Fee | Platform Fee (15%) | Creator Payout | Creator % | Platform Revenue |
|-----------|-----------|-------------------|----------------|-----------|-----------------|
| $1.00 | $0.33 | $0.15 | $0.52 | 52.0% | $0.15 |
| $2.00 | $0.36 | $0.30 | $1.34 | 67.0% | $0.30 |
| $3.00 | $0.39 | $0.45 | $2.16 | 72.1% | $0.45 |
| $5.00 | $0.45 | $0.75 | $3.80 | 76.1% | $0.75 |
| $10.00 | $0.59 | $1.50 | $7.91 | 79.1% | $1.50 |
| $25.00 | $1.03 | $3.75 | $20.23 | 80.9% | $3.75 |
| $50.00 | $1.75 | $7.50 | $40.75 | 81.5% | $7.50 |

**Key insight:** Tools priced below $2 are bad economics for creators (Stripe's $0.30 fixed fee eats margin). Recommend **$3 minimum price** for paid tools, or batch micro-transactions.

### Remix Royalties

When a remixed tool is sold, original creator gets 5-10% of the sale:

| Remix Sale Price | Stripe Fee | Platform Fee (15%) | Remix Royalty (7.5%) | Remix Creator Payout | Original Creator Royalty |
|-----------------|-----------|-------------------|---------------------|---------------------|------------------------|
| $5.00 | $0.45 | $0.75 | $0.38 | $3.43 | $0.38 |
| $10.00 | $0.59 | $1.50 | $0.75 | $7.16 | $0.75 |
| $25.00 | $1.03 | $3.75 | $1.88 | $18.35 | $1.88 |

Royalties come out of the creator's share, not the platform fee. Platform always gets its 15%.

### Pro Subscription Revenue Projections

| Metric | Month 1 | Month 3 | Month 6 | Month 12 |
|--------|---------|---------|---------|----------|
| Total users | 500 | 5,000 | 25,000 | 100,000 |
| Pro conversion rate | 2% | 3% | 4% | 5% |
| Pro subscribers | 10 | 150 | 1,000 | 5,000 |
| Pro MRR | $140 | $2,100 | $14,000 | $70,000 |
| Churn rate (monthly) | 15% | 10% | 8% | 6% |
| Net new Pro/mo | 10 | 45 | 80 | 250 |

### Marketplace Transaction Revenue Projections

| Metric | Month 1 | Month 3 | Month 6 | Month 12 |
|--------|---------|---------|---------|----------|
| Paid tools listed | 10 | 100 | 500 | 2,000 |
| Avg tool price | $5 | $7 | $8 | $10 |
| Transactions/month | 50 | 1,000 | 10,000 | 50,000 |
| GMV | $250 | $7,000 | $80,000 | $500,000 |
| Platform revenue (15%) | $38 | $1,050 | $12,000 | $75,000 |

### Break-Even Analysis

**Infrastructure cost estimates (monthly):**

| Service | Cost |
|---------|------|
| Vercel Pro | $20 |
| Cloudflare Workers (tool hosting) | $5 (scales with usage) |
| Neon PostgreSQL | $19 |
| Upstash Redis | $10 |
| Claude API (generation) | $500-2,000 (scales) |
| Monitoring (Grafana Cloud) | $0 (free tier) |
| Domain + misc | $10 |
| **Total fixed** | **~$564** |
| **Total at scale (Month 6)** | **~$3,000** |

**Break-even at launch:** ~$564/mo fixed costs. At 15% platform fee with avg $5 tools, need **~750 transactions/month** to cover infrastructure. Achievable by Month 2-3 with 500+ users.

### Combined Revenue Forecast

| Month | Pro MRR | Marketplace Rev | Boost Rev | Total MRR | Infra Cost | Net |
|-------|---------|----------------|-----------|-----------|-----------|-----|
| 1 | $140 | $38 | $0 | $178 | $564 | -$386 |
| 3 | $2,100 | $1,050 | $200 | $3,350 | $1,200 | +$2,150 |
| 6 | $14,000 | $12,000 | $2,000 | $28,000 | $3,000 | +$25,000 |
| 12 | $70,000 | $75,000 | $10,000 | $155,000 | $8,000 | +$147,000 |

---

## 4. Creator Onboarding Flow

### Flow Design

```
Creator taps "Start Selling" on their profile
    |
    v
[1] AgentDoom shows benefits screen:
    "Earn money from your tools. Set your price, we handle payments."
    - Platform fee disclosure: "AgentDoom takes 15% + Stripe processing fees"
    - Estimated earnings calculator (they enter price, see payout)
    |
    v
[2] "Connect with Stripe" button
    → Redirects to Stripe Express onboarding (OAuth flow)
    → Stripe collects: name, email, DOB, SSN last 4, bank account
    → Takes 3-5 minutes
    |
    v
[3] Stripe redirects back to AgentDoom with authorization code
    → Backend exchanges code for connected account ID
    → Stores stripeConnectAccountId on creator profile
    |
    v
[4] Creator sees "You're set up!" confirmation
    → Can now set prices on any of their tools
    → Sees "Earnings" tab on their profile
    |
    v
[5] First sale flow:
    → Buyer clicks "Buy $X" on a tool
    → Stripe Checkout (hosted page, PCI-compliant)
    → Payment processed, platform fee deducted
    → Creator sees earnings in Express Dashboard
    → Buyer gets access to tool
```

### Technical Implementation

**OAuth Connect Flow:**

```
GET https://connect.stripe.com/express/oauth/authorize?
  client_id={STRIPE_CONNECT_CLIENT_ID}&
  redirect_uri={BASE_URL}/api/stripe/connect/callback&
  state={csrf_token}&
  stripe_user[business_type]=individual&
  stripe_user[country]=US&
  suggested_capabilities[]=transfers&
  suggested_capabilities[]=card_payments
```

**Callback handler** (`/api/stripe/connect/callback`):
1. Exchange `code` for `stripe_user_id`
2. Store `stripe_user_id` as `stripeConnectAccountId` on creator record
3. Set `payoutsEnabled: true` on creator profile
4. Redirect to `/profile/settings?stripe=connected`

### Payout Schedule

- **Default:** Weekly (every Monday), 7-day rolling delay
- **Pro subscribers:** Daily payouts available, 2-day rolling delay
- **Minimum payout:** $10 (avoids micro-transfer fees)
- **Manual payouts:** Creators can request instant payout (Stripe charges $0.50-1.00)

---

## 5. Webhook Endpoints Needed

| Webhook Event | Endpoint | Purpose |
|--------------|----------|---------|
| `checkout.session.completed` | `/api/stripe/webhook` | Record purchase, grant buyer access |
| `payment_intent.succeeded` | `/api/stripe/webhook` | Confirm payment, trigger payout split |
| `payment_intent.payment_failed` | `/api/stripe/webhook` | Notify buyer, retry logic |
| `account.updated` | `/api/stripe/webhook` | Track creator account status changes |
| `account.application.deauthorized` | `/api/stripe/webhook` | Creator disconnected Stripe |
| `payout.paid` | `/api/stripe/webhook` | Track creator payouts for reporting |
| `payout.failed` | `/api/stripe/webhook` | Alert on failed payouts |
| `customer.subscription.created` | `/api/stripe/webhook` | Pro subscription activated |
| `customer.subscription.deleted` | `/api/stripe/webhook` | Pro subscription cancelled |
| `invoice.payment_failed` | `/api/stripe/webhook` | Pro subscription payment failed |

**Webhook security:** Verify all webhooks using `stripe.webhooks.constructEvent()` with the webhook signing secret.

---

## 6. API Keys & Config Needed

| Key | Purpose | Where |
|-----|---------|-------|
| `STRIPE_SECRET_KEY` | Server-side API calls | `.env.local` |
| `STRIPE_PUBLISHABLE_KEY` | Client-side Stripe.js | `.env.local` (public) |
| `STRIPE_CONNECT_CLIENT_ID` | OAuth Connect flow | `.env.local` |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification | `.env.local` |
| `STRIPE_CONNECT_WEBHOOK_SECRET` | Connect webhook verification | `.env.local` |

All keys to be provisioned in Stripe test mode first, then production keys when ready for launch.

---

## 7. Stripe Products to Create

| Product | Type | Price | Stripe Object |
|---------|------|-------|---------------|
| AgentDoom Pro | Subscription | $14/mo | Product + Price (recurring) |
| AgentDoom Enterprise Starter | Subscription | $99/mo | Product + Price (recurring) |
| AgentDoom Enterprise Growth | Subscription | $249/mo | Product + Price (recurring) |
| AgentDoom Enterprise Scale | Subscription | $499/mo | Product + Price (recurring) |
| Tool Boost (CPC) | One-time | $0.10-1.00/click | Product + metered Price |
| Tool Feature (daily) | One-time | $5-25/day | Product + Price |

Marketplace tool purchases are **dynamic** — each creator sets their own price, so these use `price_data` on checkout, not pre-created Stripe Prices.

---

## 8. Implementation Priorities

| Priority | Task | Owner | Depends On |
|----------|------|-------|-----------|
| P0 | Stripe Connect Express setup (test mode) | Ledger → Sama | Stripe account |
| P0 | Creator onboarding OAuth flow | Sama | Stripe Connect client ID |
| P0 | Checkout session creation for tool purchases | Sama | Connected accounts |
| P0 | Webhook handler (purchases + subscriptions) | Sama | Stripe webhook secret |
| P1 | Pro subscription product + checkout | Sama | Stripe products |
| P1 | Creator earnings dashboard | Sama | Webhook data flowing |
| P2 | Remix royalty splitting | Sama + Ledger | Remix chain tracking |
| P2 | Boost/featured placement billing | Sama + Ledger | Feed algorithm |
| P3 | Enterprise subscription tiers | Sama | Pro subscription working |
