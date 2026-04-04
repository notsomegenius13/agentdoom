import type {
  ValidateOptions,
  ValidationReport,
  StageResult,
  RetryContext,
  ValidationStage,
} from './types';
import { validateSyntax } from './validators/syntax';
import { validateRender } from './validators/render';
import { validateInteraction } from './validators/interaction';
import { validateMobile } from './validators/mobile';

/**
 * Main validation orchestrator for AgentDoom tool generation.
 *
 * Runs 4 stages sequentially (bail-early on failure):
 *   1. Syntax — esbuild parse check
 *   2. Render — jsdom React render, no errors/blank screens
 *   3. Interaction — jsdom button/input/form smoke tests
 *   4. Mobile — Playwright viewport checks at 4 breakpoints
 *
 * If a stage fails, returns immediately with retry context
 * so Forge can re-generate with error details.
 */
export async function validate(opts: ValidateOptions): Promise<ValidationReport> {
  const start = performance.now();
  const { toolId, code, htmlBundle, fastMode = false, stageTimeoutMs = 500 } = opts;
  const stages: StageResult[] = [];

  // Stage 1: Syntax
  const syntaxResult = await withTimeout(validateSyntax(code), stageTimeoutMs, 'syntax');
  stages.push(syntaxResult);
  if (syntaxResult.verdict === 'fail') {
    return buildReport(toolId, stages, start, syntaxResult);
  }

  // Stage 2: Render
  const renderResult = await withTimeout(validateRender(code), stageTimeoutMs, 'render');
  stages.push(renderResult);
  if (renderResult.verdict === 'fail') {
    return buildReport(toolId, stages, start, renderResult);
  }

  // Stage 3: Interaction
  const interactionResult = await withTimeout(validateInteraction(code), stageTimeoutMs, 'interaction');
  stages.push(interactionResult);
  if (interactionResult.verdict === 'fail') {
    return buildReport(toolId, stages, start, interactionResult);
  }

  // Stage 4: Mobile (skip in fast mode)
  if (fastMode) {
    stages.push({
      stage: 'mobile',
      verdict: 'skip',
      durationMs: 0,
      errors: [],
      warnings: ['Skipped in fast mode'],
    });
  } else {
    const bundle = htmlBundle || wrapForBrowser(code);
    // Mobile stage gets 4x timeout since it launches a browser
    const mobileResult = await withTimeout(validateMobile(bundle), stageTimeoutMs * 4, 'mobile');
    stages.push(mobileResult);
    if (mobileResult.verdict === 'fail') {
      return buildReport(toolId, stages, start, mobileResult);
    }
  }

  return buildReport(toolId, stages, start);
}

/**
 * Validate with automatic retry. If validation fails, retries once
 * with error context. If second attempt fails, returns failure with
 * suggestion for graceful fallback.
 */
export async function validateWithRetry(
  opts: ValidateOptions,
  onRetry?: (context: RetryContext) => Promise<string>,
): Promise<ValidationReport> {
  // First attempt
  let report = await validate(opts);
  if (report.overallVerdict === 'pass') return report;

  // Build retry context from first failure
  const failedStage = report.stages.find((s) => s.verdict === 'fail');
  if (!failedStage) return report;

  const retryCtx: RetryContext = {
    attempt: 1,
    previousErrors: failedStage.errors,
    failedStage: failedStage.stage,
    suggestion: buildRetrySuggestion(failedStage),
  };

  // If a retry handler is provided, get regenerated code
  if (onRetry) {
    const newCode = await onRetry(retryCtx);
    report = await validate({ ...opts, code: newCode });
    if (report.overallVerdict === 'pass') {
      report.retryContext = { ...retryCtx, attempt: 1 };
      return report;
    }
  }

  // Second attempt failed — return with fallback suggestion
  report.retryContext = {
    attempt: 2,
    previousErrors: [
      ...retryCtx.previousErrors,
      ...(report.stages.find((s) => s.verdict === 'fail')?.errors || []),
    ],
    failedStage: failedStage.stage,
    suggestion: 'Validation failed after retry. Suggest rephrasing the prompt or using a simpler tool type.',
  };

  return report;
}

function buildReport(
  toolId: string,
  stages: StageResult[],
  startTime: number,
  failedStage?: StageResult,
): ValidationReport {
  const hasFail = stages.some((s) => s.verdict === 'fail');
  return {
    toolId,
    timestamp: new Date().toISOString(),
    overallVerdict: hasFail ? 'fail' : 'pass',
    totalDurationMs: Math.round(performance.now() - startTime),
    stages,
    retryContext: failedStage
      ? {
          attempt: 0,
          previousErrors: failedStage.errors,
          failedStage: failedStage.stage,
          suggestion: buildRetrySuggestion(failedStage),
        }
      : undefined,
  };
}

function buildRetrySuggestion(stage: StageResult): string {
  const errorSummary = stage.errors.map((e) => e.message).join('; ');
  switch (stage.stage) {
    case 'syntax':
      return `Fix syntax errors: ${errorSummary}`;
    case 'render':
      return `Component failed to render: ${errorSummary}. Check for missing imports or invalid JSX.`;
    case 'interaction':
      return `Interactive elements broken: ${errorSummary}. Verify event handlers and state management.`;
    case 'mobile':
      return `Layout breaks on mobile: ${errorSummary}. Use responsive Tailwind classes and avoid fixed widths.`;
  }
}

/** Wrap raw code in a minimal HTML page for Playwright */
function wrapForBrowser(code: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
<div id="root"></div>
<script type="module">
${code}
</script>
</body>
</html>`;
}

/** Run a stage with a timeout — returns a fail result if it exceeds the limit */
async function withTimeout(
  promise: Promise<StageResult>,
  timeoutMs: number,
  stage: ValidationStage,
): Promise<StageResult> {
  return Promise.race([
    promise,
    new Promise<StageResult>((resolve) =>
      setTimeout(
        () =>
          resolve({
            stage,
            verdict: 'fail',
            durationMs: timeoutMs,
            errors: [{ message: `Stage timed out after ${timeoutMs}ms`, source: 'timeout' }],
            warnings: [],
          }),
        timeoutMs,
      ),
    ),
  ]);
}

// Re-export types for consumer convenience
export type { ValidateOptions, ValidationReport, StageResult, RetryContext } from './types';
