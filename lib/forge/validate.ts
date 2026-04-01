/**
 * Forge: Validation Pipeline
 * Runs syntax → render → interaction → mobile checks on assembled tools
 */

export interface ValidationResult {
  passed: boolean
  checks: ValidationCheck[]
  retryable: boolean
}

export interface ValidationCheck {
  name: string
  passed: boolean
  error?: string
  duration: number // ms
}

export async function validateTool(html: string): Promise<ValidationResult> {
  const checks: ValidationCheck[] = []

  // Check 1: Syntax — does the HTML parse?
  const syntaxCheck = validateSyntax(html)
  checks.push(syntaxCheck)

  // Check 2: Basic structure — has required elements?
  const structureCheck = validateStructure(html)
  checks.push(structureCheck)

  // Check 3: Mobile viewport meta tag
  const mobileCheck = validateMobile(html)
  checks.push(mobileCheck)

  // Check 4: No dangerous content
  const safetyCheck = validateSafety(html)
  checks.push(safetyCheck)

  const passed = checks.every((c) => c.passed)
  const retryable = checks.some((c) => !c.passed && c.name !== 'safety')

  return { passed, checks, retryable }
}

function validateSyntax(html: string): ValidationCheck {
  const start = Date.now()
  try {
    // Basic HTML syntax check
    const hasDoctype = html.toLowerCase().includes('<!doctype html>')
    const hasHtmlTag = /<html[\s>]/i.test(html)
    const hasBody = /<body[\s>]/i.test(html)

    if (!hasDoctype || !hasHtmlTag || !hasBody) {
      return { name: 'syntax', passed: false, error: 'Missing required HTML structure', duration: Date.now() - start }
    }
    return { name: 'syntax', passed: true, duration: Date.now() - start }
  } catch (err) {
    return { name: 'syntax', passed: false, error: String(err), duration: Date.now() - start }
  }
}

function validateStructure(html: string): ValidationCheck {
  const start = Date.now()
  const hasTitle = /<title>.+<\/title>/i.test(html)
  const hasContent = /<body[\s>][\s\S]*\S[\s\S]*<\/body>/i.test(html)

  if (!hasTitle || !hasContent) {
    return { name: 'structure', passed: false, error: 'Missing title or body content', duration: Date.now() - start }
  }
  return { name: 'structure', passed: true, duration: Date.now() - start }
}

function validateMobile(html: string): ValidationCheck {
  const start = Date.now()
  const hasViewport = /meta.*viewport/i.test(html)
  if (!hasViewport) {
    return { name: 'mobile', passed: false, error: 'Missing viewport meta tag', duration: Date.now() - start }
  }
  return { name: 'mobile', passed: true, duration: Date.now() - start }
}

function validateSafety(html: string): ValidationCheck {
  const start = Date.now()
  const dangerous = [
    /eval\s*\(/i,
    /document\.cookie/i,
    /window\.location\s*=/i,
    /fetch\s*\(\s*['"`]http/i,
  ]
  for (const pattern of dangerous) {
    if (pattern.test(html)) {
      return { name: 'safety', passed: false, error: `Dangerous pattern detected: ${pattern.source}`, duration: Date.now() - start }
    }
  }
  return { name: 'safety', passed: true, duration: Date.now() - start }
}
