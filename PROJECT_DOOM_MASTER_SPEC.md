# PROJECT DOOM — Master Build Specification v3.0
# AgentDoom.ai: The TikTok of AI-Built Software
# Classification: INTERNAL — Nero Agent System

---

## 0. EXECUTIVE SUMMARY

AgentDoom is a social platform where anyone can build, deploy, share, and monetize software tools using natural language — without writing code. Users scroll a TikTok-style feed of live tools, tap "Remix" to customize with plain English, and deploy in under 10 seconds. The output is a standalone web app with its own URL. Users can sell their tools; AgentDoom takes 15-20% of every transaction.

**The moat is distribution, not generation.** Generation quality improves automatically as AI models improve. The feed, the viral sharing mechanics, the remix chains, and the marketplace liquidity — those compound and are defensible.

**Domain:** agentdoom.ai (purchased, Namecheap account peterjarvis477)
**Codebase:** /Users/jarvis/agentdoom/
**Deploy:** Vercel (main platform) + Cloudflare Workers (tool hosting)

---

## 1. WHAT MAKES THIS DIFFERENT (for agents reading this spec)

This is NOT another code generation tool. Read this carefully:

| Competitor | What they do | Why AgentDoom wins |
|-----------|-------------|-------------------|
| v0.dev | Generates UI components for developers | AgentDoom generates DEPLOYED, WORKING apps for normies. No code ever shown. |
| Bolt.new | Full-stack AI dev environment | Single-player creation tool. AgentDoom is a SOCIAL PLATFORM where creation IS content. |
| Lovable.dev | AI app builder | Monetizes via subscriptions. AgentDoom monetizes via marketplace transactions — scales with usage, not seats. |
| Replit Agent | AI coding assistant | Developer-focused IDE. AgentDoom is TikTok — normies scroll, tap, remix, deploy. |

**The key insight:** Those tools compete on generation quality. AgentDoom competes on DISTRIBUTION. Quality is table stakes. Distribution is the moat.

---

## 2. THE FIVE NON-NEGOTIABLES

These must be bulletproof or the platform dies. Everything else is negotiable.

### 2.1 Generation Quality (95%+ first-attempt success rate)

**Architecture: Component Primitives (LEGO, not clay)**

The AI does NOT generate arbitrary React code. It assembles pre-built, battle-tested component primitives from a library. Each primitive is a self-contained, tested, responsive React component that accepts a configuration object.

**The generation flow:**
```
User prompt
    ↓
Haiku classifies intent (50ms, ~$0.001)
  → category, complexity score, primitives needed
    ↓
Sonnet receives: primitive schemas + user prompt + styling prefs (3-5s, ~$0.05-0.10)
  → returns configuration object wiring primitives together
    ↓
Runtime assembles configured primitives into single-page React app
    ↓
Validation pipeline: syntax → render → interaction → mobile (< 1s)
    ↓
Deploy to Cloudflare Workers → generate URL → return to user
```

**Primitive Library (V1 — 50+ components, 7 categories):**

| Category | Primitives | Example Tools |
|----------|-----------|---------------|
| **Data Input** | Form, Multi-step form, Survey, Quiz, Poll, File uploader, Date picker | Contact forms, questionnaires, feedback collectors |
| **Data Display** | Table, Card grid, List, Stats dashboard, Chart (bar/line/pie), Timeline, Kanban | CRM views, expense trackers, project dashboards |
| **Calculators** | Basic calculator, Formula engine, Split calculator, Converter, Estimator, Scorer | Tip splitters, mortgage calculators, ROI estimators |
| **Trackers** | Habit tracker, Streak counter, Goal tracker, Timer (pomodoro/countdown), Progress bar | Fitness trackers, study timers, habit apps |
| **Generators** | Text generator (AI-powered), List generator, Random picker, Template filler, Bio writer | Bio generators, content idea tools, email drafters |
| **Commerce** | Price list, Order form, Invoice template, Booking calendar, Tip jar, Payment button | Service pricing pages, booking tools, invoice generators |
| **Content** | Markdown renderer, Slide deck, Flashcard set, Checklist, Recipe card, Guide/tutorial | Study guides, recipe tools, checklists |

