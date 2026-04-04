/**
 * Forge: Pipeline Orchestrator
 * The end-to-end generation pipeline: prompt → classify → generate → assemble → validate → deploy
 *
 * This is the single entry point for tool generation.
 */

import { classifyPrompt, type ClassificationResult } from './classify'
import { generateToolConfig, type ToolConfig } from './generate'
import { remixToolConfig, type RemixRequest } from './remix'
import { assembleTool } from './assemble'
import { validate, validateWithRetry, type ValidationReport } from './validate'
import { moderateTool, preScreenPrompt, type ModerationResult } from './moderate'
import { scanOutput, type ScanResult } from '@/lib/shield/output-scanner'
import { deploy, generateSlug, type DeployResult } from './deploy'
import { lookupCache, type CacheHit } from './cache'

export interface PipelineResult {
  slug: string
  url: string
  html: string
  classification: ClassificationResult
  config: ToolConfig
  validation: ValidationReport
  moderation: ModerationResult
  deploy: DeployResult
  timing: PipelineTiming
  /** Present when the result was served from the prompt cache */
  cacheHit?: CacheHit
}

export interface PipelineTiming {
  classifyMs: number
  generateMs: number
  assembleMs: number
  validateMs: number
  moderateMs: number
  deployMs: number
  totalMs: number
}

export type PipelineStage = 'classify' | 'generate' | 'assemble' | 'validate' | 'moderate' | 'deploy' | 'done' | 'error'

export interface PipelineEvent {
  stage: PipelineStage
  message: string
  data?: Record<string, unknown>
}

export interface PipelineOptions {
  /** User's natural language prompt */
  prompt: string
  /** Skip Playwright mobile validation for faster feedback */
  fastMode?: boolean
  /** Enable auto-retry on validation failure */
  retryOnFailure?: boolean
  /** Callback for stage progress updates */
  onProgress?: (event: PipelineEvent) => void
}

/**
 * Run the full generation pipeline.
 * Returns the complete result including deployed URL.
 */
