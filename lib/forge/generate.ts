/**
 * Forge: Tool Generation (Sonnet)
 * Takes classified intent + primitive schemas → generates tool configuration
 */

import { complete } from '@/lib/models'

export interface ToolConfig {
  title: string
  description: string
  primitives: PrimitiveConfig[]
  layout: LayoutConfig
  theme: ThemeConfig
}

export interface PrimitiveConfig {
  type: string
  id: string
  props: Record<string, unknown>
  position: number
}

export interface LayoutConfig {
  type: 'single-column' | 'two-column' | 'stacked'
  maxWidth: string
  padding: string
}

export interface ThemeConfig {
  primaryColor: string
  backgroundColor: string
  fontFamily: string
  borderRadius: string
}

const GENERATION_SYSTEM = `You are Forge, the generation engine for AgentDoom.

Given a user prompt and a list of available primitives with their config schemas, generate a complete tool configuration that assembles the primitives into a working single-page app.

Output valid JSON matching the ToolConfig schema:
{
  "title": "string",
  "description": "string",
  "primitives": [{ "type": "string", "id": "string", "props": {}, "position": number }],
  "layout": { "type": "single-column|two-column|stacked", "maxWidth": "string", "padding": "string" },
  "theme": { "primaryColor": "string", "backgroundColor": "string", "fontFamily": "string", "borderRadius": "string" }
}`

export async function generateToolConfig(
  prompt: string,
  category: string,
  primitives: string[]
): Promise<ToolConfig> {
  const response = await complete({
    task: 'generate',
    system: GENERATION_SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Generate a tool for this prompt: "${prompt}"\nCategory: ${category}\nAvailable primitives: ${primitives.join(', ')}`,
      },
    ],
  })

  return JSON.parse(response.content)
}
