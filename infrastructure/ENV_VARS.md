# AgentDoom — Required Environment Variables

## PostgreSQL (Neon)
- `DATABASE_URL` — Neon connection string (pooled, used by all DB access and migration)
  - Neon project: `patient-river-67113495`

## Authentication (NextAuth)
- `NEXTAUTH_SECRET` — Secret for JWT signing (required; generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL` — Canonical app URL for redirects (e.g. `https://agentdoom.ai`)

## Stripe
- `STRIPE_SECRET_KEY` — Stripe secret key (server-side)
- `STRIPE_WEBHOOK_SECRET` — Webhook endpoint secret for verifying Stripe events
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — Stripe publishable key (client-side)
- `NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID` — Stripe price ID for Pro monthly plan
- `NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID` — Stripe price ID for Pro annual plan

## Claude / Anthropic
- `ANTHROPIC_API_KEY` — For Forge generation engine (auto-read by `@anthropic-ai/sdk`)

## Email (Resend)
- `RESEND_API_KEY` — Resend API key for transactional email
- `RESEND_FROM_EMAIL` — Sender address (e.g. `noreply@agentdoom.ai`)

## Redis (Upstash — rate limiting)
- `UPSTASH_REDIS_REST_URL` — Upstash REST endpoint
- `UPSTASH_REDIS_REST_TOKEN` — Upstash REST auth token

## App Config
- `NEXT_PUBLIC_BASE_URL` — Public base URL (e.g. `https://agentdoom.ai`)
- `AGENTDOOM_BASE_URL` — Server-side base URL (same as above, used in server code)
- `CRON_SECRET` — Bearer token protecting `/api/cron/*` routes
- `ADMIN_API_KEY` — Secret key protecting `/api/admin/*` routes

## Notifications
- `SLACK_REVENUE_WEBHOOK_URL` — Slack incoming webhook for revenue notifications (optional)

## Vercel (CI/CD — not needed at runtime)
- `VERCEL_TOKEN` — Vercel deploy token
- `VERCEL_ORG_ID` — Vercel org/team ID
- `VERCEL_PROJECT_ID` — Vercel project ID

## Cloudflare (deprecated — dropped per Nero, using Vercel edge instead)
- ~~`CLOUDFLARE_API_TOKEN`~~ — No longer used
- ~~`CLOUDFLARE_ACCOUNT_ID`~~ — No longer used
- ~~`CLOUDFLARE_KV_NAMESPACE_ID`~~ — No longer used

## Setup Status
- [x] Neon PostgreSQL provisioned — `patient-river-67113495`, DATABASE_URL in .env.local
- [x] DB schema deployed to Neon — all tables via `scripts/db-migrate.ts`
- [x] DATABASE_URL set on Vercel (production)
- [x] DNS: agentdoom.ai → Vercel (76.76.21.21) — confirmed working
- [x] GitHub repo created — `notsomegenius13/agentdoom`
- [x] CI/CD — Vercel auto-deploys on push (no GitHub Actions needed per Nero pivot)
- [x] `next build` exits 0 — verified 2026-04-03
- [ ] NEXTAUTH_SECRET set on Vercel production env
- [ ] NEXTAUTH_URL set on Vercel production env
- [ ] STRIPE_WEBHOOK_SECRET set on Vercel production env
- [ ] NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID set on Vercel
- [ ] NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID set on Vercel
- [ ] RESEND_API_KEY provisioned and set on Vercel
- [ ] CRON_SECRET set on Vercel
- [ ] ADMIN_API_KEY set on Vercel
- [ ] Redis/caching — Vercel KV or Upstash free tier (not yet provisioned)
- [ ] Vercel Git integration — connect GitHub repo to Vercel project for preview/development env vars