export async function runPipeline(opts: PipelineOptions): Promise<PipelineResult> {
  const { prompt, fastMode = false, retryOnFailure = true, onProgress } = opts
  const totalStart = performance.now()
  const slug = generateSlug()

  const emit = (stage: PipelineStage, message: string, data?: Record<string, unknown>) => {
    onProgress?.({ stage, message, data })
  }

  // Stage 0: Check prompt cache for instant generation
  let cacheHit: CacheHit | undefined
  const cacheResult = lookupCache(prompt)
  if (cacheResult.hit && cacheResult.config && cacheResult.classification) {
    cacheHit = cacheResult.cacheHit
    emit('classify', `Cache hit (${Math.round((cacheHit!.similarity) * 100)}% match: "${cacheHit!.matchedPrompt}")`)
  }

  // Stage 1: Classify (skipped on cache hit)
  let classification: ClassificationResult
  let classifyMs: number
  if (cacheResult.hit) {
    classification = cacheResult.classification!
    classifyMs = 0
  } else {
    emit('classify', `Analyzing: "${prompt}"`)
    const classifyStart = performance.now()
    classification = await classifyPrompt(prompt)
    classifyMs = Math.round(performance.now() - classifyStart)
  }
  emit('classify', `Category: ${classification.category} (complexity: ${classification.complexity}/10)`, {
    classification,
  })

  // Stage 2: Generate (skipped on cache hit)
  let config: ToolConfig
  let generateMs: number
  if (cacheResult.hit) {
    config = cacheResult.config!
    generateMs = 0
    emit('generate', `Served from cache: ${config.primitives.length} primitive(s)`, { config })
  } else {
    emit('generate', 'Generating tool configuration...')
    const generateStart = performance.now()
    config = await generateToolConfig(prompt, classification.category, classification.primitives)
    generateMs = Math.round(performance.now() - generateStart)
    if (!config.title && classification.suggestedTitle) {
      config.title = classification.suggestedTitle
    }
    emit('generate', `Config ready: ${config.primitives.length} primitive(s)`, { config })
  }

  // Stage 3: Assemble
  emit('assemble', 'Assembling components...')
  const assembleStart = performance.now()
  const html = assembleTool(config)
  const assembleMs = Math.round(performance.now() - assembleStart)
  emit('assemble', `Assembled ${html.length} bytes of HTML`)

  // Stage 4: Validate
  emit('validate', 'Running validation pipeline...')
  const validateStart = performance.now()
  const validateOpts = { toolId: slug, code: html, htmlBundle: html, fastMode }

  let validation: ValidationReport
  if (retryOnFailure) {
    validation = await validateWithRetry(validateOpts, async (ctx) => {
      // On retry, re-generate with error context
      emit('validate', `Retry: fixing ${ctx.failedStage} errors...`)
      const retryConfig = await generateToolConfig(
        `${prompt}\n\nPrevious attempt failed validation at "${ctx.failedStage}" stage. Errors: ${ctx.previousErrors.map((e) => e.message).join('; ')}. ${ctx.suggestion}`,
        classification.category,
        classification.primitives
      )
      return assembleTool(retryConfig)
    })
  } else {
    validation = await validate(validateOpts)
  }
  const validateMs = Math.round(performance.now() - validateStart)

  if (validation.overallVerdict === 'fail') {
    emit('validate', `Validation failed at ${validation.retryContext?.failedStage || 'unknown'} stage`)
  } else {
    emit('validate', 'All validation stages passed')
  }

  // Stage 4b: Static security scan (output scanner — catches XSS, script injection, etc.)
  emit('moderate', 'Running security scan...')
  const scanResult = scanOutput(html)
  if (!scanResult.safe) {
    const threats = scanResult.findings
      .filter((f) => f.severity === 'critical' || f.severity === 'high')
      .map((f) => `${f.category}: ${f.description}`)
      .join('; ')
    emit('moderate', `Security scan failed: ${threats}`, { scanResult })
    emit('error', `Tool blocked by security scan: ${threats}`)
    const blockedModeration: ModerationResult = {
      verdict: 'block',
      flags: scanResult.findings.map((f) => ({
        category: f.category === 'xss' || f.category === 'script_injection' ? 'malware' as const : 'malware' as const,
        confidence: f.severity === 'critical' ? 0.99 : 0.85,
        reason: `${f.category}: ${f.description} (line ${f.line || '?'})`,
      })),
      durationMs: 0,
      model: 'static-analysis',
      riskScore: 100,
    }
    return {
      slug,
      url: '',
      html,
      classification,
      config,
      validation,
      moderation: blockedModeration,
      deploy: { url: '', slug, kvKey: slug, sizeBytes: 0, deployedAt: '' },
      timing: { classifyMs, generateMs, assembleMs, validateMs, moderateMs: 0, deployMs: 0, totalMs: Math.round(performance.now() - totalStart) },
      cacheHit,
    }
  }

  // Stage 5: Content Moderation (Haiku — runs on every tool before deploy)
  emit('moderate', 'Scanning for policy violations...')
  const moderateStart = performance.now()
  const moderation = await moderateTool({
    prompt,
    title: config.title || classification.suggestedTitle,
    html,
    category: classification.category,
  })
  const moderateMs = Math.round(performance.now() - moderateStart)

  if (moderation.verdict === 'block') {
    const reasons = moderation.flags
      .filter((f) => f.category !== 'clean')
      .map((f) => `${f.category} (${Math.round(f.confidence * 100)}%)`)
      .join(', ')
    emit('moderate', `Blocked: ${reasons}`, { moderation })
    emit('error', `Tool blocked by content moderation: ${reasons}`)
    // Return early — do not deploy blocked tools
    return {
      slug,
      url: '',
      html,
      classification,
      config,
      validation,
      moderation,
      deploy: { url: '', slug, kvKey: slug, sizeBytes: 0, deployedAt: '' },
      timing: { classifyMs, generateMs, assembleMs, validateMs, moderateMs, deployMs: 0, totalMs: Math.round(performance.now() - totalStart) },
      cacheHit,
    }
  }

  if (moderation.verdict === 'review') {
    const flags = moderation.flags
      .filter((f) => f.category !== 'clean')
      .map((f) => f.category)
      .join(', ')
    emit('moderate', `Flagged for review: ${flags} (risk: ${moderation.riskScore}/100)`, { moderation })
  } else {
    emit('moderate', `Content scan passed (risk: ${moderation.riskScore}/100)`)
  }

  // Stage 6: Deploy (even on validation failure — user can still preview)
  emit('deploy', 'Deploying to edge...')
  const deployStart = performance.now()
  const deployResult = await deploy({ html, slug })
  const deployMs = Math.round(performance.now() - deployStart)
  emit('deploy', `Deployed: ${deployResult.url}`)

  const totalMs = Math.round(performance.now() - totalStart)
  emit('done', `Pipeline complete in ${totalMs}ms`, { url: deployResult.url })

  return {
    slug,
    url: deployResult.url,
    html,
    classification,
    config,
    validation,
    moderation,
    deploy: deployResult,
    timing: { classifyMs, generateMs, assembleMs, validateMs, moderateMs, deployMs, totalMs },
    cacheHit,
  }
}

