/**
 * Forge: Content Moderation (Haiku)
 * Scans every generated tool before it goes live.
 *
 * Checks for: harmful content, copyrighted material, phishing, spam, NSFW, malware.
 * Auto-blocks flagged content and queues for human review.
 */

import { complete } from '@/lib/models'

export type ModerationCategory =
  | 'harmful'
  | 'copyright'
  | 'phishing'
  | 'spam'
  | 'nsfw'
  | 'malware'
  | 'clean'

export type ModerationVerdict = 'pass' | 'block' | 'review'

export interface ModerationFlag {
  category: ModerationCategory
  confidence: number // 0.0 - 1.0
  reason: string
}

export interface ModerationResult {
  verdict: ModerationVerdict
  flags: ModerationFlag[]
  durationMs: number
  model: string
  /** Overall risk score 0-100. Block threshold: 80, review threshold: 40 */
  riskScore: number
}

const MODERATION_SYSTEM = `You are a content moderation classifier for AgentDoom, a platform where users generate web tools from natural language prompts.

Your job: scan the user's prompt, tool title, and generated HTML to detect policy violations.

Prohibited categories:
- "harmful": Violence, self-harm, hate speech, harassment, dangerous activities, weapons
- "copyright": Direct reproduction of copyrighted content (books, songs, trademarked brands used deceptively)
- "phishing": Fake login pages, credential harvesting forms, deceptive URLs, social engineering
- "spam": SEO spam, mass-generated low-quality content, ad injection, clickbait
- "nsfw": Sexually explicit content, nudity, graphic violence
- "malware": Crypto miners, keyloggers, data exfiltration, obfuscated scripts, external resource injection

Respond with a JSON object:
{
  "flags": [
    { "category": "<category>", "confidence": <0.0-1.0>, "reason": "<brief explanation>" }
  ],
  "riskScore": <0-100>
}

Rules:
- If content is clean, return: { "flags": [{ "category": "clean", "confidence": 1.0, "reason": "No policy violations detected" }], "riskScore": 0 }
- Flag EVERY violation found — a tool can have multiple flags
- confidence: how certain you are (0.5 = uncertain, 0.8+ = confident, 0.95+ = definitive)
- riskScore: overall danger level. 0 = safe, 40+ = needs review, 80+ = auto-block
- Be strict on phishing and malware (user safety). Be reasonable on edge cases for other categories.
- A calculator that mentions "tips" is fine. A form that asks for passwords/SSNs is phishing.
- Tools that reference real brands for utility (e.g., "Spotify playlist organizer") are fine. Tools impersonating brands are not.

Respond with ONLY valid JSON. No explanation, no markdown fences.`

/**
 * Moderate a tool before deployment.
 * Scans the prompt, title, and assembled HTML for policy violations.
 */
export async function moderateTool(input: {
  prompt: string
  title: string
  html: string
  category?: string
}): Promise<ModerationResult> {
  const start = Date.now()

  const userMessage = buildModerationInput(input)

  const response = await complete({
    task: 'moderate',
    system: MODERATION_SYSTEM,
    messages: [{ role: 'user', content: userMessage }],
  })

  const text = response.content.trim()
  const jsonStr = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  const parsed = JSON.parse(jsonStr)

  const flags: ModerationFlag[] = (parsed.flags || []).map((f: ModerationFlag) => ({
    category: f.category,
    confidence: Math.max(0, Math.min(1, f.confidence)),
    reason: f.reason || 'No reason provided',
  }))

  const riskScore = Math.max(0, Math.min(100, Math.round(parsed.riskScore || 0)))

  let verdict: ModerationVerdict = 'pass'
  if (riskScore >= 80) {
    verdict = 'block'
  } else if (riskScore >= 40) {
    verdict = 'review'
  }

  return {
    verdict,
    flags,
    durationMs: Date.now() - start,
    model: response.model,
    riskScore,
  }
}

/**
 * Quick pre-screen of the prompt alone (before generation).
 * Catches obviously prohibited prompts early to save generation costs.
 */
export async function preScreenPrompt(prompt: string): Promise<ModerationResult> {
  return moderateTool({
    prompt,
    title: '',
    html: '',
  })
}

function buildModerationInput(input: {
  prompt: string
  title: string
  html: string
  category?: string
}): string {
  const parts = [`<prompt>${input.prompt}</prompt>`]

  if (input.title) {
    parts.push(`<title>${input.title}</title>`)
  }
  if (input.category) {
    parts.push(`<category>${input.category}</category>`)
  }
  if (input.html) {
    // Truncate HTML to stay within token limits — Haiku's 256 max_tokens is for output only
    const truncatedHtml = input.html.length > 8000
      ? input.html.slice(0, 8000) + '\n<!-- [truncated] -->'
      : input.html
    parts.push(`<generated_html>${truncatedHtml}</generated_html>`)
  }

  return parts.join('\n\n')
}
