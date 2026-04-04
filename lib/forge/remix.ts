/**
 * Forge: AI-Powered Remix
 * Takes an existing tool config + natural language modification prompt
 * and generates an updated config via Sonnet.
 *
 * This is faster than fresh generation because:
 * - No classification needed (we already have category + primitives)
 * - The model starts from a working config rather than from scratch
 * - Constrained output: only modify what the user asked for
 */

import { complete } from '@/lib/models'
import type { ToolConfig } from './generate'

export interface RemixRequest {
  /** The existing tool's configuration */
  sourceConfig: ToolConfig
  /** Natural language description of desired changes */
  modificationPrompt: string
  /** Original tool's category (used for context) */
  category?: string
}

export interface RemixResult {
  config: ToolConfig
  model: string
  latencyMs: number
  cost: number
}

const REMIX_SYSTEM = `You are Forge, the remix engine for AgentDoom. You modify existing tool configurations based on user requests.

## Your Task
You receive an existing tool config (JSON) and a modification prompt. Generate an UPDATED config that applies the requested changes while preserving the tool's working structure.

## Rules
1. Output ONLY valid JSON matching the ToolConfig schema. No explanation, no markdown fences.
2. PRESERVE everything the user did NOT ask to change — structure, working formulas, data.
3. You may add, remove, or modify primitives if the modification requires it.
4. You may add new primitive types if the modification clearly calls for them.
5. Keep the tool functional — don't break formulas, references, or data relationships.
6. If the user asks for a theme/color change, only modify the theme object.
7. If the user asks for new content, add it while keeping existing content intact unless replacement is implied.
8. Keep titles short (max 6 words), descriptions under 20 words.
9. Always use "system-ui, sans-serif" for fontFamily unless the prompt suggests otherwise.
10. Limit to 1-4 primitives max. Simpler is better.

## ToolConfig Schema
{
  "title": "string",
  "description": "string",
  "primitives": [{ "type": "string", "id": "string", "props": {}, "position": number }],
  "layout": { "type": "single-column|two-column|stacked|full-width", "maxWidth": "string", "padding": "string" },
  "theme": { "primaryColor": "string", "backgroundColor": "string", "fontFamily": "string", "borderRadius": "string" }
}`

/**
 * Generate a modified tool config from an existing config + modification prompt.
 * Uses the 'generate' model task (Sonnet) for speed.
 */
export async function remixToolConfig(req: RemixRequest): Promise<RemixResult> {
  const { sourceConfig, modificationPrompt, category } = req
  const start = performance.now()

  const response = await complete({
    task: 'generate',
    system: REMIX_SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Here is the current tool configuration:

${JSON.stringify(sourceConfig, null, 2)}

${category ? `Category: ${category}\n` : ''}The user wants: ${modificationPrompt}

Generate the updated tool configuration JSON.`,
      },
    ],
  })

  const text = response.content.trim()
  const jsonStr = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  const config = JSON.parse(jsonStr) as ToolConfig

  return {
    config,
    model: response.model,
    latencyMs: Math.round(performance.now() - start),
    cost: response.cost,
  }
}