**Each primitive MUST:**
- Render correctly on iOS Safari, Android Chrome, and desktop Chrome/Firefox/Safari
- Handle edge cases: empty data, long text, rapid input, offline state
- Load in under 100ms
- Meet WCAG AA accessibility standards
- Have comprehensive test coverage
- Accept a JSON configuration schema that Forge uses to customize it

**Automated validation pipeline (runs on EVERY generated tool):**
1. Syntax check — does the assembled code parse?
2. Render test — does it display without React errors?
3. Interaction test — do buttons, inputs, and state changes work?
4. Mobile responsiveness — passes at 375px, 390px, 768px, 1024px viewports
5. If any step fails → auto-retry with error context
6. If second attempt fails → graceful fallback with rephrased suggestion to user

### 2.2 Speed (Sub-5-Second Generation)

- Pre-compiled primitive library — AI configures, doesn't generate from scratch
- Streaming generation with progressive rendering — user sees tool "building itself"
- Edge deployment via Cloudflare Workers — <1s deploy time, zero cold starts
- Warm model connections — persistent Claude API connections, pre-allocated inference
- Haiku for classification (50ms) → Sonnet for generation (3-5s)

### 2.3 Sharing (Zero-Friction Viral Distribution)

Every tool gets a clean URL: `agentdoom.ai/t/[slug]`

**Required viral mechanics:**
- Rich link previews (OG meta tags): tool name, screenshot, creator name, "Tap to use — or make your own"
- One-tap remix from shared links: recipient opens tool → uses it → "Make your own version" → remix → deploy
- Embed anywhere: iframe embed code for Notion, Substack, personal sites, email newsletters
- Apple App Clips (Phase 3): shared links trigger instant native experience on iOS, no download
- "Built with AgentDoom" footer + "Make your own" CTA on every tool page

**The viral loop:**
```
User A creates tool → shares link
    ↓
User B taps link → uses tool → sees "Make your own version"
    ↓
User B types remix → gets own tool → deploys → shares
    ↓
User C receives link → uses → remixes → shares
    ↓
Each node = potential paying customer or creator
```

### 2.4 Monetization (Platform Tax on User-Generated Software)

**Revenue streams:**
1. **Platform fee (15-20%)** — every creator-to-buyer transaction. Creator sets price ($1-50), buyer pays, AgentDoom takes cut via Stripe Connect.
2. **Pro subscription ($14/mo)** — unlimited tools, remove branding, custom domains, analytics, priority generation, premium primitives.
3. **Boost / featured placement** — creators pay for feed prominence. CPI or CPC model.
4. **Enterprise ($99-499/mo)** — team workspaces, shared libraries, SSO, API access.
5. **Remix royalties** — if someone remixes a paid tool and sells it, original creator gets 5-10%.

### 2.5 Infrastructure (Built for 100x Viral Spike)

| Layer | Technology | Scaling Strategy |
|-------|-----------|-----------------|
| Frontend | Next.js 14 on Vercel Edge | Static generation + ISR + edge caching |
| API | Node.js on Railway/Fly.io (multi-region) | Stateless, auto-scale on queue depth |
| Generation Queue | BullMQ + Redis | Worker pool, auto-scale, backpressure UI |
| AI Layer | Claude API (Haiku/Sonnet/Opus) + GPT-4o fallback | Rate-limit aware, circuit breaker at 10s |
| Tool Runtime | Cloudflare Workers (static React bundles) | Global CDN, zero cold start, $0.50/M requests |
| Database | PostgreSQL (Neon/Supabase) + read replicas | PgBouncer pooling, separate analytics DB |
| Cache | Redis (Upstash serverless) | Feed rankings 60s, tool metadata 5min |
| Payments | Stripe Connect | Webhook-driven, idempotent, separate service |
| Monitoring | Grafana + Prometheus + PagerDuty | P50/P95/P99 latency, error rate alerts |

