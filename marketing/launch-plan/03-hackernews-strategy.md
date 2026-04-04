# Hacker News Launch Strategy

## Show HN Title Options (A/B)

**Option A (Primary):**
> Show HN: AgentDoom – TikTok-style feed of AI-built software tools

- 58 characters. Under 80-char limit.
- "TikTok-style" is polarizing but attention-grabbing. HN loves to debate consumer analogies.
- "AI-built software tools" is concrete, not vague.

**Option B (Backup — if Option A gets flagged or sinks):**
> Show HN: AgentDoom – Generate, deploy, and remix web tools from natural language

- 74 characters. More descriptive, less clickbait-y.
- Use this if re-posting next week after Option A fails.

**Option C (Technical angle — for a second attempt if needed):**
> Show HN: Component primitives for AI tool generation (~95% first-attempt success)

- Leads with the technical innovation, not the product.
- Better for an HN audience that responds to engineering novelty.

**Recommendation:** Go with **Option A**. The TikTok comparison will generate discussion (even if some is negative), which drives engagement and ranking.

---

## Technical Comment (Ready to Paste)

See: `/Users/jarvis/agentdoom/marketing/launch-day/03-hackernews-show-hn.md` — the first comment is finalized and ready.

**Post within 60 seconds of the Show HN submission.**

---

## Posting Timing

- **Post at 5:00 AM PT (8:00 AM ET)** — this is the sweet spot for US tech audience
- Weekday mornings (Tue-Thu) have highest Show HN visibility
- Thursday April 3 is ideal — avoid Monday (backlog) and Friday (low engagement)

---

## First 2-Hour Monitor Plan (5:00 AM – 7:00 AM PT)

| Time | Action |
|------|--------|
| 5:00 AM | Post Show HN + first comment |
| 5:01–5:10 AM | Verify post is live and visible on /newest and /show |
| 5:10 AM | Check for first comments — respond immediately |
| 5:15 AM | If no comments yet, no action — don't self-promote |
| 5:30 AM | First comment check — respond to everything |
| 5:30–7:00 AM | Check every 10 minutes. Reply to every comment. |
| 6:00 AM | Check ranking — are we on Show HN front page? |
| 6:30 AM | If on front page: keep monitoring. If not: shift focus to X thread. |
| 7:00 AM | Reduce to checking every 20 minutes through noon |

---

## HN Comment Engagement Rules

### DO:
- Be technical and specific. HN rewards depth.
- Acknowledge limitations honestly ("We can't do X yet, here's why")
- Share real numbers (95% success rate, 50+ primitives, sub-5-second generation)
- Engage with criticism constructively
- Ask follow-up questions to commenters
- Share the architecture decision process ("We chose constrained generation because...")

### DON'T:
- Use marketing language ("revolutionary", "game-changing", "disrupting")
- Get defensive about criticism
- Shill the product in replies to other Show HN posts
- Create alt accounts to upvote or comment
- Post the link in other HN threads
- Say "thanks for the feedback!" without substance

### Key Talking Points for Common HN Questions:

**"This is just another AI wrapper"**
> Fair concern. The generation is one layer — the novel part is the distribution model. A feed of live tools with one-tap remix creates a viral loop that doesn't exist in any code gen tool. We're building a platform with network effects, not an API wrapper.

**"Why constrained generation vs. free-form?"**
> We tested both. Free-form code gen gives ~60-70% success on first attempt. Our primitive architecture (50+ pre-built components, AI generates config not code) gets ~95%. The tradeoff is flexibility — single-screen tools only. We think that constraint is the right design choice for this use case.

**"What happens when ChatGPT/Claude Artifacts can do this?"**
> They can generate individual tools, but they lack: (1) a social feed for discovery, (2) remix chains for organic distribution, (3) persistent URLs, (4) a marketplace. The generation is table stakes — the platform is the product.

**"What's the tech stack?"**
> Next.js 14 on Vercel (frontend), Cloudflare Workers (tool hosting, zero cold start), PostgreSQL via Neon, Redis via Upstash, Claude Haiku (classifier, ~50ms) + Claude Sonnet (generator, 3-5s) for the two-tier pipeline.

---

## If the Post Dies Early

If the Show HN doesn't gain traction in the first 2 hours:
1. Don't repost. HN flags reposts.
2. Shift energy to X and Reddit.
3. Wait 7+ days, then try Option B or C title with a different angle (focus on the technical primitive system).
4. Consider writing a standalone blog post about the primitive architecture and submitting that as a regular HN link (not Show HN).
