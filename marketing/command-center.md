# Unprompted Holdings — Marketing Command Center
*Last updated: 2026-04-02 | Owner: Echo (CMO)*

---

## 1. Product Overview & GTM Strategy

### AgentDoom (agentdoom.ai)
**What it is:** A TikTok-style social platform where AI builds fully working web tools in under 10 seconds. Users describe tools in plain English, watch them build, deploy instantly, and earn from their creations.

**Why it wins:**
- Social + utility hybrid (scroll/remix mechanic) — no competitor does this
- Sub-10-second deployment removes all friction between idea and live product
- Remix royalties create compounding passive income for creators
- Solves "I have the idea, not the code" for non-technical builders

**Positioning:** "The social platform where anyone ships software."

**Target:** Non-technical builders, indie hackers, solo founders, knowledge workers who want tools but can't code.

**GTM Strategy:**
- Launch channel priority: Product Hunt (midnight April 3) → Hacker News (5AM PT) → Twitter/X thread (6AM PT) → Reddit (staggered) → Waitlist email blast (9AM PT)
- Teaser tweets already queued at @Build_Like_Bob (PENDING Kosta approval)
- Week 1 content calendar in `/agentdoom/marketing/launch-plan/04-week1-content-calendar.md`
- Pricing: Free (10 tools/mo) | Pro $14/mo | Enterprise $99/mo

**Launch Date:** April 3, 2026 (TOMORROW)
**Status:** 🔴 CRITICAL — T-minus 12 hours

---

### SearchStreet / SeedStack (searchstreet.com)
**What it is:** [TBD — needs product description added here]
**GTM:** TBD

---

### Unprompted Holdings (unpromptedholdings.com)
**What it is:** Holdco landing page. Investor-facing portfolio showcase. Animated subco logos linking to each product.
**GTM:** Passive — PE/investor discovery. No active launch campaign.

---

### Unprompted Systems
**What it is:** Project Labs / consultancy arm
**GTM:** TBD — low priority vs AgentDoom launch

---

### AI Estimate Writer
**What it is:** [TBD — product description needed]
**GTM:** TBD

---

## 2. Credentials Reference

> Full credentials stored in `~/.openclaw/workspace/credentials/`

| Service | File | Account | Notes |
|---------|------|---------|-------|
| Namecheap (domains) | `namecheap.md` | peterjarvis477 | Owns unpromptedholdings.com, agentdoom.ai |
| X/Twitter API | `twitter-api.env` | @Build_Like_Bob | Read+Write permissions |
| Google Cloud OAuth | `namecheap.md` (see Google section) | Unprompted Holdings project | For SearchStreet auth |

**Key domains:**
- unpromptedholdings.com → Vercel project: `nero-test-landing` → A @ 76.76.21.21
- agentdoom.ai → DNS Vercel A record setup **NEEDED**
- searchstreet.com → TBD

---

## 3. Marketing Campaign Tracker

| Campaign | Channel | Status | Launch Date | Spend | Impressions | Clicks | Conversions | CAC | LTV |
|----------|---------|--------|-------------|-------|-------------|--------|-------------|-----|-----|
| AgentDoom Launch | X/Twitter thread | Scheduled | Apr 3, 6AM PT | $0 | — | — | — | — | — |
| AgentDoom Launch | Product Hunt | Scheduled | Apr 3, 12:01AM PT | $0 | — | — | — | — | — |
| AgentDoom Launch | Hacker News Show HN | Scheduled | Apr 3, 5AM PT | $0 | — | — | — | — | — |
| AgentDoom Launch | Reddit (r/SideProject, r/webdev, r/MachineLearning) | Scheduled | Apr 3, staggered | $0 | — | — | — | — | — |
| AgentDoom Launch | Waitlist Email | Scheduled | Apr 3, 9AM PT | $0 | — | — | — | — | — |
| Teaser tweets (10x) | X/Twitter @Build_Like_Bob | Pending Kosta approval | Pre-launch | $0 | — | — | — | — | — |

*Update this table after launch with real metrics.*

---

## 4. Content Calendar

### Pre-Launch (April 2, 2026 — TONIGHT)

