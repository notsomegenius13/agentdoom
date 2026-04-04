/** Validation pipeline types for AgentDoom tool generation */

export type ValidationStage = 'syntax' | 'render' | 'interaction' | 'mobile';

export type StageVerdict = 'pass' | 'fail' | 'skip';

export interface StageResult {
  stage: ValidationStage;
  verdict: StageVerdict;
  durationMs: number;
  errors: ValidationError[];
  warnings: string[];
  /** Base64 screenshot on failure (mobile stage only) */
  screenshot?: string;
}

export interface ValidationError {
  message: string;
  line?: number;
  column?: number;
  source?: string;
}

export interface ValidationReport {
  toolId: string;
  timestamp: string;
  overallVerdict: 'pass' | 'fail';
  totalDurationMs: number;
  stages: StageResult[];
  retryContext?: RetryContext;
}

export interface RetryContext {
  attempt: number;
  previousErrors: ValidationError[];
  failedStage: ValidationStage;
  suggestion: string;
}

export interface ValidateOptions {
  /** Tool identifier */
  toolId: string;
  /** The assembled JSX/TSX source code of the tool */
  code: string;
  /** Pre-rendered HTML bundle (if available) for browser-based tests */
  htmlBundle?: string;
  /** Skip Playwright-based stages (mobile) for faster feedback */
  fastMode?: boolean;
  /** Max time per stage in ms (default: 500) */
  stageTimeoutMs?: number;
}

/** Viewports for mobile responsiveness testing */
export const MOBILE_VIEWPORTS = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 14', width: 390, height: 844 },
  { name: 'iPad', width: 768, height: 1024 },
  { name: 'Desktop', width: 1024, height: 768 },
] as const;

export type ViewportName = (typeof MOBILE_VIEWPORTS)[number]['name'];
