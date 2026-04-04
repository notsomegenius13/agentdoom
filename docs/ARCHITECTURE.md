# AgentDoom — Technical Architecture

**Last updated:** 2026-04-02
**Domain:** agentdoom.ai
**Codebase:** `/Users/jarvis/agentdoom/`

---

## 1. System Overview

AgentDoom is a social platform where users create, deploy, share, and monetize software tools using natural language. The platform is designed around two core guarantees:

1. **Sub-5-second generation** — AI assembles pre-built component primitives (not arbitrary code) into deployed apps.
2. **Instant global deployment** — tools are served from Cloudflare's edge, zero cold starts.

---

## 2. High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                     Users / Browsers                                  │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
          ┌────────────────────▼──────────────────────┐
          │          Vercel Edge Network               │
          │         Next.js 14 (App Router)            │
          │                                            │
          │  ┌─────────────┐  ┌────────────────────┐  │
          │  │  Web UI     │  │  API Routes         │  │
          │  │  /feed      │  │  /api/generate      │  │
          │  │  /t/[slug]  │  │  /api/remix         │  │
          │  │  /dashboard │  │  /api/feed          │  │
          │  │  /create    │  │  /api/tools         │  │
          │  └─────────────┘  │  /api/stripe        │  │
          │                   │  /api/profile  ...  │  │
          │  Edge Middleware   └────────────────────┘  │
          │  (IP rate limit, auth guard, CSP)          │
          └────────────────────┬──────────────────────┘
                               │
          ┌────────────────────▼──────────────────────┐
          │              Shield Layer                  │
          │  Input Validator → Prompt Filter           │
          │  Rate Limiter (Edge + Upstash Redis)       │
          │  Output Scanner → Trust & Safety           │
          └────────────────────┬──────────────────────┘
                               │
          ┌────────────────────▼──────────────────────┐
          │              Forge Engine                  │
          │         lib/forge/pipeline.ts              │
          │                                            │
          │  Cache Lookup (prompt similarity)          │
          │       ↓ miss                               │
          │  [1] Classify (Haiku, ~50ms)               │
          │       ↓                                    │
          │  [2] Generate config (Sonnet/Opus, ~3-5s)  │
          │       ↓                                    │
          │  [3] Assemble (primitives → HTML bundle)   │
          │       ↓                                    │
          │  [4] Validate (syntax/render/mobile)       │
          │       ↓                                    │
          │  [5] Moderate (content safety scan)        │
          │       ↓                                    │
          │  [6] Deploy → Cloudflare Workers KV        │
          └────────────────────┬──────────────────────┘
                               │
     ┌─────────────────────────┼──────────────────────┐
     ▼                         ▼                      ▼