---

## 3. AGENT ROSTER

### 3.1 Existing Agents (Reassigned)

| Agent | AgentDoom Role | Week 1 Deliverable |
|-------|---------------|-------------------|
| **Sama** | Engineering Lead — owns frontend (Next.js), API layer, system architecture | Initialize repo. Next.js + Tailwind + Framer Motion. Feed UI scaffold. Single-screen generation flow. |
| **Atlas** | Research — competitive intel, user research, community feedback, trend analysis | Competitive teardown of v0/Bolt/Lovable/Replit. Top 30 tool ideas ranked by normie demand. |
| **Echo** | GTM / Distribution — pre-launch hype, social content, creator community, influencer seeding | Waitlist landing page at agentdoom.ai. Launch tweet thread draft. 30 seed influencers identified. |
| **Sentinel** | QA / Reliability — automated testing, cross-device testing, performance, security, abuse detection | Build tool validation pipeline: syntax → render → interaction → mobile tests. |
| **Ledger** | Rev Ops / Finance — Stripe, marketplace transactions, creator payouts, revenue analytics | Set up Stripe Connect for marketplace. Revenue dashboard skeleton. |
| **Scraps** (renamed **Grunt** for this project) | DevOps / Infra — CI/CD, Cloudflare Workers, DB provisioning, DNS, monitoring, auto-scaling | Cloudflare + PostgreSQL + Redis provisioned. CI/CD pipeline. DNS for agentdoom.ai. |

### 3.2 New Agents to Spawn

**FORGE — The Generation Engine (MOST CRITICAL AGENT)**
- Model stack: Haiku (intent, 50ms) → Sonnet (generation, 3-5s) → Opus (complex tools, 8-15s)
- Core loop: prompt → classify → select primitives → generate config → assemble → validate → deploy
- Target: 95%+ first-attempt success rate
- Learning: log every generation, cache common patterns, build prompt→config cache

**LEGO — The Primitive Library Agent**
- Builds, tests, and maintains every component primitive
- Initial: 15 core primitives (Week 1), expand to 50+ (Week 4)
- Quality bar: renders on iOS Safari + Android Chrome + desktop, handles edge cases, loads <100ms, WCAG AA
- Defines config schemas that Forge consumes

**FLUX — The Feed & Discovery Agent**
- V1 (launch): curated + chronological
- V2 (week 4): engagement signals (remix rate, share rate, purchase rate)
- V3 (week 8): collaborative filtering, category affinity, industry detection
- Feed must feel alive: trending hourly, "just shipped" real-time section

**VAULT — The Marketplace & Payments Agent**
- Stripe Connect: creators as connected accounts, 15-20% platform fee
- Pricing intelligence: suggest prices based on category/complexity/comparables
- Fraud detection: fake purchases, clone-and-sell, payment fraud flagging

**SHIELD — The Trust & Safety Agent**
- Auto-scan every tool via Haiku before going live: harmful content, copyrighted material, phishing, NSFW
- Creator verification: identity + 10 tools + 4+ star ratings + no violations = verified badge
- Reporting system: one-tap report → auto-triage → human escalation for edge cases

---

## 4. MULTI-SURFACE PLATFORM STRATEGY

### Surface 1: Web App (Day 1 — Universal)
- Next.js PWA, mobile-first responsive
- Every tool = standalone web page at `agentdoom.ai/t/[slug]`
- Push notifications via Web Push API (iOS 16.4+)
- OG meta tags for rich link previews
- Embed code generation for Notion/Substack/personal sites

