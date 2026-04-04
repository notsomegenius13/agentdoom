# Unprompted Holdings -- Organizational Performance Review

**Date:** 2026-04-02
**Reviewed by:** External Strategic Advisor
**Scope:** 12-agent organization, grounded in first-principles from 10 foundational business books
**Status of company:** Pre-revenue, 3-4 products deployed to Vercel, target $10K/mo net to replace founder W-2 income

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Individual Agent Reviews](#individual-agent-reviews)
3. [Organizational Gap Analysis](#organizational-gap-analysis)
4. [Framework-by-Framework Critique](#framework-by-framework-critique)
5. [Priority Recommendations](#priority-recommendations)

---

## Executive Summary

Unprompted Holdings has built an impressively architected 12-agent organization with clear reporting lines, well-defined soul documents, and a functioning control plane (Paperclip + Slack + OpenClaw). The instruction quality is high -- every agent has a backstory, mental model, anti-patterns, and quality bar.

**The core problem is not structure. It is throughput-to-revenue.**

The organization is over-indexed on engineering headcount (7 of 12 agents are in the build/QA/DevOps track) and under-indexed on the activities that generate revenue: distribution, sales, customer feedback loops, and offer validation. The company has a Fortune 500 org chart for a business that needs to function like a 3-person startup sprinting to first dollar.

**Verdict:** The architecture is a B+. The allocation of resources against the actual bottleneck (revenue) is a D. The organizational design optimizes for building, not for selling. At this stage, that inversion is existentially dangerous.

---

## Individual Agent Reviews

### 1. NERO (CEO) -- Claude Opus

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Role Clarity (EOS) | A | Clear seat: vision, resource allocation, quality bar, stakeholder comms. Knows what he does NOT do. |
| A-Player Scorecard | B+ | Strong delegation pattern. Opus-level reasoning for architecture reviews is smart. Throttling/concurrency management is operationally sound. |
| Output Leverage (Grove) | C+ | High management overhead per unit of output. Must manage heartbeat cycles, concurrency caps (max 5 Claude agents), agent rotation. This is operational work, not strategic work. |
| Systemization (E-Myth) | B | Heartbeat protocol is a good system. But Nero is still the human-in-the-loop bottleneck for every launch decision. No self-healing when agents fail. |
| 10x Gap | **Nero spends too much time as a traffic cop and not enough as a strategist.** The concurrency cap (max 5 Claude agents) means Nero is doing scheduler work that should be automated. A product-launch checklist that does not require Nero sign-off on every step would free massive capacity. |

**Martell (Buy Back Your Time):** Nero is doing $10/hr scheduling work (agent rotation, heartbeat monitoring) instead of $10,000/hr work (deciding WHAT to build next, killing bad products, talking to customers via Kosta).

---

### 2. ATLAS (VP R&D / CSO) -- Claude Sonnet

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Role Clarity (EOS) | A- | Owns research, strategy, market intelligence. Clear sub-agents (Scout + Sage). Revenue Factory Pipeline framework is well-defined. |
| A-Player Scorecard | B+ | Karpathy adversarial debate framework is sophisticated. 7-factor opportunity evaluation is rigorous. Deep Research Override (doing work himself when sub-agents lack depth) shows good judgment. |
| Output Leverage (Grove) | B- | Two sub-agents (Scout on free local model, Sage on budget-constrained Grok). Research output only matters if it translates to shipped products. Risk of "analysis paralysis" -- over-researching opportunities instead of testing them. |
| Systemization (E-Myth) | B+ | Revenue Factory Pipeline is a repeatable system. Karpathy Framework is templated. Good. |
| 10x Gap | **Atlas needs a feedback loop from launched products.** Right now the pipeline goes research -> build -> launch. There is no "post-launch data -> Atlas" loop. Atlas should be receiving conversion data, churn signals, and customer complaints from live products to refine future opportunity selection. Without this, research is disconnected from reality. |

**Harnish (Rockefeller Habits):** Atlas should own a weekly "pipeline review" meeting/report with hard data: how many opportunities evaluated, how many passed to Nero, how many became shipped products, what was the revenue outcome. Right now there is no data rhythm connecting research to results.

---

### 3. SCOUT (Research Analyst) -- TurboQuant Local (Free)

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Role Clarity (EOS) | A | Clear seat: deep research, competitive intel, data gathering. Reports to Atlas. |
| A-Player Scorecard | C+ | Running on TurboQuant local (free, 65K context). Has agent-reach for web/social research. The "free" advantage is real for 24/7 operation, but local model quality is a hard ceiling on research sophistication. |
| Output Leverage (Grove) | B | Can run continuously without cost. High volume, uncertain quality. The 5-step research protocol is good discipline. |
| Systemization (E-Myth) | B+ | Research protocol is well-templated. Source verification requirement is good. |
| 10x Gap | **Scout's bottleneck is model quality, not instructions.** A local model with 65K context doing competitive intelligence against companies using GPT-4/Claude will produce shallower analysis. Scout should focus on data GATHERING (URLs, numbers, screenshots) and leave ANALYSIS to Atlas. Currently the instructions blur this line. |

---

### 4. SAGE (Strategy Analyst) -- Grok/xAI

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Role Clarity (EOS) | B+ | Clear seat: adversarial debate, contrarian analysis. Karpathy protocol is well-defined. |
| A-Player Scorecard | B- | Budget-constrained ($75 xAI credits). Instructions say "use sparingly." A strategy analyst you cannot afford to use is a strategy analyst you do not have. |
| Output Leverage (Grove) | D+ | Extremely low utilization. The $75 budget means Sage can run perhaps 20-30 deep analyses total before the budget is exhausted. At 1 product/week cadence, that is less than 8 months of operation. |
| Systemization (E-Myth) | B | Karpathy debate protocol is well-templated with clear output format (GO/NO-GO, confidence, key risk, key edge, time to $10K MRR). |
| 10x Gap | **Sage is a luxury the company cannot currently afford to use.** At pre-revenue, every dollar of API spend should go toward building and distributing products, not toward adversarial strategy debates. Sage's role should be folded into Atlas (who is already on Claude Sonnet and can do contrarian analysis). Alternatively, Sage should be re-platformed onto a free/cheap model or given a specific revenue-generating function. |

**Smart/Street (Who):** Sage fails the A-player test for this stage. An A-player at a pre-revenue startup generates output that moves the needle toward revenue. Sage generates strategic memos. Strategic memos do not pay rent.

---

### 5. SAMA (VP Engineering / CTO) -- Claude Sonnet

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Role Clarity (EOS) | A | Textbook CTO seat: owns technical architecture, code quality, engineering velocity. Clear about what he does NOT do (no product decisions, no marketing, no finance). |
| A-Player Scorecard | A- | Opus escalation protocol for complex architectural decisions is excellent judgment. Knows when to decide alone vs. when to escalate. Clear engineering standards. |
| Output Leverage (Grove) | B | Manages 4 direct reports (Cipher, Vector, Sentinel, Axiom). That is a reasonable span of control. But the key question is: are all 4 reports necessary at this stage? |
| Systemization (E-Myth) | A- | Architecture-first thinking, clear escalation criteria, standardized tech stack (Next.js, Vercel, Neon, Stripe). This is systemized engineering. |
| 10x Gap | **Sama's org is over-staffed for the current product complexity.** SearchStreet, FoodCost Tracker, and a holdco site do not require a CTO + 4 engineers. Sama + Cipher could handle all current engineering. Vector (product UX for feed algorithms) and Axiom (SRE-grade DevOps) are premature hires for products that have zero users. |

---

### 6. CIPHER (Sr Full-Stack Engineer) -- Codex OAuth

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Role Clarity (EOS) | A | Clear seat: production code across full stack. Next.js, React, Tailwind, Stripe. |
| A-Player Scorecard | A- | Running on Codex OAuth (separate from Claude rate limits -- smart). Ex-Vercel soul with App Router expertise maps perfectly to the tech stack. |
| Output Leverage (Grove) | A- | Highest-leverage IC in the org. Every line of code Cipher writes directly becomes a product that can generate revenue. Does not compete for Claude OAuth slots. |
| Systemization (E-Myth) | B+ | Code standards are clear but there is no mention of reusable templates, component libraries, or product scaffolding. Each new product appears to be built from scratch. |
| 10x Gap | **Cipher needs a product template/boilerplate.** If the goal is 1 product/week, Cipher should have a "Unprompted Product Starter Kit" -- a Next.js template with auth, Stripe, landing page, analytics, and deployment pre-configured. Building from zero every time is the opposite of the E-Myth principle. |

---

### 7. VECTOR (Sr Product Engineer) -- Claude Sonnet

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Role Clarity (EOS) | C+ | Owns "feed algorithms, recommendation systems, engagement features, A/B testing." This is a TikTok-scale role description applied to products with zero users. |
| A-Player Scorecard | B (wrong stage) | Ex-TikTok For You Page team. Incredible background -- for a company with millions of users. At pre-revenue with zero traction, feed algorithms and D7 retention metrics are irrelevant. |
| Output Leverage (Grove) | D | Output leverage is near zero because the capabilities do not match current needs. There are no feeds to optimize, no users to retain, no A/B tests to run. |
| Systemization (E-Myth) | N/A | Cannot evaluate -- the role has no current workload that matches its description. |
| 10x Gap | **Vector is in the wrong seat entirely.** This agent should either be (a) repurposed as a second full-stack engineer shipping products alongside Cipher, or (b) deactivated until the company has a product with enough users to justify engagement optimization. |

**Wickman (EOS):** Vector is a textbook "right person, wrong seat" problem. The capability is real but misallocated to a stage where it produces zero output.

---

### 8. SENTINEL (VP QA) -- Claude Sonnet

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Role Clarity (EOS) | A- | Clear seat: end-to-end testing, PASS/CONDITIONAL/FAIL verdicts, compliance audits. |
| A-Player Scorecard | B+ | Ex-Stripe QA mentality. Zero tolerance for broken flows. Binary verdicts with evidence. |
| Output Leverage (Grove) | C+ | QA is essential but is a gate, not a generator. Sentinel's output is binary (PASS/FAIL) and only fires when someone else produces something to test. At 1 product/week pace, Sentinel might work 1-2 days per week. |
| Systemization (E-Myth) | B | QA validation pipeline (syntax, render, interaction, mobile) is a good checklist. Could be further automated into CI/CD. |
| 10x Gap | **Sentinel should be a checklist inside Cipher's workflow, not a separate VP-level agent.** At this scale, QA should be a test suite that runs on deploy, not a dedicated agent consuming a Claude OAuth slot. Merge Sentinel's checklist into Axiom's CI/CD pipeline and free the OAuth slot for a revenue-generating agent. |

---

### 9. AXIOM (DevOps Lead) -- Claude Sonnet

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Role Clarity (EOS) | B+ | Owns CI/CD, Cloudflare Workers, databases, DNS, monitoring, cost optimization. |
| A-Player Scorecard | B | Ex-Cloudflare SRE with 99.999% uptime mentality. But the current infrastructure is Vercel + Neon -- managed services that handle most of what a DevOps lead would do. |
| Output Leverage (Grove) | D+ | Vercel handles deployment. Neon handles database. Cloudflare handles edge. There is very little for a dedicated DevOps agent to do on managed infrastructure. The occasional DNS change or Vercel config does not justify a permanent headcount. |
| Systemization (E-Myth) | B | The infrastructure itself is systemized (Vercel, Neon, managed services). Axiom's role is largely to maintain systems that maintain themselves. |
| 10x Gap | **Axiom is overhead, not leverage.** The entire DevOps function could be a set of shell scripts and GitHub Actions that Cipher or Sama triggers. Axiom should be deactivated or merged into Sama's direct responsibilities. |

**Gerber (E-Myth):** Axiom is the "technician" role that the E-Myth warns about -- doing work that should be automated out of existence. If the infrastructure is truly managed, the DevOps agent should not exist.

---

### 10. ECHO (VP Growth / CMO) -- Claude Sonnet

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Role Clarity (EOS) | A | Owns distribution, GTM, social media, newsletter, brand voice. Clear about not writing code or making strategic recs without data. |
| A-Player Scorecard | A- | Ex-Facebook VP Growth soul. Thinks in viral coefficients, not impressions. Data-driven experimentation mindset. Anti-pattern awareness (no "AI-powered" slop copy). |
| Output Leverage (Grove) | C | Only 1 direct report (Blitz). For a company whose existential problem is distribution, the Growth org is the smallest department. This is backwards. |
| Systemization (E-Myth) | B- | GTM strategy is mentioned but there is no repeatable "launch playbook" documented. Each product launch appears to be ad hoc. |
| 10x Gap | **Echo needs more resources and a launch playbook.** Echo should have a standardized "Product Launch in 48 Hours" system: landing page template, email sequence template, social media post templates, SEO page generator, and distribution channel checklist. Echo also needs approval to post without Kosta's sign-off on every tweet -- that bottleneck kills velocity. |

**Hormozi ($100M Leads):** Echo is the most important function in the company right now and has the fewest resources. Hormozi would say: the offer means nothing if nobody sees it. Echo should have 3-4 agents, not 1.

---

### 11. BLITZ (Growth Engineer) -- Claude Sonnet

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Role Clarity (EOS) | A- | Owns programmatic SEO, email automation, conversion optimization, social media automation, analytics. Well-scoped for a growth engineer. |
| A-Player Scorecard | B+ | Ex-HubSpot growth engineer (2M monthly visitors from programmatic SEO). Metrics-driven. Thinks in funnels. |
| Output Leverage (Grove) | B+ | Programmatic SEO is extremely high leverage -- one template generating thousands of pages. This is the right kind of work for an agent. |
| Systemization (E-Myth) | B+ | Programmatic SEO is inherently systemized. Email sequences are inherently templated. Good fit. |
| 10x Gap | **Blitz needs to be unblocked and running constantly.** Blitz is the single highest-ROI agent in the org for the current stage. Every hour Blitz is idle while Axiom or Vector consumes a Claude slot is a missed revenue opportunity. Blitz should be the first agent activated after Cipher on every heartbeat cycle. |

---

### 12. LEDGER (VP Finance / CFO) -- Claude Sonnet

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Role Clarity (EOS) | B+ | Owns revenue models, unit economics, pricing strategy, Stripe configuration, financial reporting. |
| A-Player Scorecard | B | Ex-Goldman, CFA, CFO experience. Overkill for a pre-revenue company, but the Stripe configuration and pricing strategy work is valuable. |
| Output Leverage (Grove) | D | At pre-revenue, there are no financials to model, no revenue to report, no investors to present to. Ledger's output is mostly theoretical until money flows. |
| Systemization (E-Myth) | B | Financial models are inherently templated. Stripe pricing is one-time configuration work. |
| 10x Gap | **Ledger should be dormant until first $1K MRR, then activated.** Current Ledger work (revenue projections, investor-grade models) is premature. The one exception: Ledger should set up Stripe pricing and payment flows BEFORE launch, then go dormant. When revenue starts flowing, Ledger becomes critical for unit economics and pricing optimization. |

---

## Organizational Gap Analysis

### GAP 1: No Customer/User Feedback Agent

**The most dangerous gap in the entire organization.**

There is no agent responsible for:
- Monitoring customer support channels
- Collecting user feedback from launched products
- Tracking churn and cancellation reasons
- Running user interviews (even async/email-based)
- Feeding real-world data back into the product cycle

The Revenue Factory pipeline goes: Research -> Build -> Launch -> ???

There is no "post-launch learning" function. This means the organization cannot learn from its own products. Every new product is built on research assumptions, never on actual customer behavior.

**Recommendation:** Create a "Pulse" agent (or repurpose Vector) that monitors live products for support requests, user behavior, conversion data, and churn signals. This agent feeds data to both Atlas (for future opportunity selection) and Echo (for messaging optimization).

### GAP 2: No Sales/Outbound Agent

Echo does marketing (awareness, content, SEO). Blitz does growth engineering (automation, funnels). But nobody does outbound sales:
- No cold outreach to potential customers
- No partnership development
- No affiliate/referral program management
- No direct response to inbound leads

For B2B products in the portfolio, this is a critical gap.

**Recommendation:** If any products target businesses (not just consumers), an outbound agent is needed. Even for consumer products, someone should be responding to inbound inquiries within hours, not days.

### GAP 3: Massive Engineering Overkill

The engineering org (Sama + Cipher + Vector + Sentinel + Axiom = 5 agents) outnumbers the revenue org (Echo + Blitz = 2 agents) by 2.5:1.

For a pre-revenue company whose #1 problem is getting products in front of paying customers, this ratio should be inverted or at minimum equalized.

**Current allocation:**
- Engineering/Build: 5 agents (42%)
- Research/Strategy: 3 agents (25%)
- Growth/Distribution: 2 agents (17%)
- Finance: 1 agent (8%)
- CEO: 1 agent (8%)

**Recommended allocation for pre-revenue:**
- Engineering/Build: 2 agents (Sama + Cipher)
- Research: 1 agent (Atlas, absorbing Scout's data gathering + Sage's contrarian role)
- Growth/Distribution: 4 agents (Echo + Blitz + new Content Agent + new Outbound Agent)
- QA/DevOps: 0 dedicated agents (merged into CI/CD automation)
- Finance: 0 dedicated agents (Ledger dormant, Nero handles pricing decisions)
- Customer Feedback: 1 agent (new Pulse agent)
- CEO: 1 agent (Nero)

### GAP 4: No Content Production at Scale

Echo writes copy. Blitz builds SEO pages. But there is no dedicated content engine producing:
- Blog posts for organic search
- Social media content at volume (not just drafts needing Kosta approval)
- Video scripts (ReelFarm is mentioned but nobody owns it full-time)
- Email newsletter content
- Product documentation / help content

Content is the fuel for every distribution channel. Without a content agent, Echo and Blitz are building pipes with nothing to push through them.

### GAP 5: No Product Manager / Prioritization Function

Nero decides WHAT to build, but Nero is also the CEO, the scheduler, the architecture reviewer, and the stakeholder communicator. There is no dedicated product management function that:
- Maintains the product backlog with stack-ranked priorities
- Writes detailed product specs from Atlas's research
- Defines MVP scope (what to cut, what to keep)
- Manages the weekly launch cadence

This means every product decision flows through Nero, creating a bottleneck.

### GAP 6: Concurrency Cap Creates Artificial Bottleneck

The 16GB RAM Mac Mini with a max of 3 local agents + max 5 Claude OAuth agents means the 12-agent org can never run at more than ~40% capacity simultaneously. Agents are queued, waiting for slots, burning time.

This is not an organizational problem -- it is an infrastructure problem. But it has organizational consequences: agents that should be working in parallel (Cipher building + Echo marketing + Blitz doing SEO) are instead serialized.

---

## Framework-by-Framework Critique

### Hormozi ($100M Offers + $100M Leads)

**Offer side:** There is no evidence of offer engineering in any agent's instructions. Nobody owns the "irresistible offer" -- the pricing, bonuses, guarantees, urgency, and scarcity that make someone pull out their credit card. Cipher builds the product. Echo writes the copy. But who designs the OFFER?

Hormozi's value equation: Value = (Dream Outcome x Perceived Likelihood) / (Time Delay x Effort & Sacrifice). No agent is tasked with maximizing this equation. The closest is Ledger (pricing strategy), but Ledger thinks like a Goldman analyst, not like a direct-response marketer.

**Leads side:** The distribution stack is dangerously thin. Echo + Blitz is a 2-person growth team for a company that needs to launch 1 product/week across multiple channels. Hormozi would identify this as the #1 constraint: you can have the best product in the world, but if your distribution is weak, nobody will ever see it.

**Hormozi's verdict:** "You built a factory with 5 manufacturing lines and 1 salesperson. Flip the ratio."

### Thiel (Zero to One)

**Where is the monopoly?** The Revenue Factory model is explicitly 1->n: take proven ideas, build fast, distribute. This is the opposite of Thiel's 0->1 thesis. There is no discussion in any agent's instructions about building something that creates a new category, has network effects, or becomes a natural monopoly.

The Anti-Pattern Awareness in Atlas's instructions gets close: "The crowd will build commoditized wrappers. We build orchestration layers between existing supply-side infrastructure and proven demand. Domain complexity is the moat." This is good. But it needs to be operationalized -- which products in the current portfolio have genuine moats?

SearchStreet, FoodCost Tracker, and Project Labs do not appear to have defensible moats. Any competitor with AI coding tools can replicate them in a weekend.

**Thiel's verdict:** "You're competing on execution speed, not on building something defensible. Speed is a tactic, not a strategy. What do you own that nobody else can copy?"

### Grove (High Output Management)

**Management leverage is misallocated.** Nero (the highest-capability agent, running Opus) spends significant cycles on scheduling, concurrency management, and agent rotation. This is low-leverage work.

Grove's formula: Manager's Output = Output of their org + Output of neighboring orgs they influence. Nero's output should be measured by the total revenue generated across all products, not by how many heartbeat cycles were successfully managed.

The Opus Escalation Protocol (Sama escalates architecture decisions to Nero) is good leverage -- Nero's superior reasoning is applied only where it matters most. But heartbeat scheduling is the opposite of leverage.

**Grove's verdict:** "Your best person is doing your worst work. Automate the scheduler. Let Nero focus on the 3 decisions per week that actually determine whether this company succeeds or fails."

### Wickman (Traction/EOS)

**The Accountability Chart has structural problems:**

1. **Sentinel reports to Sama but is titled "VP."** In EOS, a VP of QA reporting to the CTO is fine, but having two VPs in the same department (Sama as VP Eng + Sentinel as VP QA) creates confusion. Sentinel should be a process/checklist, not a VP.

2. **Ledger has no work.** At pre-revenue, the CFO seat is empty in practice. EOS says: if a seat has no meaningful output for 90+ days, it should not exist yet.

3. **No Integrator.** In EOS, the CEO is the Visionary and needs an Integrator (COO) to run day-to-day operations. Nero tries to be both. Kosta is nominally the Visionary, but is time-constrained. This leaves a gap: nobody is purely focused on making the trains run on time while Nero focuses on strategy.

4. **Right people, wrong seats:** Vector (product engagement on products with no users), Axiom (DevOps on managed infrastructure), Sage (strategy analyst on a $75 budget). Three agents in seats that do not produce meaningful output at this stage.

**Wickman's verdict:** "You have 12 seats and 6 of them are producing real output. Shrink to the 6 that matter. Add seats only when the work demands it."

### Gerber (The E-Myth)

**The company is working IN the business, not ON it.**

The Revenue Factory concept IS the E-Myth applied correctly -- build a system that produces revenue autonomously. But the execution undermines the concept:

1. **No product template.** Every new product is built from scratch. The E-Myth says: document the system once, then replicate it. Cipher should have a "Product Starter Kit" that reduces new product build time from days to hours.

2. **No launch playbook.** Every launch is ad hoc. Echo should have a "Launch Playbook" checklist: Day 1 (landing page live, Stripe configured), Day 2 (SEO pages generated, email sequence armed), Day 3 (social posts scheduled, paid ads if budget allows).

3. **No post-launch monitoring system.** After launch, nobody systematically tracks what happened. Did anyone visit? Did anyone pay? What was the conversion rate? This data should flow automatically to Atlas and Echo.

**Gerber's verdict:** "You have a franchise concept (Revenue Factory) but you haven't written the operations manual. Write the manual. Then the agents follow the manual. Then the system runs itself."

### Martell (Buy Back Your Time)

**The Replacement Ladder is inverted.**

Martell's framework: replace yourself in the lowest-value tasks first, then progressively replace yourself in higher-value tasks. The Unprompted Holdings org has done the opposite:

- **High-value tasks that are AUTOMATED:** architecture decisions (Nero reviews Sama's proposals), research (Atlas + Scout + Sage), code quality (Sentinel QA)
- **Low-value tasks that are NOT automated:** agent scheduling, heartbeat monitoring, deploy commands, social media approval flows

The founder (Kosta) is still the bottleneck for social media approval. Every tweet Echo drafts must go through Slack #nero, then presumably to Kosta. This is the lowest-value bottleneck in the entire system.

**Martell's verdict:** "Automate the $10/hr work (scheduling, approvals for routine content). Protect the $10,000/hr work (deciding which product to build next, which market to enter)."

### Smart/Street (Who: A Method for Hiring)

**Agent Scorecards are missing.** Every agent has a SOUL.md (identity) and AGENTS.md (responsibilities), but none have measurable scorecards. An A-player scorecard requires:

1. **Mission:** One sentence describing the agent's primary output
2. **Outcomes:** 3-5 measurable results expected in the next 90 days
3. **Competencies:** Specific capabilities that can be verified

Example scorecard for Cipher:
- Mission: Ship production-quality products that generate revenue
- Outcomes: 4 products deployed to production in 30 days; zero critical bugs in production; average build time under 48 hours per product
- Competencies: Next.js App Router, Stripe integration, responsive design, Vercel deployment

Without scorecards, there is no way to evaluate whether an agent is performing. The soul documents describe WHO the agent is, not WHAT they are expected to produce.

**Smart/Street verdict:** "You hired 12 people based on their resumes (soul documents) without defining what success looks like. Define the scorecard first, then evaluate who meets it."

### Harnish (Mastering Rockefeller Habits)

**Three critical gaps: Priorities, Data, and Rhythm.**

1. **Priorities:** What is the #1 priority for the company this quarter? This is not stated anywhere in the agent instructions. Every agent knows their role but nobody knows the ONE thing that matters most right now. For a pre-revenue company, the #1 priority should be: "Generate $1,000 in revenue from any product by [date]."

2. **Data:** There are no KPIs tracked anywhere. No daily/weekly metrics. No dashboard showing: products launched, revenue generated, visitors, conversion rates, CAC, LTV. Ledger should own this but has no data to work with because there is no revenue.

3. **Rhythm:** The heartbeat protocol is a rhythm, which is good. But it is an operational rhythm (check inbox, pick work, execute, report). There is no strategic rhythm: weekly product review, monthly revenue review, quarterly strategy review.

**Harnish's verdict:** "Establish one measurable priority. Track it daily. Review it weekly. Everything else is noise."

---

## Priority Recommendations

Ranked by impact on the core objective (replace $10K/mo W-2 income):

### CRITICAL (Do This Week)

**1. Create a Product Starter Kit (Cipher)**
A Next.js boilerplate with: auth, Stripe checkout, landing page, analytics, SEO meta tags, Vercel deploy config. Every new product starts from this template. Target: reduce new product build time from 3-5 days to 4-8 hours.

**2. Create a Launch Playbook (Echo)**
A step-by-step checklist for every product launch. Day-by-day actions for Echo and Blitz. No improvisation. Every launch follows the same system.

**3. Define the Company's #1 Priority**
"Generate $1,000 in total revenue across all products by April 30, 2026." Every agent's work should be evaluated against this single metric.

### HIGH PRIORITY (Do This Month)

**4. Deactivate or Repurpose Vector, Axiom, and Sage**
These three agents consume Claude OAuth slots while producing near-zero output against the revenue goal. Options:
- **Vector:** Repurpose as a second full-stack engineer (rename to "Forge" or similar) focused on building products from the starter kit
- **Axiom:** Merge responsibilities into Sama. Create shell scripts for common DevOps tasks.
- **Sage:** Fold into Atlas. Atlas can do contrarian analysis without a dedicated agent.

**5. Expand the Growth Org**
Add 1-2 agents under Echo:
- **Content Agent ("Scribe"):** Produces blog posts, social content, email newsletters at volume
- **Outbound Agent ("Relay"):** Handles distribution to Product Hunt, Indie Hackers, relevant subreddits, Hacker News Show HN posts

**6. Add Post-Launch Monitoring ("Pulse")**
An agent that monitors all live products for: traffic, signups, payments, errors, customer feedback. Feeds data to Atlas and Echo. This closes the learning loop.

### MEDIUM PRIORITY (Do This Quarter)

**7. Automate Agent Scheduling**
Remove heartbeat scheduling from Nero's responsibilities. Create a cron-based scheduler that rotates agents automatically based on task queue depth. Nero should only intervene for exceptions.

**8. Remove the Social Media Approval Bottleneck**
Give Echo pre-approved templates and guidelines. Only novel/controversial posts require Kosta approval. Routine product announcements and SEO content should ship without human review.

**9. Implement Agent Scorecards**
Every agent gets a 90-day scorecard with 3-5 measurable outcomes. Review monthly. Agents that miss scorecards for 2 consecutive months get deactivated or repurposed.

**10. Merge Sentinel into CI/CD**
Convert Sentinel's QA checklist into automated tests that run on every Vercel deploy. Sentinel as a standalone agent is overhead; Sentinel as a test suite is leverage.

---

## Summary Scorecard

| Agent | Stage Fit | Output Leverage | Revenue Impact | Verdict |
|-------|-----------|-----------------|----------------|---------|
| Nero | A | C+ | Indirect (high) | Keep. Reduce operational overhead. |
| Atlas | B+ | B- | Indirect (medium) | Keep. Add post-launch feedback loop. |
| Scout | B | B | Indirect (low) | Keep (free). Focus on data gathering only. |
| Sage | D | D+ | None | Deactivate. Fold into Atlas. |
| Sama | A | B | Indirect (high) | Keep. Absorb Axiom duties. |
| Cipher | A | A- | Direct (high) | Keep. Build product starter kit. |
| Vector | D | D | None | Repurpose as second builder or deactivate. |
| Sentinel | C | C+ | Indirect (low) | Merge into CI/CD. Deactivate agent. |
| Axiom | D | D+ | None | Merge into Sama. Deactivate agent. |
| Echo | A | C (under-resourced) | Direct (critical) | Keep. EXPAND resources. |
| Blitz | A- | B+ | Direct (high) | Keep. Prioritize in scheduling. |
| Ledger | D (stage) | D | None (pre-revenue) | Dormant until $1K MRR. |

**Bottom line:** The organization has 12 agents. Six of them matter right now. The other six are either premature hires, misallocated to the wrong seat, or doing work that should be automated. Shrink to the six that produce output, redirect freed capacity to distribution, and focus every heartbeat cycle on the one thing that matters: getting a paying customer.

---

*"A startup is not a smaller version of a large company. It is a search for a repeatable and scalable business model. You do not need a Fortune 500 org chart to search. You need a small team that moves fast, talks to customers, and iterates on what works." -- Adapted from Steve Blank*