| Time (PT) | Action | Platform | Owner | Status |
|-----------|--------|----------|-------|--------|
| 8:00 PM | Final check: landing page live, all links working | agentdoom.ai | Kosta | ⬜ |
| 8:30 PM | Queue waitlist email (scheduled 9AM Apr 3) | Email provider | Kosta | ⬜ |
| 9:00 PM | Pre-write all social posts in drafts | X, Reddit | Kosta | ⬜ |
| 9:30 PM | Verify Product Hunt listing ready in draft | Product Hunt | Kosta | ⬜ |
| 10:00 PM | Verify demo GIF/video ready and uploaded | — | Kosta | ⬜ |
| 11:50 PM | Wake up. Open PH dashboard. | — | Kosta | ⬜ |

### Launch Day (April 3, 2026 — TOMORROW)

| Time (PT) | Action | Platform | Owner | Status |
|-----------|--------|----------|-------|--------|
| 12:01 AM | **PUBLISH Product Hunt listing** | Product Hunt | Kosta | ⬜ |
| 12:02 AM | Post maker comment immediately | Product Hunt | Kosta | ⬜ |
| 5:00 AM | **POST Show HN** | Hacker News | Kosta | ⬜ |
| 6:00 AM | **Post 10-tweet launch thread** | X/Twitter | Kosta | ⬜ |
| 9:00 AM | **Send waitlist email blast** | Email/Beehiiv | Kosta | ⬜ |
| 9:00 AM | Post Reddit — r/SideProject | Reddit | Kosta | ⬜ |
| 10:30 AM | Post Reddit — r/webdev | Reddit | Kosta | ⬜ |
| 12:00 PM | Midday X update: "X tools built, here are the wildest ones" | X/Twitter | Kosta | ⬜ |
| 12:00 PM | Post Reddit — r/MachineLearning | Reddit | Kosta | ⬜ |
| 6:00 PM | Evening X recap: day 1 stats | X/Twitter | Kosta | ⬜ |

### Week 1 Post-Launch

| Date | Theme | Platform | Content Type |
|------|-------|----------|--------------|
| Apr 4 (Fri) | "Look what people built" | X, Reddit | User tool showcases |
| Apr 5 (Sat) | Building in public — behind the scenes | X, Reddit | Technical thread |
| Apr 6 (Sun) | Remix chains — viral mechanic | X | How remixes compound |
| Apr 7 (Mon) | 7-day recap + metrics | X, Reddit, PH | Transparency post |
| Apr 8 (Tue) | Feature spotlight: Marketplace | X | Product education |
| Apr 9 (Wed) | Creator spotlight | X | Community proof |

*Full scripts: `/agentdoom/marketing/launch-plan/04-week1-content-calendar.md`*

---

## 5. Email Marketing Metrics

| Metric | Target | Actual | Platform |
|--------|--------|--------|----------|
| Waitlist subscribers | 4,200+ (stated in copy) | — | Beehiiv |
| Launch email open rate | >40% | — | Beehiiv |
| Launch email CTR | >15% | — | Beehiiv |
| Launch email conversions (signups) | >25% of opens | — | Beehiiv |
| Post-launch drip open rate | >30% | — | Beehiiv |

*Track in Beehiiv dashboard. Update after launch day.*

---

## 6. Social Media Metrics

| Platform | Handle | Followers | Target (30d) | Eng. Rate | Reach | Notes |
|----------|--------|-----------|--------------|-----------|-------|-------|
| X/Twitter | @Build_Like_Bob | — | 1,000 | — | — | Main launch account |
| Product Hunt | AgentDoom | — | Top 5 of Day | — | — | April 3 hunt |
| Hacker News | — | — | Front page | — | — | Show HN April 3 |
| Reddit | r/AgentDoom | — | 500 subs | — | — | Needs to be created |
| Instagram | @agentdoom | — | 500 | — | — | Handle not yet claimed |
| TikTok | @agentdoom | — | — | — | — | Handle not yet claimed |
| LinkedIn | AgentDoom | — | 200 | — | — | Company page not yet created |
| YouTube | @AgentDoomAI | — | — | — | — | @AgentDoom taken |
| Discord | AgentDoom server | — | 200 | — | — | Server not yet created |