### Surface 2: Capacitor Native App (Week 5-6)
- Same codebase wrapped in native iOS/Android container
- App Store + Google Play presence
- Apple Pay / Google Pay for marketplace
- Native push, haptics, smooth scrolling

### Surface 3: Apple App Clips (Week 6-7 — The Viral Weapon)
- Shared tool links trigger instant native experience (<15MB, loads in 2s)
- User can USE the tool AND remix it — no download
- "Get the full app" banner as seamless upsell
- Every shared tool = App Clip entry point

---

## 5. THE UX (from strategy-v2.jsx)

### The Core Metaphor: Building = Scrolling
The feed IS the IDE. You never "open a project." You're always already inside one.

**The atomic unit is a CARD.** Each card is a living, running micro-tool. Scrolling = browsing. Tapping = forking. Swiping = shipping.

### The Scroll Experience
Vertical feed of cards — each one is a working tool, running live. Each card shows:
- 5-second demo loop
- The prompt that built it
- "Remix" button
- Deploy/share action

### The Remix Flow (The Magic Moment)
1. TAP a card → see it running full-screen
2. Hit "REMIX" → natural language overlay appears
3. Type or speak: "Make this track my freelance invoices instead"
4. Watch the agent rebuild it in real-time (2-8 seconds)
5. One tap → DEPLOY to your profile, share link, or app store

**The user never sees code. Never sees a terminal. Never configures a server.**

### The Creator Profile
Grid of tools built/remixed. Other users browse, use, fork, or follow. Top creators become "Agent Builders" — the TikTok influencer equivalent where content IS functional software.

### Key UX Principles
1. ZERO to TOOL in under 10 seconds
2. NEVER show code — the agent is invisible infrastructure
3. EVERY interaction is shareable — building IS content creation
4. The feed learns you — scroll behavior trains recommendations
5. Sound & haptics matter — satisfying micro-feedback on deploy, like, remix

---

## 6. SEED TOOL CATEGORIES (MVP Feed — 20-30 tools)

Optimize for "I need that" recognition AND shareability:

| Category | Seed Tools |
|----------|-----------|
| **MONEY** | Invoice generator, tip calculator/splitter, freelance rate calculator, subscription tracker, expense categorizer |
| **PRODUCTIVITY** | Meeting notes summarizer, email template generator, habit tracker, weekly planner, pomodoro timer |
| **SOCIAL/FUN** | Bio generator, would-you-rather game, personality quiz builder, meme caption tool, zodiac compatibility checker |
| **CREATOR** | Thumbnail idea generator, content calendar, hashtag researcher, script outliner, tweet thread formatter |
| **BUSINESS** | NDA generator, contract template filler, pricing page builder, lead capture form, client onboarding checklist |

Each must be single-screen, genuinely useful, and dead simple.

---

## 7. MULTI-MODEL ROUTING STRATEGY

| Task | Primary | Fallback | Cost/Call | Latency Target |
|------|---------|----------|-----------|---------------|
| Intent classification | Claude Haiku | Gemini Flash | ~$0.001 | 50ms |
| Standard tool generation | Claude Sonnet | GPT-4o | ~$0.05-0.10 | 3-5s |
| Complex multi-primitive | Claude Opus | Claude Sonnet (retry) | ~$0.30 | 8-15s |
| Batch seed tool generation | OpenAI Codex | Claude Sonnet | ~$0.02 | Async |
| Content moderation | Claude Haiku | GPT-4o-mini | ~$0.001 | 200ms |
| Feed personalization | Lightweight ML | Claude Haiku | ~$0.0005 | 20ms |
| Rich link preview generation | Claude Haiku | Template-based | ~$0.001 | 100ms |

**Build the model abstraction layer on Day 1** — model swaps are a config change, not a rewrite. When Claude ships a better model, Forge updates one value and every tool gets better.

---

## 8. BUILD PHASES

### Phase 0: Validate the Core (Week 1-2)
**Goal:** One working generation flow. Prompt → working tool → URL. Nothing else.

