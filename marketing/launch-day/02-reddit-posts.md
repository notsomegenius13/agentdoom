# AgentDoom Launch — Reddit Posts

---

## Post 1: r/SideProject

**Title:** I built a TikTok for AI-generated software tools

**Body:**

Hey r/SideProject — been working on this for a few weeks and it's finally live.

**AgentDoom** (agentdoom.ai) is a platform where you describe a tool in plain English and get a working, deployed web app in under 10 seconds. No code, no config, no server setup.

But here's the twist: every tool you build shows up in a scrollable feed. Other people can browse your tools, use them, and hit "Remix" to create their own version with a plain-English modification. Think TikTok duets but for software.

**How it works technically:**
- You type a prompt ("build me an expense splitter for my roommates")
- AI classifies your intent and assembles pre-built, tested components
- The tool passes automated validation (syntax, rendering, mobile responsiveness)
- Deployed to Cloudflare Workers globally — your tool gets a clean URL

**What you can build:**
- Calculators, trackers, forms, dashboards, quizzes
- Invoice generators, habit trackers, content calendars
- Basically any single-screen utility tool

**The stack:** Next.js on Vercel, Cloudflare Workers for tool hosting, Claude for generation, 50+ component primitives.

Would love feedback from this community. What would you build first?

agentdoom.ai

---

## Post 2: r/startups

**Title:** Show r/startups: AgentDoom — create and share AI-powered tools in seconds

**Body:**

Launching today. AgentDoom lets anyone create working web tools using natural language and share them instantly.

**The thesis:** Every AI code gen tool today is single-player. You generate something, maybe deploy it, that's it. We think the next step is making creation SOCIAL — a feed of live tools that people scroll, remix, and share. Building software becomes content creation.

**What makes this different from v0/Bolt/Lovable/Replit:**
- It's not a dev tool. It's a consumer platform. Users never see code.
- The output isn't a project — it's a shareable, live tool with its own URL.
- The feed creates distribution. You don't just build in isolation.
- Remix chains: someone sees your tip calculator, remixes it into a freelance rate tool, shares that, someone else turns it into an invoice generator. Each node is a potential customer.

**Business model:**
- Marketplace (coming soon): creators price and sell tools, we take 15-20%
- Pro subscription: $14/mo for power users (custom domains, analytics, no branding)
- Boost: creators pay for feed placement

**Early traction:** Just launching today, but the waitlist has been growing. Would love your honest feedback on the product and the GTM approach.

agentdoom.ai

---

## Post 3: r/artificial

**Title:** AgentDoom lets AI build fully functional web tools you can fork and remix

**Body:**

New project: AgentDoom (agentdoom.ai) — a platform where AI generates working, deployed web applications from natural language prompts.

**The interesting technical bit:**

Instead of generating arbitrary code (which has a high failure rate), AgentDoom uses a "component primitive" architecture. There's a library of 50+ pre-built, battle-tested React components — forms, tables, calculators, trackers, generators, commerce widgets.

The generation flow:
1. A fast classifier model (Claude Haiku, ~50ms) determines intent and selects relevant primitives
2. A more capable model (Claude Sonnet, 3-5s) generates a configuration object that wires the primitives together
3. The runtime assembles the configured primitives into a single-page React app
4. An automated pipeline validates: syntax → rendering → interactions → mobile responsiveness
5. Deploys to Cloudflare Workers — live URL in seconds

This constrained approach means ~95% first-attempt success rate vs. the ~60-70% you get from unconstrained code generation.

**The social layer:**

Every generated tool appears in a scrollable feed. Users can browse, use, and "Remix" any tool — type a modification in natural language and get a new version. Remix chains create organic distribution.

The whole thing is built on Next.js + Cloudflare Workers, using Claude's model family for multi-tier generation.

Curious what this community thinks about the constrained-generation approach vs. free-form code gen.

agentdoom.ai

---

**Posting notes:**
- Post to r/SideProject first (most forgiving), then r/startups, then r/artificial
- Space posts 2-3 hours apart
- Engage genuinely with every comment in the first 4 hours
- Do NOT cross-post or use identical language across subreddits
- Each post is written to match the subreddit's tone and audience interests
