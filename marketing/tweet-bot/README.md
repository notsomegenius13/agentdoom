# tweet-bot

posts tweets from the queue to Slack `#twitter` for kosta's approval, then auto-posts to X when he reacts ✅.

## how it works

1. reads `../tweet-queue-launch-teasers.md` and posts each tweet to `#twitter`
2. watches for ✅ (`white_check_mark`) reactions on those messages
3. when kosta reacts ✅, posts the tweet text to @Build_Like_Bob via X API
4. confirms back in the slack thread with the live tweet url
5. tracks state in `tweet-state.json` — won't re-post tweets already queued or sent

## setup

```bash
cd /Users/jarvis/agentdoom/marketing/tweet-bot
npm install
```

credentials are already wired in `.env` — slack uses the nero bot token, twitter uses the @Build_Like_Bob API keys.

## usage

**one-shot — post all pending tweets to Slack, then exit:**
```bash
node index.js --post
```

**watch mode — post pending + keep listening for ✅ reactions:**
```bash
node index.js
```

## state file

`tweet-state.json` tracks every tweet:
- `pending` — posted to Slack, waiting for approval
- `posted` — approved and sent to X

delete or edit `tweet-state.json` to re-queue tweets.

## tweet queue format

tweets are parsed from `tweet-queue-launch-teasers.md` — each block looks like:

```
**Tweet NN**
tweet text here

---
```

## slack channel

the bot auto-creates `#twitter` if it doesn't exist. channel id is stored in `tweet-state.json`.

## notes

- uses the existing nero bot token (no new slack app needed)
- twitter posting uses OAuth 1.0a with Read+Write permission confirmed
- `reaction_added` events only fire if the slack app has `reactions:read` scope — verify this in the slack app config if approvals aren't triggering