| Agent | Task |
|-------|------|
| Sama | Next.js app: prompt input → streaming preview → deploy button. No feed, no profiles, no marketplace. |
| Forge (spawn) | Generation pipeline: prompt → Haiku intent → Sonnet config → assembly → deploy |
| Lego (spawn) | First 15 primitives with full test coverage |
| Grunt | Cloudflare Workers deploy pipeline. PostgreSQL + Redis. CI/CD. |
| Sentinel | Validation pipeline: syntax → render → interaction → mobile |
| Atlas | Top 30 tool ideas. Competitive teardown. |

**Success:** 20 different tools from prompts. 90%+ render correctly. Avg generation < 8s.

### Phase 1: Feed + Sharing (Week 3-4)
**Goal:** Scrollable feed. Remix flow. Shareable URLs. User accounts.

| Agent | Task |
|-------|------|
| Sama | Vertical scroll feed. Remix overlay. User profiles. Auth (Clerk: Google/Apple). |
| Forge | Remix pipeline: existing config + modification prompt → new config → new tool (2-3s) |
| Lego | Expand to 30+ primitives. Commerce primitives. |
| Flux (spawn) | Feed ranking v1: curated + engagement signals. Trending. "Just shipped." |
| Echo | Waitlist page live. Demo videos. Influencer outreach begins. |
| Grunt | OG meta tags for every tool page. Embed code generation. |

**Success:** End-to-end: browse → remix → deploy → share → recipient remixes. 50+ tools in feed.

### Phase 2: Marketplace + Native (Week 5-6)
**Goal:** Users price and sell tools. Capacitor native app. Soft launch to 500.

| Agent | Task |
|-------|------|
| Vault (spawn) | Stripe Connect. Creator onboarding. Buyer checkout. Platform fee. Creator payouts. |
| Sama | Capacitor wrapper. Submit to App Store + Google Play. Apple Pay. |
| Ledger | Revenue analytics. Unit economics. Creator earnings reports. |
| Shield (spawn) | Content moderation pipeline. Auto-scan. Reporting. Creator verification. |
| Echo | Soft launch to 500. Daily "Tool of the Day." Creator onboarding guides. |
| Sentinel | Load test 10K concurrent. Cross-platform Capacitor testing. Payment flow testing. |

**Success:** First creator-to-buyer transaction. App approved. 500 users. 200+ tools.

### Phase 3: App Clips + Scale (Week 7-8)
**Goal:** All three surfaces live. Viral coefficient > 0.7. First $10K GMV.

| Agent | Task |
|-------|------|
| Sama | App Clip target. Associated Domains. Smart App Banners. Lightweight remix in <15MB. |
| Flux | Feed algorithm v2: personalized. A/B testing framework. |
| Echo | Full launch push. Creator spotlights. Community Discord. Creator referral program. |
| Forge | Quality improvements from 6 weeks of data. Cache common patterns. Sub-4s generation. |
| Lego | 50+ primitives. Community-submitted primitives (reviewed). |
| Grunt | Infrastructure hardened for 100x. All monitoring. Auto-scaling tested. |

**Success:** Viral coefficient > 0.7. App Clip → install > 15%. $10K GMV. Three surfaces stable.

---

## 9. NERO INTEGRATION

AgentDoom is standalone but connects to Nero at defined interfaces:

- **Slack:** All agents report to #agentdoom channel. Kosta manages via phone.
- **Claude Code:** Sama and Forge accept direct commands on Mac Mini.
- **Paperclip:** Orchestrates all agent sessions with heartbeats and health checks.
- **OpenClaw:** Provides agentic loop infrastructure for Forge, Flux, Vault, Shield.

**The Nero Flywheel:** AgentDoom is the top-of-funnel. Normie discovers simple tool → uses → remixes → outgrows it → upgrades to full Nero product. Every Nero product launch gets instant distribution through the AgentDoom feed.