// --- Remix Pipeline ---

export interface RemixPipelineOptions {
  /** The existing tool's configuration */
  sourceConfig: ToolConfig
  /** Natural language description of desired changes */
  modificationPrompt: string
  /** Source tool ID for attribution tracking */
  sourceToolId: string
  /** Original tool's category */
  category?: string
  /** Skip Playwright mobile validation for faster feedback */
  fastMode?: boolean
  /** Enable auto-retry on validation failure */
  retryOnFailure?: boolean
  /** Callback for stage progress updates */
  onProgress?: (event: PipelineEvent) => void
}

export interface RemixPipelineResult {
  slug: string
  url: string
  html: string
  config: ToolConfig
  sourceToolId: string
  validation: ValidationReport
  moderation: ModerationResult
  deploy: DeployResult
  timing: RemixPipelineTiming
}

export interface RemixPipelineTiming {
  remixMs: number
  assembleMs: number
  validateMs: number
  moderateMs: number
  deployMs: number
  totalMs: number
}

/**
 * Run the remix pipeline: existing config + modification prompt → new deployed tool.
 * Skips classification (we already know the tool). Target: 2-3 seconds.
 */
export async function runRemixPipeline(opts: RemixPipelineOptions): Promise<RemixPipelineResult> {
  const {
    sourceConfig,
    modificationPrompt,
    sourceToolId,
    category,
    fastMode = true,
    retryOnFailure = true,
    onProgress,
  } = opts
  const totalStart = performance.now()
  const slug = generateSlug()

  const emit = (stage: PipelineStage, message: string, data?: Record<string, unknown>) => {
    onProgress?.({ stage, message, data })
  }

  // Stage 1: Remix generation (replaces classify + generate)
  emit('generate', `Remixing: "${modificationPrompt}"`)
  const remixStart = performance.now()
  let config: ToolConfig
  try {
    const remixResult = await remixToolConfig({
      sourceConfig,
      modificationPrompt,
      category,
    })
    config = remixResult.config
  } catch (err) {
    // If remix fails to parse, fall back to source config
    emit('generate', 'Remix generation failed, using source config')
    config = { ...sourceConfig }
  }
  const remixMs = Math.round(performance.now() - remixStart)
  emit('generate', `Remix config ready: ${config.primitives.length} primitive(s)`, { config })

  // Stage 2: Assemble
  emit('assemble', 'Assembling remixed components...')
  const assembleStart = performance.now()
  const html = assembleTool(config)
  const assembleMs = Math.round(performance.now() - assembleStart)
  emit('assemble', `Assembled ${html.length} bytes of HTML`)

  // Stage 3: Validate
  emit('validate', 'Running validation pipeline...')
  const validateStart = performance.now()
  const validateOpts = { toolId: slug, code: html, htmlBundle: html, fastMode }

  let validation: ValidationReport
  if (retryOnFailure) {
    validation = await validateWithRetry(validateOpts, async (ctx) => {
      emit('validate', `Retry: fixing ${ctx.failedStage} errors...`)
      const retryResult = await remixToolConfig({
        sourceConfig,
        modificationPrompt: `${modificationPrompt}\n\nPrevious attempt failed validation at "${ctx.failedStage}" stage. Errors: ${ctx.previousErrors.map((e) => e.message).join('; ')}. ${ctx.suggestion}`,
        category,
      })
      return assembleTool(retryResult.config)
    })
  } else {
    validation = await validate(validateOpts)
  }
  const validateMs = Math.round(performance.now() - validateStart)

  if (validation.overallVerdict === 'fail') {
    emit('validate', `Validation failed at ${validation.retryContext?.failedStage || 'unknown'} stage`)
  } else {
    emit('validate', 'All validation stages passed')
  }

  // Stage 3b: Static security scan for remix
  emit('moderate', 'Running security scan...')
  const scanResult = scanOutput(html)
  if (!scanResult.safe) {
    const threats = scanResult.findings
      .filter((f) => f.severity === 'critical' || f.severity === 'high')
      .map((f) => `${f.category}: ${f.description}`)
      .join('; ')
    emit('moderate', `Security scan failed: ${threats}`, { scanResult })
    emit('error', `Remixed tool blocked by security scan: ${threats}`)
    const blockedModeration: ModerationResult = {
      verdict: 'block',
      flags: scanResult.findings.map((f) => ({
        category: 'malware' as const,
        confidence: f.severity === 'critical' ? 0.99 : 0.85,
        reason: `${f.category}: ${f.description} (line ${f.line || '?'})`,
      })),
      durationMs: 0,
      model: 'static-analysis',
      riskScore: 100,
    }
    return {
      slug,
      url: '',
      html,
      config,
      sourceToolId,
      validation,
      moderation: blockedModeration,
      deploy: { url: '', slug, kvKey: slug, sizeBytes: 0, deployedAt: '' },
      timing: { remixMs, assembleMs, validateMs, moderateMs: 0, deployMs: 0, totalMs: Math.round(performance.now() - totalStart) },
    }
  }

  // Stage 4: Content Moderation
  emit('moderate', 'Scanning remixed tool for policy violations...')
  const moderateStart = performance.now()
  const moderation = await moderateTool({
    prompt: modificationPrompt,
    title: config.title || sourceConfig.title,
    html,
    category: category || 'utility',
  })
  const moderateMs = Math.round(performance.now() - moderateStart)

  if (moderation.verdict === 'block') {
    const reasons = moderation.flags
      .filter((f) => f.category !== 'clean')
      .map((f) => `${f.category} (${Math.round(f.confidence * 100)}%)`)
      .join(', ')
    emit('moderate', `Blocked: ${reasons}`, { moderation })
    emit('error', `Remixed tool blocked by content moderation: ${reasons}`)
    return {
      slug,
      url: '',
      html,
      config,
      sourceToolId,
      validation,
      moderation,
      deploy: { url: '', slug, kvKey: slug, sizeBytes: 0, deployedAt: '' },
      timing: { remixMs, assembleMs, validateMs, moderateMs, deployMs: 0, totalMs: Math.round(performance.now() - totalStart) },
    }
  }

  if (moderation.verdict === 'review') {
    const flags = moderation.flags
      .filter((f) => f.category !== 'clean')
      .map((f) => f.category)
      .join(', ')
    emit('moderate', `Flagged for review: ${flags} (risk: ${moderation.riskScore}/100)`, { moderation })
  } else {
    emit('moderate', `Content scan passed (risk: ${moderation.riskScore}/100)`)
  }

  // Stage 5: Deploy
  emit('deploy', 'Deploying remixed tool to edge...')
  const deployStart = performance.now()
  const deployResult = await deploy({ html, slug })
  const deployMs = Math.round(performance.now() - deployStart)
  emit('deploy', `Deployed: ${deployResult.url}`)

  const totalMs = Math.round(performance.now() - totalStart)
  emit('done', `Remix pipeline complete in ${totalMs}ms`, { url: deployResult.url })

  return {
    slug,
    url: deployResult.url,
    html,
    config,
    sourceToolId,
    validation,
    moderation,
    deploy: deployResult,
    timing: { remixMs, assembleMs, validateMs, moderateMs, deployMs, totalMs },
  }
}

// Re-export key types for consumers
export type { ClassificationResult } from './classify'
export type { ToolConfig } from './generate'
export type { RemixRequest, RemixResult } from './remix'
export type { ValidationReport } from './validate'
export type { ModerationResult } from './moderate'
export type { DeployResult } from './deploy'
export { lookupCache, reloadCache, getCacheStats, type CacheHit, type CacheLookupResult } from './cache'
