/**
 * Forge: Tool Generation (Sonnet)
 * Takes classified intent + primitive schemas → generates tool configuration
 */

import { complete } from '@/lib/models'
import { getPrimitiveSchemas } from './primitive-registry'

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
  type: 'single-column' | 'two-column' | 'stacked' | 'full-width'
  maxWidth: string
  padding: string
}

export interface ThemeConfig {
  primaryColor: string
  backgroundColor: string
  fontFamily: string
  borderRadius: string
}

/**
 * Schema definitions for each primitive type — sourced from the registry.
 * To add or modify a primitive, edit lib/forge/primitive-registry.ts.
 */
const PRIMITIVE_SCHEMAS = getPrimitiveSchemas()

const FEW_SHOT_EXAMPLES = `
Example 1 — "Build a tip calculator"
{
  "title": "Tip Calculator",
  "description": "Calculate tip and split the bill between friends",
  "primitives": [
    { "type": "calculator", "id": "tip-calc", "props": { "title": "Tip Calculator", "inputs": [{ "name": "bill", "label": "Bill Amount ($)", "type": "number", "defaultValue": 50, "min": 0, "step": 0.01 }, { "name": "tipPercent", "label": "Tip %", "type": "select", "options": [{ "label": "15%", "value": 15 }, { "label": "18%", "value": 18 }, { "label": "20%", "value": 20 }, { "label": "25%", "value": 25 }] }, { "name": "people", "label": "Split Between", "type": "number", "defaultValue": 1, "min": 1, "max": 20 }], "formula": "(bill * (1 + tipPercent / 100)) / people", "resultLabel": "Per Person", "resultPrefix": "$", "resultSuffix": "" }, "position": 0 }
  ],
  "layout": { "type": "single-column", "maxWidth": "480px", "padding": "24px" },
  "theme": { "primaryColor": "#10b981", "backgroundColor": "#f8fafc", "fontFamily": "system-ui, sans-serif", "borderRadius": "12px" }
}

Example 2 — "Make a packing checklist for travel"
{
  "title": "Travel Packing Checklist",
  "description": "Never forget essentials when packing for a trip",
  "primitives": [
    { "type": "checklist", "id": "packing", "props": { "title": "Packing List", "categories": [{ "name": "Essentials", "items": ["Passport/ID", "Phone charger", "Wallet", "Medications", "Keys"] }, { "name": "Clothing", "items": ["Underwear", "Socks", "T-shirts", "Pants/shorts", "Jacket"] }, { "name": "Toiletries", "items": ["Toothbrush", "Deodorant", "Sunscreen", "Shampoo"] }], "showProgress": true }, "position": 0 }
  ],
  "layout": { "type": "single-column", "maxWidth": "520px", "padding": "24px" },
  "theme": { "primaryColor": "#3b82f6", "backgroundColor": "#f0f9ff", "fontFamily": "system-ui, sans-serif", "borderRadius": "12px" }
}
`

const GENERATION_SYSTEM = `You are Forge, the generation engine for AgentDoom — a platform that builds deployed web tools from natural language.

You receive a user prompt, a category, and a list of required primitives. You generate a JSON configuration that wires these primitives into a working tool.

## Available Primitive Schemas

${Object.entries(PRIMITIVE_SCHEMAS)
  .map(([key, schema]) => `### ${key}\n${JSON.stringify(schema, null, 2)}`)
  .join('\n\n')}

## Few-Shot Examples
${FEW_SHOT_EXAMPLES}

## Rules
1. Output ONLY valid JSON matching the ToolConfig schema. No explanation, no markdown fences.
2. Use ONLY the primitives listed in the "Available primitives" from the user message.
3. Fill in realistic, useful default data and props — the tool should be immediately usable.
4. Keep titles short (max 6 words), descriptions under 20 words.
5. For calculators, write the formula as a valid JavaScript expression using input names as variables.
6. For generators, provide 3-5 template patterns that give varied, useful output.
7. Choose colors that match the tool's vibe (finance=green, productivity=blue, creative=purple, etc).
8. Always use "system-ui, sans-serif" for fontFamily unless the prompt suggests otherwise.
9. Default borderRadius to "12px" and padding to "24px".
10. Limit to 1-3 primitives max. Simpler is better.`

export async function generateToolConfig(
  prompt: string,
  category: string,
  primitives: string[]
): Promise<ToolConfig> {
  const schemasForPrimitives = primitives
    .filter((p) => PRIMITIVE_SCHEMAS[p])
    .map((p) => `${p}: ${JSON.stringify(PRIMITIVE_SCHEMAS[p])}`)
    .join('\n')

  const response = await complete({
    task: 'generate',
    system: GENERATION_SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Generate a tool for this prompt: "${prompt}"
Category: ${category}
Available primitives: ${primitives.join(', ')}

Primitive schemas for reference:
${schemasForPrimitives}`,
      },
    ],
  })

  const text = response.content.trim()
  const jsonStr = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  return JSON.parse(jsonStr) as ToolConfig
}