---

## 10. RISK REGISTER

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Generation quality too low | CRITICAL | Component primitive system. Constrained generation. 95%+ success. Validation pipeline. |
| Generation too slow (>10s) | CRITICAL | Pre-built primitives = config not code. Streaming render. Warm connections. Queue + progress UI. |
| Viral spike crashes infra | HIGH | Edge-deployed tools on Cloudflare CDN. Queue absorbs generation spikes. Existing tools always fast. |
| Nobody monetizes/sells | HIGH | Seed marketplace with 50+ paid tools from Nero agents. Showcase earnings. Suggest pricing. |
| Competitors copy model | HIGH | Distribution is moat. Network of creators, social feed, remix chains, marketplace liquidity compound. |
| Apple rejects native app | MEDIUM | Web app always works as fallback. Capacitor = standard native. Follow App Store guidelines. |
| Claude API outage | MEDIUM | Multi-model fallback (GPT-4o). Queue during outage. Serve cached popular tools. Never blank screen. |
| Fraud/abuse at scale | MEDIUM | Shield auto-moderates every tool. Haiku content scan. Creator verification. Reporting + escalation. |

---

## 11. TECHNICAL DECISIONS (PRE-MADE — do not debate these)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | Next.js 14 (App Router) | Same stack as all Nero projects. Vercel native. |
| Styling | Tailwind CSS + Framer Motion | Fast dev, consistent design, smooth animations. |
| Auth | Clerk (Google/Apple OAuth) | Best DX, handles MFA, social logins, user management. |
| Database | PostgreSQL via Neon | Serverless, auto-scales, branching for dev. |
| Cache | Redis via Upstash | Serverless, global, pay-per-request. |
| Tool Hosting | Cloudflare Workers | Zero cold start, global CDN, $0.50/M requests. |
| Payments | Stripe Connect | Industry standard for marketplaces. |
| AI Primary | Claude Sonnet | Best code generation quality. |
| AI Classifier | Claude Haiku | Fastest, cheapest classification. |
| Native Wrapper | Capacitor | Same codebase, zero rewrite, full native access. |
| Monitoring | Grafana + Prometheus | Industry standard. Open source. |
| CI/CD | GitHub Actions → Vercel | Automatic deploys on push to main. |

---

## 12. DIRECTORY STRUCTURE

```
/Users/jarvis/agentdoom/
├── PROJECT_DOOM_MASTER_SPEC.md    ← this file
├── app/                           ← Next.js App Router
│   ├── page.tsx                   ← Landing page / waitlist
│   ├── feed/page.tsx              ← The TikTok-style feed
│   ├── t/[slug]/page.tsx          ← Individual tool pages
│   ├── remix/page.tsx             ← Remix overlay
│   ├── profile/[username]/page.tsx ← Creator profiles
│   ├── marketplace/page.tsx       ← Browse paid tools
│   ├── api/
│   │   ├── generate/route.ts      ← Forge: prompt → tool
│   │   ├── remix/route.ts         ← Forge: modify existing tool
│   │   ├── deploy/route.ts        ← Deploy to Cloudflare Workers
│   │   ├── feed/route.ts          ← Feed ranking + pagination
│   │   ├── stripe/
│   │   │   ├── checkout/route.ts
│   │   │   ├── webhook/route.ts
│   │   │   └── connect/route.ts
│   │   └── moderate/route.ts      ← Shield: content scan
│   └── layout.tsx
├── components/
│   ├── feed/                      ← Feed UI components
│   ├── remix/                     ← Remix overlay components
│   ├── tool-card/                 ← Tool card components
│   └── primitives/                ← The 50+ component primitives
│       ├── form/
│       ├── table/
│       ├── calculator/
│       ├── tracker/
│       ├── generator/
│       ├── commerce/
│       └── content/
├── lib/
│   ├── forge/                     ← Generation engine
│   │   ├── classify.ts            ← Haiku intent classification
│   │   ├── generate.ts            ← Sonnet config generation
│   │   ├── assemble.ts            ← Primitive assembly
│   │   └── validate.ts            ← Automated validation
│   ├── models/                    ← Multi-model abstraction layer
│   ├── feed/                      ← Feed algorithm
│   ├── stripe/                    ← Payment processing
│   └── db/                        ← Database schemas + queries
├── primitives/                    ← Primitive source code + tests
│   ├── form/
│   │   ├── Form.tsx
│   │   ├── Form.test.tsx
│   │   └── schema.json            ← Config schema for Forge
│   └── ...
├── workers/                       ← Cloudflare Worker templates
│   └── tool-runtime/              ← The runtime that hosts deployed tools
├── .env.local
├── package.json
└── vercel.json
```

