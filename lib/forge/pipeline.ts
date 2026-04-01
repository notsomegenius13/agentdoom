/**
 * Forge: Pipeline Orchestrator
 * The end-to-end generation pipeline: prompt → classify → generate → assemble → validate → deploy
 *
 * This is the single entry point for tool generation.
 */

import { classifyPrompt, type ClassificationResult } from './classify'
import { generateToolConfig, type ToolConfig } from './generate'
import { assembleTool } from './assemble'
import { validate, validateWithRetry, type ValidationReport } from './validate'
import { deploy, generateSlug, type DeployResult } from './deploy'

export interface PipelineResult {
  slug: string
  url: string
  html: string
  classification: ClassificationResult
  config: ToolConfig
  validation: ValidationReport
  deploy: DeployResult
  timing: PipelineTiming
}

export interface PipelineTiming {
  classifyMs: number
  generateMs: number
  assembleMs: number
  validateMs: number
  deployMs: number
  totalMs: number
}

export type PipelineStage = 'classify' | 'generate' | 'assemble' | 'validate' | 'deploy' | 'done' | 'error'

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

  // Stage 1: Classify
  emit('classify', `Analyzing: "${prompt}"`)
  const classifyStart = performance.now()
  const classification = await classifyPrompt(prompt)
  const classifyMs = Math.round(performance.now() - classifyStart)
  emit('classify', `Category: ${classification.category} (complexity: ${classification.complexity}/10)`, {
    classification,
  })

  // Stage 2: Generate
  emit('generate', 'Generating tool configuration...')
  const generateStart = performance.now()
  const config = await generateToolConfig(prompt, classification.category, classification.primitives)
  const generateMs = Math.round(performance.now() - generateStart)
  if (!config.title && classification.suggestedTitle) {
    config.title = classification.suggestedTitle
  }
  emit('generate', `Config ready: ${config.primitives.length} primitive(s)`, { config })

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

  // Stage 5: Deploy (even on validation failure — user can still preview)
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
    deploy: deployResult,
    timing: { classifyMs, generateMs, assembleMs, validateMs, deployMs, totalMs },
  }
}

// Re-export key types for consumers
export type { ClassificationResult } from './classify'
export type { ToolConfig } from './generate'
export type { ValidationReport } from './validate'
export type { DeployResult } from './deploy'
