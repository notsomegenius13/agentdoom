import { transform } from 'esbuild';
import type { StageResult, ValidationError } from '../types';

/**
 * Stage 1: Syntax Check
 * Validates that assembled code parses as valid JSX/TSX.
 * Uses esbuild for fast transpilation — catches syntax errors,
 * invalid JSX, and unresolvable imports.
 */
export async function validateSyntax(code: string): Promise<StageResult> {
  const start = performance.now();
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  try {
    const result = await transform(code, {
      loader: 'tsx',
      jsx: 'automatic',
      target: 'es2020',
      format: 'esm',
      logLevel: 'silent',
    });

    for (const w of result.warnings) {
      warnings.push(w.text);
    }
  } catch (err: unknown) {
    const esbuildErr = err as { errors?: Array<{ text: string; location?: { line: number; column: number } }> };
    if (esbuildErr.errors) {
      for (const e of esbuildErr.errors) {
        errors.push({
          message: e.text,
          line: e.location?.line,
          column: e.location?.column,
          source: 'esbuild',
        });
      }
    } else {
      errors.push({
        message: String(err),
        source: 'esbuild',
      });
    }
  }

  return {
    stage: 'syntax',
    verdict: errors.length === 0 ? 'pass' : 'fail',
    durationMs: Math.round(performance.now() - start),
    errors,
    warnings,
  };
}