---

## 13. DAY 0 ORDERS (When Nero receives this spec)

### Spawn New Agents
1. **FORGE** — Generation engine. Claude Sonnet primary. First task: build prompt → intent → primitive selection pipeline.
2. **LEGO** — Primitive library. First task: build 5 core primitives (Form, Table, Calculator, Tracker, Generator) with full test suites.
3. **FLUX** — Feed algorithm. First task: feed data model + ranking schema + curated ranking.
4. **VAULT** — Marketplace/payments. First task: Stripe Connect test mode + creator onboarding flow.
5. **SHIELD** — Trust & safety. First task: Haiku content moderation classifier + prohibited content categories.

### Existing Agents — Immediately
- **Sama:** Initialize repo at /Users/jarvis/agentdoom/. Next.js + Tailwind + Framer Motion. Scaffold single-screen generation flow.
- **Atlas:** Competitive deep-dive: v0.dev, Bolt.new, Lovable.dev, Replit Agent. What do users hate? Where do they churn?
- **Grunt/Scraps:** Set up Cloudflare account + Workers. Provision Neon PostgreSQL + Upstash Redis. GitHub repo + CI/CD.
- **Echo:** Draft launch narrative. Build waitlist page at agentdoom.ai.
- **Sentinel:** Design validation pipeline spec. What tests per tool? How to catch failures before user sees them?
- **Ledger:** Stripe Connect research. Marketplace economics model. Set up Stripe account for AgentDoom.

---

## 14. SUCCESS METRICS

| Metric | Week 2 | Week 4 | Week 8 |
|--------|--------|--------|--------|
| Tools generated | 50 | 500 | 5,000 |
| Generation success rate | 90% | 93% | 95% |
| Average generation time | <8s | <5s | <4s |
| Users | 0 (internal) | 500 (soft launch) | 5,000 |
| Remix rate | — | 15% | 25% |
| Share rate | — | 10% | 20% |
| Viral coefficient | — | 0.5 | 0.7+ |
| Marketplace GMV | — | — | $10K |
| Tools in feed | 20 | 100 | 500+ |

---

## 15. WHAT IS NOT IN SCOPE (explicitly excluded)

- Complex multi-page applications (V1 = single-screen tools only)
- API integrations in generated tools (no external API calls from tools — yet)
- User-created tools from scratch on day 1 (only remixes of seed tools initially)
- Native mobile app on day 1 (responsive web app → Capacitor in Phase 2)
- Creator monetization on day 1 (add after product-market fit validated)
- AI model fine-tuning (use off-the-shelf models with good prompting)
- Blockchain/crypto anything

---

## SOURCE FILES (for reference)

- Strategy deck (React component): /Users/jarvis/Downloads/agentdoom-strategy-v2.jsx
- Demo prototype (React component): /Users/jarvis/Downloads/agentdoom-demo.jsx
- Build spec v2 (Word doc): /Users/jarvis/Downloads/AgentDoom-BuildSpec-v2.docx
- This master spec: /Users/jarvis/agentdoom/PROJECT_DOOM_MASTER_SPEC.md
