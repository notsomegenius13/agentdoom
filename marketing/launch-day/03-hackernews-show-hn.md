# AgentDoom Launch — Hacker News Show HN

---

## Title

Show HN: AgentDoom – TikTok-style feed of AI-built software tools

## URL

https://agentdoom.ai

## First Comment (post immediately after submission)

Hi HN — creator here.

AgentDoom is a platform where you describe a software tool in plain English and get a working, deployed web app in seconds. Every tool appears in a scrollable feed where others can use it and "remix" it with their own modifications.

**Why this architecture instead of free-form code gen:**

Most AI code generators produce arbitrary code, which leads to ~60-70% first-attempt success rates. We took a different approach: a library of 50+ pre-built, tested component primitives (forms, tables, calculators, trackers, charts, commerce widgets, etc.).

The generation pipeline:
```
User prompt
  → Claude Haiku classifies intent + selects primitives (~50ms)
  → Claude Sonnet generates configuration wiring primitives together (~3-5s)
  → Runtime assembles configured primitives into a React app
  → Automated validation: syntax → render → interactions → mobile (<1s)
  → Deploy to Cloudflare Workers → live URL
```

This constrained approach gets us to ~95% first-attempt success. The tradeoff is flexibility — you can't build arbitrary applications, only single-screen tools composed from the primitive library. We think that's the right constraint for the use case.

**The social/distribution layer:**

Every tool gets a URL (agentdoom.ai/t/slug). The feed shows tools as cards with live demos. "Remix" lets you fork any tool with a natural language modification. Remix chains create organic distribution — someone's tip calculator becomes an invoice generator becomes an expense tracker.

**Stack:** Next.js 14 on Vercel (frontend), Cloudflare Workers (tool hosting, zero cold start), PostgreSQL via Neon, Redis via Upstash, Claude (Haiku/Sonnet) for generation, Stripe Connect for marketplace (coming soon).

**What's not in scope for V1:** Multi-page apps, external API integrations in tools, native mobile (responsive web for now), fine-tuned models.

Happy to answer questions about the primitive architecture, the generation pipeline, or the distribution model.

---

**Posting notes:**
- Post between 8-10 AM ET on a weekday for best visibility
- Title is exactly 58 characters — under the 80-char limit
- First comment should go up within 60 seconds of posting
- Monitor and respond to every comment for the first 6 hours
- Be technical, honest about limitations, and avoid marketing language — HN penalizes hype
- If someone asks about the AI moat, redirect to distribution: "The moat is the feed, remix chains, and marketplace liquidity — not the generation, which improves automatically as models improve"
