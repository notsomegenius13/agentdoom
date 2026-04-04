/**
 * Forge: Intent Classification (Haiku)
 * Classifies user prompt into category + complexity + required primitives
 */

import { complete } from '@/lib/models'
import { getClassifierPrimitives } from './primitive-registry'

export interface ClassificationResult {
  category: string
  complexity: number // 1-10
  primitives: string[]
  suggestedTitle: string
}

const AVAILABLE_PRIMITIVES = getClassifierPrimitives()

const CATEGORIES = [
  'money',
  'productivity',
  'social',
  'creator',
  'business',
  'utility',
] as const

const CLASSIFICATION_SYSTEM = `You are an intent classifier for AgentDoom, a platform that builds software tools from natural language prompts.

Given a user prompt, respond with a JSON object containing:
1. "category": one of ${JSON.stringify([...CATEGORIES])}
2. "complexity": integer 1-10 (1=simple single-primitive tool, 5=multi-primitive with logic, 10=complex multi-step workflow)
3. "primitives": array of required primitives from ${JSON.stringify([...AVAILABLE_PRIMITIVES])} — select 1-4 that best serve the tool
4. "suggestedTitle": a short, catchy title (max 6 words) for the generated tool

Rules:
- ONLY use primitives from the list above
- Select the MINIMUM primitives needed — fewer is better
- complexity 1-3: single primitive tools (calculator, simple form, timer)
- complexity 4-6: 2-3 primitives combined (form + table, calculator + chart)
- complexity 7-10: 3-4 primitives with complex interactions

Respond with ONLY valid JSON. No explanation, no markdown fences.`

export async function classifyPrompt(prompt: string): Promise<ClassificationResult> {
  const response = await complete({
    task: 'classify',
    system: CLASSIFICATION_SYSTEM,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content.trim()
  // Strip markdown fences if model includes them despite instructions
  const jsonStr = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')

  const parsed = JSON.parse(jsonStr) as ClassificationResult

  // Validate and clamp
  if (!CATEGORIES.includes(parsed.category as typeof CATEGORIES[number])) {
    parsed.category = 'utility'
  }
  parsed.complexity = Math.max(1, Math.min(10, Math.round(parsed.complexity)))
  parsed.primitives = parsed.primitives.filter((p) =>
    AVAILABLE_PRIMITIVES.includes(p)
  )
  if (parsed.primitives.length === 0) {
    parsed.primitives = ['form']
  }

  return parsed
}
