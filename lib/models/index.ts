/**
 * Multi-model abstraction layer for AgentDoom
 * Config-driven model switching — model swaps are a config change, not a rewrite.
 */

export type ModelProvider = 'anthropic' | 'openai'
export type ModelTask = 'classify' | 'generate' | 'complex' | 'moderate' | 'personalize'

export interface ModelConfig {
  provider: ModelProvider
  model: string
  maxTokens: number
  temperature: number
  costPerCall: number
  latencyTarget: number // ms
  fallback?: {
    provider: ModelProvider
    model: string
  }
}

const MODEL_REGISTRY: Record<ModelTask, ModelConfig> = {
  classify: {
    provider: 'anthropic',
    model: 'claude-haiku-4-5-20251001',
    maxTokens: 512,
    temperature: 0,
    costPerCall: 0.001,
    latencyTarget: 50,
    fallback: { provider: 'openai', model: 'gpt-4o-mini' },
  },
  generate: {
    provider: 'anthropic',
    model: 'claude-sonnet-4-6',
    maxTokens: 4096,
    temperature: 0.3,
    costPerCall: 0.08,
    latencyTarget: 5000,
    fallback: { provider: 'openai', model: 'gpt-4o' },
  },
  complex: {
    provider: 'anthropic',
    model: 'claude-opus-4-6',
    maxTokens: 8192,
    temperature: 0.2,
    costPerCall: 0.30,
    latencyTarget: 15000,
    fallback: { provider: 'anthropic', model: 'claude-sonnet-4-6' },
  },
  moderate: {
    provider: 'anthropic',
    model: 'claude-haiku-4-5-20251001',
    maxTokens: 256,
    temperature: 0,
    costPerCall: 0.001,
    latencyTarget: 200,
    fallback: { provider: 'openai', model: 'gpt-4o-mini' },
  },
  personalize: {
    provider: 'anthropic',
    model: 'claude-haiku-4-5-20251001',
    maxTokens: 128,
    temperature: 0,
    costPerCall: 0.0005,
    latencyTarget: 20,
  },
}

export function getModelConfig(task: ModelTask): ModelConfig {
  return MODEL_REGISTRY[task]
}

export interface CompletionRequest {
  task: ModelTask
  system?: string
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
}

export interface CompletionResponse {
  content: string
  model: string
  latency: number
  cost: number
  usedFallback: boolean
}

/**
 * Call the appropriate model for a task.
 * Auto-falls back to secondary model on failure.
 */
export async function complete(request: CompletionRequest): Promise<CompletionResponse> {
  const config = getModelConfig(request.task)
  const start = Date.now()

  try {
    const content = await callProvider(config.provider, config.model, request)
    return {
      content,
      model: config.model,
      latency: Date.now() - start,
      cost: config.costPerCall,
      usedFallback: false,
    }
  } catch (err) {
    if (!config.fallback) throw err

    console.warn(`Primary model ${config.model} failed, falling back to ${config.fallback.model}`)
    const content = await callProvider(config.fallback.provider, config.fallback.model, request)
    return {
      content,
      model: config.fallback.model,
      latency: Date.now() - start,
      cost: config.costPerCall * 1.5,
      usedFallback: true,
    }
  }
}

async function callProvider(
  provider: ModelProvider,
  model: string,
  request: CompletionRequest
): Promise<string> {
  // TODO: Implement actual API calls
  // For Anthropic: use @anthropic-ai/sdk
  // For OpenAI: use openai sdk
  throw new Error(`Provider ${provider}/${model} not yet implemented. Install SDKs and add API keys.`)
}
