# AgentDoom Launch Countdown

_Launch: Sunday April 6, 2026 at 12:01 AM PT (Product Hunt) / 9:00 AM PT (email)_
_Compiled: April 3, 2026 — T-3_

---

## CRITICAL BLOCKERS (must be resolved before launch)

These are hard gates. Nothing ships cleanly without them.

| #   | Blocker                                                                                                                                                           | Owner      | Urgency         |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | --------------- |
| 1   | **Twitter API upgrade** — @Build_Like_Bob dev app is on free tier, 402 errors on write. Upgrade to Basic ($100/mo) at developer.x.com to enable scheduled posting | Kosta      | **T-3 (today)** |
| 2   | **NEXTAUTH_SECRET** not set on Vercel production                                                                                                                  | Kosta/Sama | **T-3 (today)** |
| 3   | **NEXTAUTH_URL** not set on Vercel production                                                                                                                     | Kosta/Sama | **T-3 (today)** |
| 4   | **STRIPE_WEBHOOK_SECRET** not set on Vercel                                                                                                                       | Kosta/Sama | **T-2**         |
| 5   | **NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID** not set on Vercel                                                                                                     | Kosta/Sama | **T-2**         |
| 6   | **NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID** not set on Vercel                                                                                                      | Kosta/Sama | **T-2**         |
| 7   | **RESEND_API_KEY** not provisioned — waitlist email blast won't fire                                                                                              | Kosta/Sama | **T-2**         |
| 8   | **CRON_SECRET** not set on Vercel — cron jobs broken                                                                                                              | Sama       | **T-2**         |
| 9   | **ADMIN_API_KEY** not set on Vercel — admin routes broken                                                                                                         | Sama       | **T-2**         |
| 10  | **Redis (Upstash)** not provisioned — rate limiting inactive                                                                                                      | Sama       | **T-1**         |

---

## T-3 — Friday April 3 (TODAY)

**Goal: Clear the two hardest auth/infra blockers. Finalize all social content.**

### Kosta

- [ ] Upgrade Twitter/X dev app to Basic tier ($100/mo) at developer.x.com → unblocks automated tweet posting
- [ ] Set `NEXTAUTH_SECRET` on Vercel production env (generate: `openssl rand -base64 32`)
- [ ] Set `NEXTAUTH_URL=https://agentdoom.ai` on Vercel production env
- [ ] Review and approve Tweet 12 ("10 seconds from english sentence to live url...") for posting today — Batch D is now in window
- [ ] Approve Tweet 13 ("been quiet on here for a few weeks...") for tomorrow

### Sama

- [ ] Verify `next build` still exits 0 after latest merges
- [ ] Confirm agentdoom.ai is resolving and serving from Vercel prod

### Echo (Marketing)

- [x] All tweet batches A–D written and ready (marketing/PRELAUNCH_TWEETS.md)
- [x] Product Hunt listing drafted and ready to submit (marketing/product-hunt-draft.md)
- [x] Launch email sequence written (marketing/launch-email.md)
- [x] Launch day schedule finalized (marketing/launch-day-schedule.md)
- [x] HN Show HN post + first comment template ready (marketing/launch-day/03-hackernews-show-hn.md)
- [x] Reddit posts written for all 3 subreddits (marketing/launch-day/02-reddit-posts.md)
- [ ] Post Tweet 12 once Twitter API is unblocked (or post manually if still blocked tonight)

---

## T-2 — Saturday April 4

**Goal: All env vars set, Stripe live, email staged. Do final end-to-end test.**

### Kosta/Sama

