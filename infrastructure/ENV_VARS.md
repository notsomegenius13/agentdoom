# AgentDoom — Required Environment Variables

## PostgreSQL (Neon)
- `DATABASE_URL` — Neon connection string (pooled)

## Redis (Upstash)
- `UPSTASH_REDIS_REST_URL` — Upstash REST endpoint
- `UPSTASH_REDIS_REST_TOKEN` — Upstash REST auth token

## Cloudflare Workers
- `CLOUDFLARE_API_TOKEN` — API token with Workers write access
- `CLOUDFLARE_ACCOUNT_ID` — Cloudflare account ID
- `KV_NAMESPACE_ID` — KV namespace for tool bundles

## Vercel (CI/CD)
- `VERCEL_TOKEN` — Vercel deploy token
- `VERCEL_ORG_ID` — Vercel org/team ID
- `VERCEL_PROJECT_ID` — Vercel project ID

## Setup Status
- [ ] Neon project created — set DATABASE_URL
- [ ] Upstash project created — set UPSTASH_REDIS_REST_URL + TOKEN
- [ ] Cloudflare account configured — set API_TOKEN + ACCOUNT_ID
- [ ] KV namespace created — set KV_NAMESPACE_ID
- [ ] Vercel project linked — set VERCEL_TOKEN + ORG_ID + PROJECT_ID
- [ ] All vars set on Vercel dashboard
- [ ] All secrets added to GitHub repo settings