*Handle acquisition status: See [UNPA-468](/UNPA/issues/UNPA-468) — blocked on Kosta.*

---

## 7. Key Asset Index

| Asset | Location | Status | Owner |
|-------|----------|--------|-------|
| Launch tweets (10x) | `/agentdoom/marketing/launch-tweets.md` | ✅ Ready | Echo |
| Twitter teaser queue | `/agentdoom/marketing/tweet-queue-launch-teasers.md` | ⚠️ Pending Kosta approval | Echo |
| X thread (launch day) | `/agentdoom/marketing/launch-day/01-twitter-thread.md` | ✅ Ready | Echo |
| Reddit posts | `/agentdoom/marketing/launch-day/02-reddit-posts.md` | ✅ Ready | Echo |
| HN Show HN draft | `/agentdoom/marketing/launch-day/03-hackernews-show-hn.md` | ✅ Ready | Echo |
| Product Hunt draft | `/agentdoom/marketing/launch-day/04-producthunt-draft.md` | ✅ Ready | Echo |
| Waitlist launch email | `/agentdoom/marketing/launch-day/05-waitlist-email.md` | ✅ Ready | Echo |
| Landing page copy | `/agentdoom/marketing/landing-page.md` | ✅ Ready | Echo |
| Pricing page content | `/agentdoom/marketing/pricing-content.md` | ✅ Ready | Echo |
| Launch day schedule | `/agentdoom/marketing/launch-plan/01-launch-day-schedule.md` | ✅ Ready | Echo |
| PH optimization guide | `/agentdoom/marketing/launch-plan/02-producthunt-optimization.md` | ✅ Ready | Echo |
| HN strategy | `/agentdoom/marketing/launch-plan/03-hackernews-strategy.md` | ✅ Ready | Echo |
| Week 1 content calendar | `/agentdoom/marketing/launch-plan/04-week1-content-calendar.md` | ✅ Ready | Echo |
| ReelFarm UGC scripts (5x) | UNPA-467 plan doc | ✅ Written, blocked on ReelFarm access | Echo |
| Logo upgrades | UNPA-488 (Cipher) | 🔄 In progress | Cipher |

---

## 8. Ledger Handoff — Financial Tracking

> @Ledger owns: ad spend, revenue, unit economics per product

Metrics for Ledger to track:

| Metric | Product | Frequency |
|--------|---------|-----------|
| MRR | AgentDoom | Monthly |
| CAC by channel | AgentDoom | Per campaign |
| LTV | AgentDoom | Monthly cohort |
| Marketplace GMV | AgentDoom | Daily during launch week |
| Platform fee revenue (15-20%) | AgentDoom | Daily during launch week |
| Ad spend | All products | Per campaign |
| Vercel hosting costs | All products | Monthly |
| Domain costs | All domains | Annual (tracked in namecheap.md) |

---

## 9. Open Action Items (Kosta)

| # | Action | Urgency | Notes |
|---|--------|---------|-------|
| 1 | Approve teaser tweet queue in Slack #nero | 🔴 TODAY | `/agentdoom/marketing/tweet-queue-launch-teasers.md` |
| 2 | Claim social handles: Instagram, TikTok, LinkedIn, Reddit, Discord | 🔴 TODAY | All likely available — details in [UNPA-468](/UNPA/issues/UNPA-468) |
| 3 | Follow launch day schedule exactly | 🔴 TOMORROW | See Section 4 above |
| 4 | Upload this doc to Google Drive or Notion and share link in Slack #nero | 🟡 TODAY | Echo can't access Google/Notion directly |
| 5 | Set up Beehiiv newsletter account if not done | 🟡 TODAY | Needed for email blast |
| 6 | Verify agentdoom.ai DNS → Vercel A record is live | 🔴 TODAY | DNS setup needed per namecheap.md |
| 7 | Verify pricing page is live at agentdoom.ai/pricing | 🟡 TODAY | Content ready, needs Sama to implement |
