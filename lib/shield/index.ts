/**
 * Shield: Trust & Safety Module for AgentDoom
 *
 * Provides content moderation, rate limiting, output scanning,
 * report handling, and terms of service for the platform.
 */

// Prompt pre-screening (keyword blocklist — fast, no LLM)
export { filterPrompt, type PromptFilterResult } from './prompt-filter'

// Rate limiting (Redis via Upstash)
export {
  checkRateLimit,
  checkIpRateLimit,
  getRateLimitStatus,
  rateLimitHeaders,
  rateLimitResponse,
  logRateLimitHit,
  isAdminRequest,
  type RateLimitResult,
  type UserTier,
} from './rate-limiter'

// Input validation
export {
  validatePromptInput,
  validateRequestBody,
  type InputValidationResult,
} from './input-validator'

// Output scanning (static XSS/injection detection)
export {
  scanOutput,
  isOutputSafe,
  type ScanResult,
  type ScanFinding,
  type ThreatCategory,
} from './output-scanner'

// Report handling (submission + admin queue)
export {
  processReport,
  buildAdminQueueQuery,
  ADMIN_QUEUE_SQL,
  SECURITY_EVENTS_SQL,
  type ReportSubmission,
  type ReportResult,
  type AdminQueueItem,
  type AdminQueueFilter,
} from './report-handler'

// Terms of Service
export { TERMS_OF_SERVICE, TOS_VERSION, TOS_EFFECTIVE_DATE } from './tos'
