/**
 * Forge: Prompt-to-Config Cache
 * Provides sub-1-second generation for common tool types by matching user prompts
 * against pre-optimized cached templates using token-based similarity scoring.
 *
 * No external dependencies — uses a lightweight bag-of-words approach with
 * TF-IDF-style weighting for fast, accurate matching.
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import type { ToolConfig } from './generate'
import type { ClassificationResult } from './classify'

// ---------- Types ----------

export interface CachedTemplate {
  id: string
  prompts: string[]
  category: string
  complexity: number
  primitives: string[]
  variables: Record<string, string>
  config: ToolConfig & { description: string }
}

export interface PromptCache {
  version: number
  description: string
  generatedAt: string
  totalTemplates: number
  templates: CachedTemplate[]
}

export interface CacheHit {
  template: CachedTemplate
  similarity: number
  matchedPrompt: string
}

export interface CacheLookupResult {
  hit: boolean
  cacheHit?: CacheHit
  config?: ToolConfig
  classification?: ClassificationResult
}

// ---------- Tokenization & Similarity ----------

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
  'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
  'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'and', 'but', 'or', 'nor', 'not', 'so', 'yet', 'both', 'either',
  'neither', 'each', 'every', 'all', 'any', 'few', 'more', 'most',
  'other', 'some', 'such', 'no', 'only', 'own', 'same', 'than', 'too',
  'very', 'just', 'because', 'if', 'when', 'where', 'how', 'what',
  'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'i', 'me',
  'my', 'we', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her',
  'it', 'its', 'they', 'them', 'their', 'make', 'build', 'create',
  'generate', 'give', 'get', 'want', 'need', 'please', 'help',
])

/** Tokenize and normalize a prompt string */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t))
}

/** Compute bigrams for better phrase matching */
function bigrams(tokens: string[]): string[] {
  const result: string[] = []
  for (let i = 0; i < tokens.length - 1; i++) {
    result.push(`${tokens[i]}_${tokens[i + 1]}`)
  }
  return result
}

/**
 * Compute similarity between a user prompt and a cached prompt.
 * Uses token overlap + bigram overlap with weighting.
 * Returns a score between 0 and 1.
 */
function computeSimilarity(userTokens: string[], userBigrams: string[], cachedTokens: string[], cachedBigrams: string[]): number {
  if (userTokens.length === 0 || cachedTokens.length === 0) return 0

  // Unigram overlap (Jaccard-like)
  const userSet = new Set(userTokens)
  const cachedSet = new Set(cachedTokens)
  let unigramOverlap = 0
  for (const token of userSet) {
    if (cachedSet.has(token)) unigramOverlap++
  }
  const unigramUnion = new Set([...userSet, ...cachedSet]).size
  const unigramScore = unigramOverlap / unigramUnion

  // Bigram overlap
  let bigramScore = 0
  if (userBigrams.length > 0 && cachedBigrams.length > 0) {
    const userBigramSet = new Set(userBigrams)
    const cachedBigramSet = new Set(cachedBigrams)
    let bigramOverlap = 0
    for (const bg of userBigramSet) {
      if (cachedBigramSet.has(bg)) bigramOverlap++
    }
    const bigramUnion = new Set([...userBigramSet, ...cachedBigramSet]).size
    bigramScore = bigramOverlap / bigramUnion
  }

  // Weighted combination: unigrams 0.6, bigrams 0.4
  return unigramScore * 0.6 + bigramScore * 0.4
}

// ---------- Cache Management ----------

let _cache: PromptCache | null = null
let _tokenIndex: { tokens: string[]; bigrams: string[]; promptText: string; templateIdx: number }[] | null = null

const CACHE_PATH = join(process.cwd(), 'data', 'prompt-cache.json')

/** Load and index the prompt cache */
function loadCache(): PromptCache {
  if (_cache) return _cache
  const raw = readFileSync(CACHE_PATH, 'utf-8')
  _cache = JSON.parse(raw) as PromptCache
  // Pre-tokenize all cached prompts
  _tokenIndex = []
  for (let i = 0; i < _cache.templates.length; i++) {
    for (const prompt of _cache.templates[i].prompts) {
      const tokens = tokenize(prompt)
      _tokenIndex.push({
        tokens,
        bigrams: bigrams(tokens),
        promptText: prompt,
        templateIdx: i,
      })
    }
  }
  return _cache
}

/** Minimum similarity threshold for a cache hit */
const SIMILARITY_THRESHOLD = 0.55

/**
 * Look up a user prompt in the cache.
 * Returns the best-matching cached config if similarity > threshold.
 */
export function lookupCache(prompt: string): CacheLookupResult {
  const cache = loadCache()
  const userTokens = tokenize(prompt)
  const userBi = bigrams(userTokens)

  if (userTokens.length === 0) {
    return { hit: false }
  }

  let bestScore = 0
  let bestIdx = -1
  let bestPrompt = ''

  for (const entry of _tokenIndex!) {
    const score = computeSimilarity(userTokens, userBi, entry.tokens, entry.bigrams)
    if (score > bestScore) {
      bestScore = score
      bestIdx = entry.templateIdx
      bestPrompt = entry.promptText
    }
  }

  if (bestScore >= SIMILARITY_THRESHOLD && bestIdx >= 0) {
    const template = cache.templates[bestIdx]
    return {
      hit: true,
      cacheHit: {
        template,
        similarity: bestScore,
        matchedPrompt: bestPrompt,
      },
      config: {
        title: template.config.title,
        description: template.config.description,
        primitives: template.config.primitives,
        layout: template.config.layout,
        theme: template.config.theme,
      } as ToolConfig,
      classification: {
        category: template.category,
        complexity: template.complexity,
        primitives: template.primitives,
        suggestedTitle: template.config.title,
      },
    }
  }

  return { hit: false }
}

/** Force reload the cache (e.g. after updating prompt-cache.json) */
export function reloadCache(): void {
  _cache = null
  _tokenIndex = null
}

/** Get cache stats */
export function getCacheStats(): { totalTemplates: number; totalPrompts: number; version: number } {
  const cache = loadCache()
  return {
    totalTemplates: cache.totalTemplates,
    totalPrompts: _tokenIndex?.length ?? 0,
    version: cache.version,
  }
}
