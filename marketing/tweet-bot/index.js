#!/usr/bin/env node
'use strict';

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const crypto = require('crypto');
const { App } = require('@slack/bolt');

// ── Config ─────────────────────────────────────────────────────────────────

const TWEET_QUEUE_FILE = path.resolve(
  __dirname,
  '../tweet-queue-launch-teasers.md'
);
const STATE_FILE = path.resolve(__dirname, 'tweet-state.json');
const TWITTER_CHANNEL = 'twitter';

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_APP_TOKEN = process.env.SLACK_APP_TOKEN;

const TWITTER_API_KEY = process.env.TWITTER_API_KEY;
const TWITTER_API_SECRET = process.env.TWITTER_API_SECRET;
const TWITTER_ACCESS_TOKEN = process.env.TWITTER_ACCESS_TOKEN;
const TWITTER_ACCESS_TOKEN_SECRET = process.env.TWITTER_ACCESS_TOKEN_SECRET;

// ── State ───────────────────────────────────────────────────────────────────

function loadState() {
  if (!fs.existsSync(STATE_FILE)) return { tweets: {}, channelId: null };
  return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ── Tweet Queue Parser ──────────────────────────────────────────────────────

function parseTweetQueue(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const tweets = [];

  // match blocks like: **Tweet NN**\n<text>\n---
  const blockRe = /\*\*Tweet\s+(\d+)\*\*\n([\s\S]*?)(?=\n---|\n##|\n\*\*Tweet|\s*$)/g;
  let m;
  while ((m = blockRe.exec(raw)) !== null) {
    const num = parseInt(m[1], 10);
    const text = m[2].trim();
    if (text) tweets.push({ num, text });
  }

  return tweets;
}

// ── Slack Helpers ───────────────────────────────────────────────────────────

async function ensureChannel(client) {
  // look up existing channel across all pages
  let cursor;
  do {
    const args = { limit: 200, exclude_archived: true };
    if (cursor) args.cursor = cursor;
    const list = await client.conversations.list(args);
    const existing = list.channels.find(c => c.name === TWITTER_CHANNEL);
    if (existing) return existing.id;
    cursor = list.response_metadata?.next_cursor;
  } while (cursor);

  // try to create it — may fail if bot lacks channels:write scope
  try {
    const created = await client.conversations.create({ name: TWITTER_CHANNEL, is_private: false });
    console.log(`[slack] created #${TWITTER_CHANNEL} (${created.channel.id})`);
    return created.channel.id;
  } catch (err) {
    if (err.data?.error === 'missing_scope') {
      throw new Error(
        `#${TWITTER_CHANNEL} channel does not exist and the bot lacks channels:write scope to create it.\n` +
        `Please create #twitter in Slack manually, then re-run.`
      );
    }
    throw err;
  }
}

async function postTweetToSlack(client, channelId, tweet) {
  const result = await client.chat.postMessage({
    channel: channelId,
    text: `*Tweet ${tweet.num}*\n\n${tweet.text}\n\n✅ react to approve and post to X`,
  });
  return result.ts; // message timestamp = message ID in Slack
}

// ── Twitter / X OAuth 1.0a ─────────────────────────────────────────────────

function oauthSign(method, url, params) {
  const oauthParams = {
    oauth_consumer_key: TWITTER_API_KEY,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: TWITTER_ACCESS_TOKEN,
    oauth_version: '1.0',
  };

  const allParams = { ...params, ...oauthParams };
  const sortedKeys = Object.keys(allParams).sort();
  const paramStr = sortedKeys
    .map(k => `${pctEncode(k)}=${pctEncode(allParams[k])}`)
    .join('&');

  const baseStr = [method.toUpperCase(), pctEncode(url), pctEncode(paramStr)].join('&');
  const sigKey = `${pctEncode(TWITTER_API_SECRET)}&${pctEncode(TWITTER_ACCESS_TOKEN_SECRET)}`;
  const signature = crypto.createHmac('sha1', sigKey).update(baseStr).digest('base64');

  oauthParams.oauth_signature = signature;
  const header =
    'OAuth ' +
    Object.keys(oauthParams)
      .sort()
      .map(k => `${pctEncode(k)}="${pctEncode(oauthParams[k])}"`)
      .join(', ');

  return header;
}

function pctEncode(str) {
  return encodeURIComponent(String(str)).replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

function httpsPost(url, body, headers) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const isHttps = parsed.protocol === 'https:';
    const lib = isHttps ? https : http;
    const data = JSON.stringify(body);
    const opts = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...headers,
      },
    };
    const req = lib.request(opts, res => {
      let buf = '';
      res.on('data', d => (buf += d));
      res.on('end', () => resolve({ status: res.statusCode, body: buf }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function postTweetToX(text) {
  const url = 'https://api.twitter.com/2/tweets';
  const body = { text };
  const authHeader = oauthSign('POST', url, {});
  const res = await httpsPost(url, body, { Authorization: authHeader });
  if (res.status >= 400) {
    throw new Error(`X API error ${res.status}: ${res.body}`);
  }
  return JSON.parse(res.body);
}

// ── Main Bot Logic ──────────────────────────────────────────────────────────

async function postPendingTweetsToSlack(client, channelId) {
  const state = loadState();
  const tweets = parseTweetQueue(TWEET_QUEUE_FILE);
  let posted = 0;

  for (const tweet of tweets) {
    const key = `tweet_${tweet.num}`;
    if (state.tweets[key]) continue; // already queued/posted

    console.log(`[bot] posting tweet ${tweet.num} to #${TWITTER_CHANNEL}`);
    const ts = await postTweetToSlack(client, channelId, tweet);

    state.tweets[key] = { status: 'pending', ts, text: tweet.text, num: tweet.num };
    saveState(state);
    posted++;

    // small delay between posts to avoid rate limits
    await new Promise(r => setTimeout(r, 800));
  }

  console.log(`[bot] posted ${posted} new tweet(s) to Slack`);
  return posted;
}

async function handleCheckmark(client, channelId, messageTs) {
  const state = loadState();

  // find the tweet by ts
  const entry = Object.values(state.tweets).find(t => t.ts === messageTs);
  if (!entry) {
    console.log(`[bot] no tweet found for ts ${messageTs}`);
    return;
  }
  if (entry.status === 'posted') {
    console.log(`[bot] tweet ${entry.num} already posted, skipping`);
    return;
  }

  console.log(`[bot] ✅ approved — posting tweet ${entry.num} to X`);

  try {
    const result = await postTweetToX(entry.text);
    const tweetId = result?.data?.id;
    const tweetUrl = tweetId ? `https://twitter.com/i/web/status/${tweetId}` : null;

    entry.status = 'posted';
    entry.xTweetId = tweetId;
    saveState(state);

    const confirmMsg = tweetUrl
      ? `posted: ${entry.text.slice(0, 60)}…\n${tweetUrl}`
      : `posted: ${entry.text.slice(0, 80)}…`;

    await client.chat.postMessage({ channel: channelId, thread_ts: messageTs, text: confirmMsg });
    console.log(`[bot] tweet ${entry.num} posted to X — ${tweetUrl || 'no url'}`);
  } catch (err) {
    console.error(`[bot] failed to post tweet ${entry.num}:`, err.message);
    await client.chat.postMessage({
      channel: channelId,
      thread_ts: messageTs,
      text: `failed to post tweet ${entry.num}: ${err.message}`,
    });
  }
}

// ── Boot ────────────────────────────────────────────────────────────────────

async function main() {
  const isPostMode = process.argv.includes('--post');

  if (!SLACK_BOT_TOKEN || !SLACK_APP_TOKEN) {
    console.error('[bot] SLACK_BOT_TOKEN and SLACK_APP_TOKEN are required');
    process.exit(1);
  }
  if (!TWITTER_API_KEY || !TWITTER_API_SECRET || !TWITTER_ACCESS_TOKEN || !TWITTER_ACCESS_TOKEN_SECRET) {
    console.error('[bot] Twitter API credentials are required');
    process.exit(1);
  }

  const app = new App({
    token: SLACK_BOT_TOKEN,
    appToken: SLACK_APP_TOKEN,
    socketMode: true,
  });

  await app.start();
  console.log('[bot] connected to Slack via Socket Mode');

  const channelId = await ensureChannel(app.client);
  console.log(`[bot] #${TWITTER_CHANNEL} channel id: ${channelId}`);

  // persist channel id
  const state = loadState();
  state.channelId = channelId;
  saveState(state);

  if (isPostMode) {
    // one-shot: post all pending tweets to Slack then exit
    const count = await postPendingTweetsToSlack(app.client, channelId);
    console.log(`[bot] --post mode done, posted ${count} tweet(s)`);
    await app.stop();
    process.exit(0);
  }

  // watch mode: post pending tweets then listen for ✅ reactions
  await postPendingTweetsToSlack(app.client, channelId);

  // listen for reaction_added
  app.event('reaction_added', async ({ event }) => {
    if (event.reaction !== 'white_check_mark') return;
    if (event.item.type !== 'message') return;
    if (event.item.channel !== channelId) return;

    console.log(`[bot] ✅ reaction on ts=${event.item.ts} by user=${event.user}`);
    await handleCheckmark(app.client, channelId, event.item.ts);
  });

  console.log('[bot] watching for ✅ reactions in #twitter — ctrl+c to stop');
}

main().catch(err => {
  console.error('[bot] fatal:', err);
  process.exit(1);
});
