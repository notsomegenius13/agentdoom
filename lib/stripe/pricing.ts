/**
 * Pricing intelligence — suggest prices for tools based on category and complexity.
 */

/** Price suggestion range in cents. */
interface PriceSuggestion {
  suggestedCents: number
  minCents: number
  maxCents: number
  rationale: string
}

const CATEGORY_PRICING: Record<string, { base: number; min: number; max: number }> = {
  calculator: { base: 300, min: 300, max: 999 },
  converter: { base: 300, min: 300, max: 799 },
  generator: { base: 500, min: 300, max: 1499 },
  quiz: { base: 500, min: 300, max: 999 },
  tracker: { base: 799, min: 300, max: 1999 },
  form: { base: 799, min: 500, max: 2499 },
  dashboard: { base: 999, min: 500, max: 4999 },
  'stats-dashboard': { base: 1499, min: 799, max: 4999 },
  checklist: { base: 300, min: 300, max: 799 },
  poll: { base: 300, min: 300, max: 799 },
  timer: { base: 300, min: 300, max: 599 },
  table: { base: 500, min: 300, max: 1499 },
  'card-grid': { base: 500, min: 300, max: 999 },
  'template-renderer': { base: 799, min: 500, max: 2499 },
  'split-calculator': { base: 500, min: 300, max: 999 },
  'price-list': { base: 500, min: 300, max: 999 },
}

const DEFAULT_PRICING = { base: 500, min: 300, max: 1999 }

/**
 * Suggest a price for a tool based on its category and complexity score (0-1).
 */
export function suggestPrice(category: string, complexityScore: number): PriceSuggestion {
  const tier = CATEGORY_PRICING[category] || DEFAULT_PRICING
  const clampedComplexity = Math.max(0, Math.min(1, complexityScore))

  // Scale within the tier range based on complexity
  const range = tier.max - tier.min
  const suggested = Math.round((tier.min + range * clampedComplexity) / 100) * 100 // Round to nearest dollar
  const suggestedCents = Math.max(tier.min, Math.min(tier.max, suggested || tier.base))

  return {
    suggestedCents,
    minCents: tier.min,
    maxCents: tier.max,
    rationale: `Based on ${category} tools (complexity ${Math.round(clampedComplexity * 100)}%). Recommended range: $${(tier.min / 100).toFixed(2)}–$${(tier.max / 100).toFixed(2)}.`,
  }
}