- [ ] Set `STRIPE_WEBHOOK_SECRET` on Vercel
- [ ] Set `NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID` on Vercel
- [ ] Set `NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID` on Vercel
- [ ] Provision Resend account + set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` on Vercel
- [ ] Set `CRON_SECRET` and `ADMIN_API_KEY` on Vercel
- [ ] End-to-end test: sign up → create tool → view in feed → (optional) checkout flow

### Kosta

- [ ] Post Tweet 13 ("been quiet on here...") — name-drops nothing, pure curiosity
- [ ] Post Tweet 14 ("there's a feed launching monday...") — names agentdoom.ai, schedule for 9:00 AM PT
- [ ] Stage waitlist email in Beehiiv — schedule for April 6 at 9:00 AM PT
- [ ] Upload Product Hunt assets (thumbnail, gallery images, demo GIF if available)
- [ ] Pre-write Reddit posts as drafts in r/SideProject, r/startups, r/artificial

### Echo

- [ ] Draft midday and evening X update copy for launch day (personalize with actual stats slot)
- [ ] Confirm Beehiiv waitlist is connected and receiving sends

---

## T-1 — Saturday Evening / Sunday April 5–6 Pre-Launch

**Goal: Everything queued. Site verified. Product Hunt listing polished. Sleep.**

| Time (PT)    | Task                                                                                                    | Owner |
| ------------ | ------------------------------------------------------------------------------------------------------- | ----- |
| 8:00 PM Sat  | Final check: agentdoom.ai live, all links working, pricing active                                       | Kosta |
| 8:30 PM Sat  | Confirm waitlist email staged in Beehiiv for April 6 at 9:00 AM PT                                      | Kosta |
| 9:00 PM Sat  | Queue full 10-tweet launch thread in X scheduler (fires 6:00 AM PT Sunday, 2 min apart)                 | Kosta |
| 9:00 PM Sat  | Post Tweet 15 ("something is launching tomorrow...")                                                    | Kosta |
| 9:30 PM Sat  | Verify Product Hunt listing in draft mode — all assets uploaded, description correct                    | Kosta |
| 10:00 PM Sat | Provision Upstash Redis free tier → set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` on Vercel | Sama  |
| 10:30 PM Sat | Pre-write Reddit posts in drafts across all 3 subreddits (do NOT post yet)                              | Kosta |
| 11:00 PM Sat | Sleep. Set alarm for 11:45 PM PT.                                                                       | Kosta |

---

## T-0 — Sunday April 6 (LAUNCH DAY)

Full sequence in marketing/launch-day-schedule.md. Summary:

| Time (PT)    | Milestone                                                                              |
| ------------ | -------------------------------------------------------------------------------------- |
| **12:01 AM** | **PUBLISH Product Hunt listing** — hardest deadline                                    |
| 12:02 AM     | Post maker comment (within 60 sec of publish)                                          |
| 12:05 AM     | DM 5–10 PH contacts                                                                    |
| **5:00 AM**  | **POST Show HN** — "Show HN: AgentDoom – TikTok-style feed of AI-built software tools" |
| 5:01 AM      | Post first HN technical comment                                                        |
| **6:00 AM**  | **Tweet thread fires** (pre-queued, 10 tweets, 2 min apart)                            |
| 6:21 AM      | Pin tweet 1 to profile                                                                 |
| **7:00 AM**  | **POST r/SideProject**                                                                 |
| **9:00 AM**  | **Waitlist email fires** (pre-scheduled in Beehiiv)                                    |
| **9:00 AM**  | **POST r/startups**                                                                    |
| **11:00 AM** | **POST r/artificial**                                                                  |
| 12:00 PM     | Midday X update with real stats                                                        |
| 6:00 PM      | Evening X recap with real numbers                                                      |

### Launch Day Emergency Contacts

- Site down → ping Sama immediately
- Twitter API still broken → post all tweets manually from @Build_Like_Bob
- HN flagged → shift focus to PH/X/Reddit, do not repost

---

## Content Readiness Summary

| Asset                                | Status      | File                                              |
| ------------------------------------ | ----------- | ------------------------------------------------- |
| Teaser tweets (Batch A–D, 15 tweets) | Ready       | marketing/PRELAUNCH_TWEETS.md                     |
| Launch day tweet thread (10 tweets)  | Ready       | marketing/launch-day/01-twitter-thread.md         |
| Product Hunt listing + maker comment | Ready       | marketing/product-hunt-draft.md                   |
| Show HN post + first comment         | Ready       | marketing/launch-day/03-hackernews-show-hn.md     |
| Reddit posts (3 subreddits)          | Ready       | marketing/launch-day/02-reddit-posts.md           |
| Launch email (Day 1)                 | Ready       | marketing/launch-email.md                         |
| Launch email (Day 3 + Day 7)         | Ready       | marketing/launch-email.md                         |
| Launch day schedule                  | Ready       | marketing/launch-day-schedule.md                  |
| Week 1 content calendar              | Ready       | marketing/launch-day/04-week1-content-calendar.md |
| Beehiiv email staged                 | **Pending** | Kosta to schedule T-2                             |
| Product Hunt assets uploaded         | **Pending** | Kosta to upload T-2                               |

---

## Twitter API Status

**Currently blocked.** @Build_Like_Bob dev app is on free tier — no write access.

**Resolution:** Kosta upgrades to Basic tier ($100/mo) at developer.x.com.

**Manual fallback:** If not resolved by April 5, Kosta posts all tweets manually from @Build_Like_Bob. The content is ready — no automation required if posting by hand. Launch is NOT blocked on this technically, only on automation convenience.
