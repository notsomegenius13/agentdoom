# Morning Briefing: Agent Architecture — Gaps, Fixes, Recommendations

*Prepared overnight for Kosta's review — April 3, 2026*

---

## 🔴 Critical Problems Found Tonight

### 1. No Autonomous Heartbeat Loop
**Problem:** Paperclip has no built-in scheduler. Agents run once, complete, go idle. Nothing wakes them again unless manually triggered or our watchdog cron fires.
**Why it matters:** You saw "0 running" — all 12 agents were idle with 24 open tasks.
**Fix applied:** 5-minute heartbeat cron that wakes Nero/Sama/Echo automatically. But this is session-dependent (dies when Claude exits).
**Permanent fix needed:** Paperclip LaunchAgent-based heartbeat scheduler, or n8n workflow that calls wakeup API every 5 min.

### 2. Issues Created But Never Assigned
**Problem:** When issues are created via Slack bot, they go to the backlog unassigned. Agents check their inbox, see nothing for them, go idle.
**Why it matters:** We created 10+ overnight sprint issues but 0 agents picked them up.
**Fix applied:** Manually assigned issues to specific agents tonight.
**Permanent fix needed:** Nero must assign every issue on creation. Slack bot should ask Nero to decompose and assign within 2 minutes.

### 3. Nero Is Not Proactive
**Problem:** Nero waits to be told what to do. He doesn't decompose directives, doesn't post progress, doesn't reassign stalled agents.
**Why it matters:** Kosta is doing Nero's job — manually checking agents, assigning work, fixing errors.
**Fix applied:** Updated Nero's AGENTS.md with explicit proactive management rules.
**Permanent fix needed:** Nero needs a "management heartbeat" — every cycle he should: check agent status → reassign idle agents → post progress to Slack.

### 4. Stale Session Resume Bug (Recurring)
**Problem:** Paperclip caches Claude session IDs. When a session hits rate limits, it gets cached. Next wakeup tries to --resume that same rate-limited session.
**Why it matters:** Agents show "You've hit your limit" even when account has 73% quota remaining.
**Fix applied:** Watchdog now clears old session files on error recovery.
**Permanent fix needed:** Paperclip update (npm install -g paperclipai@latest) or PR to force fresh sessions after failures.

### 5. Agent Drift (Revenue Factory, Browser Automation)
**Problem:** Agents worked on cancelled/deprioritized items instead of P0-P4.
**Why it matters:** Multiple overnight sprints wasted on browser automation MVP nobody asked for.
**Fix applied:** Explicit whitelist in overnight issues. Cancelled all rogue issues.
**Permanent fix needed:** Nero must enforce a priority stack. Any work not on the active sprint gets rejected.

---

## 🟡 Architecture Gaps to Discuss

### 6. Org Chart Misalignment
The performance review recommended deactivating Vector, Axiom, and Sage — they have overlapping responsibilities and aren't productive. Recommendation:
- **Deactivate:** Vector (full-stack overlap with Sama), Axiom (infra overlap with Cipher)
- **Repurpose Sage:** Dedicated to Karpathy adversarial debates (already on Grok, free)
- **Add roles needed:** Outbound sales agent, customer feedback agent
- This frees 2 Claude slots for higher-value work.

### 7. No Deployment Pipeline
Agents deploy to production without approval. Multiple times tonight, the live agentdoom.ai site was modified without Kosta's sign-off.
**Recommendation:** Vercel preview deploys only. Production requires [DEPLOY APPROVAL] tag in Slack + Kosta's explicit "deploy it."

### 8. No Revenue/Customer Feedback Loop  
12 agents building products. 0 agents talking to customers or measuring revenue.
**Recommendation:** Repurpose one agent as "Growth" — runs daily Stripe revenue check, monitors waitlist signups, reports metrics to #nero every morning.

### 9. Slack Bot Limitations
The bot creates a ticket for EVERY message. No smart routing, no urgency detection.
**Recommendation:** Add Haiku classifier: urgent directive → immediate Nero wake. Question → queue for response. Status check → auto-reply from last heartbeat data.

---

## ✅ What's Working Well
- Paperclip core orchestration (issue tracking, agent management)
- Multi-model diversity (Opus/Sonnet/Codex/Grok/local — saves costs)
- Slack integration for communication
- Agent identity system (SOUL.md files) — agents have clear roles
- Vercel deployment infrastructure
- DNS + email setup (ImprovMX configured for agentdoom.ai)

---

## 🎯 Recommended Morning Actions
1. Review overnight deliverables in #nero
2. Approve/reject tweets in #twitter
3. Decide on org restructure (deactivate Vector/Axiom?)
4. Set up Clerk API keys for AgentDoom auth (the #1 blocker)
5. Finish unpromptedholdings.com DNS (Namecheap was 500ing)
6. Add ImprovMX domains + forwarding (30 seconds, you do it)
7. Review and approve this architecture doc for implementation