┌──────────┐          ┌──────────────┐        ┌──────────────┐
│  Neon DB │          │ Cloudflare   │        │  Upstash     │
│ (Postgres│          │ Workers KV   │        │  Redis       │
│ primary) │          │ Tool HTML    │        │  (cache +    │
│          │          │ bundles,     │        │   rate limit │
│ users    │          │ served at    │        │   + feed     │
│ tools    │          │ /t/[slug]    │        │   ranking)   │
│ runs     │          └──────────────┘        └──────────────┘
│ purchases│
│ feed_    │
│  events  │
└──────────┘
```

---

## 3. Component Breakdown

### 3.1 Frontend — Next.js 14 App Router

**Location:** `app/`

| Route | Description |
|-------|-------------|
| `/` | Landing page with hero + CTA |
| `/feed` | TikTok-style scrollable tool feed |
| `/create-tool` | Natural language tool creation UI |
| `/t/[slug]` | Individual tool page (uses + share + remix CTA) |
| `/remix` | Remix interface (modify existing tool via prompt) |
| `/dashboard` | Creator dashboard (tools, earnings, analytics) |
| `/marketplace` | Browse and purchase paid tools |
| `/profile` | Creator profile pages |
| `/pricing` | Pro subscription plans |
| `/checkout` | Stripe-powered purchase flow |
| `/admin` | Admin moderation dashboard |

**Middleware** (`middleware.ts`): Runs at Vercel Edge before all requests.
- Sliding-window IP rate limiter (60 req/min; in-memory Map with 10k entry cap)
- Auth guard for protected routes
- CSP headers
- Delegates per-user limits to Upstash Redis in route handlers

### 3.2 Forge Engine — Generation Pipeline

**Location:** `lib/forge/`

The single entry point is `pipeline.ts:runPipeline()`. It orchestrates six sequential stages with SSE progress events emitted at each stage.

#### Stage 0 — Cache Lookup (`cache.ts`)
- Bag-of-words TF-IDF similarity against pre-optimized prompt templates
- Threshold ~80% similarity → returns cached config instantly (sub-1s)
- No external dependency; pure in-memory matching

#### Stage 1 — Classify (`classify.ts`)
- **Model:** Claude Haiku
- **Latency:** ~50ms | **Cost:** ~$0.001
- Outputs: `category`, `complexity` (simple/standard/complex), `complexityScore` (1–10), `primitives[]`, `estimatedTimeMs`, `estimatedCostCents`

**Complexity scoring factors:**
| Factor | Score |
|--------|-------|
| Primitive count | +1 per primitive |
| State complexity | 0–3 |
| Layout complexity | 0–2 |
| Interaction depth | 0–3 |
| Data requirements | 0–3 |
| Custom logic | 0–2 |

**Model selection by complexity:**
- Score 1–6 → Sonnet
- Score 7–10 → Opus

#### Stage 2 — Generate (`generate.ts`)
- **Model:** Sonnet (standard) or Opus (complex)
- **Latency:** 3–5s | **Cost:** ~$0.05–0.10
- Receives: primitive schemas + user prompt + styling prefs
- Returns: JSON `ToolConfig` — a structured configuration object wiring primitives together

#### Stage 3 — Assemble (`assemble.ts`)
- Reads classified `primitives[]` from `primitives/` directory
- Instantiates each primitive with its config slice from `ToolConfig`
- Produces a self-contained HTML bundle (no external dependencies)
- Output is a single deployable file

#### Stage 4 — Validate (`validate.ts`)
- **Stages:** `syntax` → `render` → `interaction` → `mobile`
- **Viewports tested:** 375px (iPhone SE), 390px (iPhone 14), 768px (iPad), 1024px (Desktop)
- On failure: auto-retry once with error context fed back to Sonnet
- On second failure: graceful error returned to user with rephrased suggestion

```typescript
type ValidationStage = 'syntax' | 'render' | 'interaction' | 'mobile'
type StageVerdict = 'pass' | 'fail' | 'skip'
```

#### Stage 5 — Moderate (`moderate.ts` + `lib/shield/output-scanner.ts`)
- Scans assembled output for harmful content, phishing patterns, malware indicators
- Risk score 0–100; threshold triggers auto-block + escalation to admin queue
- Logged in `moderation_logs` table

#### Stage 6 — Deploy (`deploy.ts`)
- Uploads HTML bundle to **Cloudflare Workers KV**
- KV key format: `tool:{slug}`
- Slug format: `t-{timestamp36}-{random4}`
- Tool served at: `agentdoom.ai/t/{slug}` via `workers/tool-runtime`
- Deploy target: `CLOUDFLARE_KV_NAMESPACE_ID`

### 3.3 Primitive Library

**Location:** `primitives/`

50+ pre-built, tested React components. Each primitive:
- Renders correctly on iOS Safari, Android Chrome, Desktop Chrome/Firefox/Safari
- Loads in under 100ms
- Meets WCAG AA accessibility
- Accepts a JSON config schema that Forge uses to configure it

| Category | Primitives |
|----------|-----------|
| Data Input | `form`, `wizard-form`, `file-upload`, `poll`, `quiz`, `calendar` |
| Data Display | `table`, `card-grid`, `list`, `stats-dashboard`, `chart`, `kanban-board`, `data-explorer` |
| Calculators | `calculator`, `split-calculator`, `converter`, `counter-up` |
| Trackers | `tracker`, `timer`, `progress-bar`, `progress-fill` |
| Generators | `generator`, `template-renderer` |
| Commerce | `price-list`, `pricing-table`, `stripe-checkout` |
| Content | `checklist`, `slide-reveal`, `tabs`, `modal`, `accordion` |
| UX | `search`, `toast`, `confetti`, `typing-effect`, `landing-hero`, `interactive-demo` |
| Layout | `dashboard-layout`, `settings-panel`, `map-view`, `media-player`, `project-board` |

### 3.4 Shield — Trust & Safety Layer

**Location:** `lib/shield/`

| Module | Responsibility |
|--------|---------------|
| `input-validator.ts` | Body size check, prompt length, content-type validation |
| `prompt-filter.ts` | Pre-generation prompt screening for disallowed content |
| `rate-limiter.ts` | Multi-tier rate limits (anonymous 3/hr, free 10/hr, pro 100/hr, IP 60/min) |
| `output-scanner.ts` | Post-generation HTML/JS scanning for malicious patterns |
| `report-handler.ts` | User report triage: auto-block, escalate, dismiss |
| `tos.ts` | Terms of service enforcement utilities |

Rate limit tiers:

| Tier | Limit | Storage |
|------|-------|---------|
| Anonymous (IP) | 3 generations/hour | Upstash Redis |
| Free user | 10 generations/hour | Upstash Redis |
| Pro user | 100 generations/hour | Upstash Redis |
| IP abuse (Edge) | 60 API calls/min | Edge in-memory Map |
| Admin | Unlimited | — |

### 3.5 Feed Engine

**Location:** `lib/feed/`

| Module | Responsibility |
|--------|---------------|
| `ranking.ts` | Precomputes `tool_ranking_scores` (score, trending, freshness, engagement, creator) |
| `tracker.ts` | Writes `feed_events` (view, use, remix, share, like, purchase, deploy) |
| `types.ts` | Shared feed type definitions |

Feed ranking is precomputed by a cron job (`app/api/cron/`) and stored in `tool_ranking_scores`. The feed API reads precomputed scores rather than computing on request.

### 3.6 Workers — Cloudflare Edge Runtime

**Location:** `workers/tool-runtime/`

The tool-runtime Cloudflare Worker:
- Receives all requests to `agentdoom.ai/t/*`
- Looks up the HTML bundle from Workers KV by slug
- Serves the bundle with appropriate caching headers
- Zero cold starts (Worker stays warm at Cloudflare's edge globally)

### 3.7 Stripe Integration

**Location:** `lib/stripe/`, `app/api/stripe/`

- **Stripe Connect** for creator payouts (creators onboard as connected accounts)
- Platform takes 15–20% of each transaction
- Webhook-driven; idempotent event handling
- `purchases` and `stripe_transfers` tables track transaction state
- Pro subscription managed via Stripe Subscriptions

---

## 4. Database Schema — Neon PostgreSQL

**Location:** `lib/db/schema.ts`

| Table | Purpose |
|-------|---------|
| `users` | User accounts, Clerk ID, Stripe account/customer IDs, pro status |
| `tools` | Deployed tools — slug, prompt, creator, category, pricing, engagement counters |
| `tool_configs` | Versioned JSON config generated by Forge for each tool |
| `generations` | Audit log of every generation attempt (cost, latency, success/fail) |
| `primitives` | Primitive component registry (schema, version, usage stats) |
| `purchases` | Marketplace transactions (buyer, seller, amount, platform fee) |
| `stripe_transfers` | Stripe Connect payout records |
| `follows` | Creator follow graph |
| `moderation_logs` | Automated content scan results |
| `reports` | User-submitted reports on tools |
| `curated_collections` | Editorial collections for feed injection |
| `feed_events` | Engagement events (view, use, remix, share, like, purchase) |
| `tool_ranking_scores` | Precomputed feed ranking scores per tool |
| `featured_tools` | Tool of the Day selections |
| `waitlist` | Pre-launch email signups |

**Key indexes:**
- `tools(status, created_at DESC)` — primary feed query
- `feed_events(event_type, created_at DESC)` — trending calculation
- `generations(user_id)`, `generations(created_at DESC)` — cost/analytics queries
- `tools(creator_id)` — creator profile queries

---

## 5. API Endpoints

All routes live under `app/api/`.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/generate` | POST | Run Forge pipeline; streams SSE progress events |
| `/api/remix` | POST | Remix existing tool with new prompt delta |
| `/api/deploy` | POST | Manual deploy trigger (admin) |
| `/api/feed` | GET | Paginated ranked tool feed |
| `/api/tools` | GET/POST | List tools, create tool record |
| `/api/tools/[id]` | GET/PATCH/DELETE | Individual tool CRUD |
| `/api/profile` | GET/PATCH | User profile read/update |
| `/api/user` | GET | Authenticated user data |
| `/api/auth` | — | Auth callbacks (Clerk/NextAuth) |
| `/api/stripe` | POST | Stripe webhook receiver |
| `/api/stripe/connect` | POST | Stripe Connect onboarding |
| `/api/creators` | GET | Creator leaderboard data |
| `/api/leaderboard` | GET | Public trending creators |
| `/api/stats` | GET | Platform-wide stats |
| `/api/moderate` | POST | Admin: manual moderation action |
| `/api/og` | GET | Dynamic OG image generation for tools |
| `/api/cron` | POST | Cron triggers (feed ranking recompute, featured tool selection) |
| `/api/health` | GET | Health check (DB + KV + AI connectivity) |
| `/api/waitlist` | POST | Email capture for waitlist |
| `/api/admin` | GET/POST | Admin panel operations |

### Generation Endpoint Detail

`POST /api/generate`

**Rate limits (enforced in handler):**
- Anonymous: 3/hr per IP
- Free user: 10/hr
- Pro user: 100/hr
- Admin: unlimited (via `Authorization` header bypass)

**Request:**
```json
{ "prompt": "string", "userId": "string|null", "isPro": "boolean" }
```

**Response:** Server-Sent Events stream with `PipelineEvent` frames, closing with `PipelineResult`:
```json
{
  "slug": "t-lx3k2a-r9f2",
  "url": "https://agentdoom.ai/t/t-lx3k2a-r9f2",
  "html": "<html>...",
  "classification": { "category": "calculator", "complexity": "simple", ... },
  "config": { ... },
  "validation": { "overallVerdict": "pass", "stages": [...] },
  "timing": { "classifyMs": 48, "generateMs": 3120, "totalMs": 4301, ... },
  "cacheHit": null
}
```

---

## 6. Authentication

**Primary:** Clerk (JWTs, session management, social login)
**Fallback:** NextAuth.js (Google OAuth — configured when Clerk keys are placeholder/absent)

Middleware detects which auth provider is configured at runtime and applies the appropriate guard.

---

## 7. Infrastructure Stack

| Layer | Service | Notes |
|-------|---------|-------|
| Frontend + API | Vercel (Next.js 14) | Edge functions, ISR, streaming |
| Tool hosting | Cloudflare Workers + KV | Global CDN, zero cold start |
| Database | Neon PostgreSQL | Serverless, connection pooling via PgBouncer |
| Cache + Queue | Upstash Redis | Serverless Redis; BullMQ for async jobs |
| AI | Anthropic Claude API | Haiku (classify) + Sonnet/Opus (generate) |
| Payments | Stripe Connect | Marketplace + Pro subscriptions |
| Auth | Clerk | User management, JWTs |
| Email | (Resend — planned) | Transactional notifications |
| Monitoring | (Grafana + Prometheus — planned) | P50/P95/P99 latency, error rate alerts |

---

## 8. Key Data Flows

### Tool Generation Flow

```
User submits prompt
    │
    ▼
Edge Middleware (IP rate limit check)
    │
    ▼
POST /api/generate
    │
    ├─ Body size check (Shield: input-validator)
    ├─ IP rate limit (Shield: rate-limiter via Upstash)
    ├─ User tier rate limit (free/pro/anonymous)
    ├─ Prompt screening (Shield: prompt-filter)
    │
    ▼
Forge: pipeline.runPipeline()
    │
    ├─ [0] Cache lookup (prompt similarity → instant return if hit)
    ├─ [1] Classify (Haiku, 50ms)
    ├─ [2] Generate ToolConfig (Sonnet/Opus, 3-5s)
    ├─ [3] Assemble HTML bundle from primitives
    ├─ [4] Validate (syntax → render → interaction → mobile)
    │       └─ retry once on failure with error context
    ├─ [5] Moderate (output-scanner, risk score)
    └─ [6] Deploy to Cloudflare Workers KV
    │
    ▼
Return PipelineResult → write tool + generation records to Neon
    │
    ▼
User receives: tool URL (agentdoom.ai/t/{slug})
```

### Feed Ranking Flow

```
User engagement event (view/use/remix/share/like)
    │
    ▼
Feed tracker writes to feed_events (Neon)
    │
    ▼
Cron job (/api/cron, every N minutes)
    │
    ▼
ranking.ts recomputes tool_ranking_scores
  - trending_score: weighted recent events
  - freshness_score: decay function on age
  - engagement_score: normalized engagement rate
  - creator_score: creator reputation factor
  - score: composite
    │
    ▼
/api/feed reads tool_ranking_scores (precomputed)
    │
    ▼
Feed UI serves ranked, paginated tool cards
```

### Tool Purchase Flow

```
Buyer taps "Buy" on paid tool ($1–50)
    │
    ▼
POST /api/stripe/checkout (create Stripe PaymentIntent)
    │
    ▼
Stripe processes payment
    │
    ▼
POST /api/stripe (webhook: payment_intent.succeeded)
    │
    ▼
Write purchase record to Neon
Platform retains 15–20% fee
Creator payout via Stripe Connect transfer
```

---

## 9. Viral Distribution Architecture

Every deployed tool at `agentdoom.ai/t/{slug}` includes:
- **OG meta tags** (generated by `/api/og`): tool name, screenshot, creator, "Tap to use — or make your own"
- **"Built with AgentDoom" footer** with "Make your own version" CTA
- **One-tap remix**: tapping CTA pre-populates the create-tool page with the original prompt
- **Embed code**: iframe snippet for Notion, Substack, newsletters

Remix lineage is tracked via `tools.remixed_from` (self-referential FK), enabling remix chain analytics and potential royalty splits.

---

## 10. Monetization Architecture

| Stream | Mechanism | Platform Cut |
|--------|-----------|-------------|
| Marketplace transactions | Stripe Connect, creator sets $1–50 price | 15–20% |
| Pro subscription | Stripe Subscriptions, $14/mo | 100% |
| Boost / featured placement | CPI/CPC model (planned) | 100% |
| Enterprise | Team workspaces, API access (planned) | 100% |
| Remix royalties | Original creator share on remixed paid tool sales | Platform takes standard cut |

---

## 11. Security Considerations

- **Prompt injection:** Shield `prompt-filter.ts` screens inputs pre-generation; `output-scanner.ts` scans assembled HTML/JS post-generation
- **Rate limiting:** Multi-layer (edge in-memory + Upstash Redis per user/IP)
- **Content moderation:** Automated risk scoring + admin escalation queue; user reports feed into `reports` table
- **Tool isolation:** Each tool is a static HTML bundle served from Workers KV — no server-side execution, no access to platform context
- **Payments:** Stripe handles all PCI scope; platform never touches raw card data
- **Auth:** Clerk manages sessions and JWTs; middleware enforces route guards

---

## 12. Related Docs

- [`FORGE_ENGINE_SPEC.md`](./FORGE_ENGINE_SPEC.md) — Detailed Forge generation engine spec
- [`TRUST_SAFETY_SPEC.md`](./TRUST_SAFETY_SPEC.md) — Trust & safety policies and moderation flows
- [`stripe-connect-architecture.md`](./stripe-connect-architecture.md) — Stripe Connect payout architecture
- [`primitive-library-mvp-gap-audit-2026-04-01.md`](./primitive-library-mvp-gap-audit-2026-04-01.md) — Primitive library gap analysis
- [`PROJECT_DOOM_MASTER_SPEC.md`](../PROJECT_DOOM_MASTER_SPEC.md) — Top-level product specification
