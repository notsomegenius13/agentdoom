# Competitive Teardown: v0, Bolt, Lovable vs. AgentDoom
**Atlas / April 2, 2026 — Internal Use Only**

---

## The Landscape

Three tools dominate AI-assisted building today. All three are growing. All three have the same core flaw.

| | v0 (Vercel) | Bolt.new | Lovable.dev |
|---|---|---|---|
| **ARR** | ~$42M | ~$40M | **$400M** |
| **Users** | 4M total | 3M registered | 8M, 100K projects/day |
| **Target** | Front-end developers | Semi-technical founders | Non-technical founders |
| **Backend?** | None | Framework only | Supabase + auth |
| **Core complaint** | Too technical, no backend | Debug token spiral | Credit opacity, 2.0 regression |
| **Pricing** | Token-based, opaque | Token-based, punishing | Credit-based, confusing |

---

## What Each One Is

**v0** generates React/Next.js code. Output: a component. A file. Not a running product. You still need a developer, a server, and an auth layer. v0 is for developers who want a head start on UI — it is not for normies. It never was.

**Bolt.new** is a browser-based IDE. Output: a codebase. It's impressively fast to spin up, but 67% of its users have no development background — and they all hit the same wall. After 20 prompts, context collapses. After one bug fix, three other things break. The product surfaces a file tree. Users debug. Non-technical users quietly churn.

**Lovable.dev** is the real competitor — $400M ARR, 8M users, the closest thing to a normie builder on the market. But it's still a one-player creation tool pointed at builders who want apps. Its churn drivers are structural: an opaque credit system that penalizes debugging, code drift after 30+ iterations, and a February 2026 security incident that exposed 18,000+ users' data from a single Lovable-built app. Lovable 2.0 launched and broke more than it fixed. The product is built for founders who want MVPs — not for the social layer that makes tools spread.

---

## The Shared Failure Mode

Every competitor solves for *creation*. None solves for *distribution*.

You build something. It sits at a URL. You share a link. Your friend clicks it, uses it, has no idea how to make their own version. The loop dies.

All three price on subscriptions. All three make money whether your tool gets used or not. None of them have an incentive to make your tool go viral.

---

## What AgentDoom Does Differently

**1. Tools, not apps.** Competitors build multi-page apps. AgentDoom builds single-screen, instantly shareable tools. The scope is narrower by design — and that's why success rate can be 95%+ vs. the ~60% users actually experience on competitors.

**2. Sub-10 seconds, period.** Competitors generate code. AgentDoom configures pre-built component primitives. This isn't incremental — it's a different architecture. Generation speed is structural, not a prompt engineering optimization.

**3. The feed is the product.** AgentDoom's TikTok-style feed means creation is distribution. Every tool is a post. Every remix is a share. Competitors have no social layer — a "shared link" is a dead end. AgentDoom's viral mechanics make every user a growth channel.

**4. Marketplace economics beat subscription economics.** Lovable and Bolt make $25–$100/month per user regardless of whether the user's tools get used. AgentDoom takes 15–20% of every transaction — revenue scales with creator success, not with seat count. This aligns incentives correctly.

**5. No code, ever.** v0 shows code. Bolt shows a file tree. Lovable shows a GitHub repo. AgentDoom shows nothing — the agent is invisible infrastructure. The interface is: type → see it build → share. A 14-year-old on an iPhone can use it.

---

## The One Risk to Watch

Lovable hit $400M ARR by finding normie demand that v0 and Bolt missed. They will notice the social + marketplace angle. Their moat is their user base — 8M people who've already built something and have a reason to keep paying.

AgentDoom's counter: **distribution compounds; generation doesn't.** Once the remix chain and feed engagement is seeded, each new user makes the platform more valuable to every existing user. Lovable's per-seat model has no equivalent flywheel.

**Verdict: compete on distribution before they realize distribution is the game.**
