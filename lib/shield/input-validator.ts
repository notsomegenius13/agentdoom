/**
 * Shield: Input Validator
 * Validates and sanitizes user inputs before processing.
 * Enforces max lengths, character filtering, and encoding checks.
 */

export interface InputValidationResult {
  valid: boolean
  sanitized: string
  errors: string[]
}

/** Maximum prompt length in characters */
const MAX_PROMPT_LENGTH = 5000

/** Maximum request body size in bytes */
const MAX_BODY_SIZE = 100_000 // 100KB

/** Pattern to detect null bytes and other control characters (except newline/tab) */
const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g

/** Pattern to detect common homoglyph/unicode abuse */
const SUSPICIOUS_UNICODE = /[\u200B-\u200F\u2028-\u202F\uFEFF\uFFF9-\uFFFF]/g

/**
 * Validate and sanitize a user prompt.
 * Returns the sanitized prompt or errors if invalid.
 */
export function validatePromptInput(prompt: unknown): InputValidationResult {
  const errors: string[] = []

  if (prompt === undefined || prompt === null) {
    return { valid: false, sanitized: '', errors: ['Prompt is required'] }
  }

  if (typeof prompt !== 'string') {
    return { valid: false, sanitized: '', errors: ['Prompt must be a string'] }
  }

  if (prompt.trim().length === 0) {
    return { valid: false, sanitized: '', errors: ['Prompt cannot be empty'] }
  }

  if (prompt.length > MAX_PROMPT_LENGTH) {
    errors.push(`Prompt exceeds maximum length of ${MAX_PROMPT_LENGTH} characters`)
  }

  // Strip null bytes and control characters
  let sanitized = prompt.replace(CONTROL_CHARS, '')

  // Strip zero-width and suspicious unicode characters used for evasion
  sanitized = sanitized.replace(SUSPICIOUS_UNICODE, '')

  // Normalize excessive whitespace (but preserve single newlines for formatting)
  sanitized = sanitized.replace(/[ \t]{10,}/g, '  ')
  sanitized = sanitized.replace(/\n{5,}/g, '\n\n')

  // Trim
  sanitized = sanitized.trim()

  if (sanitized.length === 0) {
    errors.push('Prompt is empty after sanitization')
  }

  return {
    valid: errors.length === 0,
    sanitized,
    errors,
  }
}

/**
 * Validate raw request body size.
 * Call this before JSON parsing to prevent DoS via large payloads.
 */
export function validateRequestBody(contentLength: number | null): {
  valid: boolean
  error?: string
} {
  if (contentLength !== null && contentLength > MAX_BODY_SIZE) {
    return { valid: false, error: `Request body exceeds maximum size of ${MAX_BODY_SIZE} bytes` }
  }
  return { valid: true }
}
