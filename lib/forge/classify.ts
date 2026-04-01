/**
 * Forge: Intent Classification (Haiku)
 * Classifies user prompt into category + complexity + required primitives
 */

import { complete } from '@/lib/models'

export interface ClassificationResult {
  category: string
  complexity: number // 1-10
  primitives: string[]
  suggestedTitle: string
}

const CLASSIFICATION_SYSTEM = `You are an intent classifier for AgentDoom, a platform that generates software tools from natural language.

Given a user prompt, classify it into:
1. category: one of [money, productivity, social, creator, business, utility]
2. complexity: 1-10 (1=simple calculator, 10=multi-step workflow)
3. primitives: array of required component primitives from [form, table, calculator, tracker, generator, chart, list, timer, quiz, card-grid, checklist, template]
4. suggestedTitle: a short, catchy title for the tool

Respond with valid JSON only.`

export async function classifyPrompt(prompt: string): Promise<ClassificationResult> {
  const response = await complete({
    task: 'classify',
    system: CLASSIFICATION_SYSTEM,
    messages: [{ role: 'user', content: prompt }],
  })

  return JSON.parse(response.content)
}
