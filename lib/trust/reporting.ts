/**
 * Reporting System for AgentDoom
 *
 * One-tap report → auto-triage → human escalation
 */

export type ReportReason =
  | 'harmful'
  | 'copyright'
  | 'phishing'
  | 'spam'
  | 'nsfw'
  | 'malware'
  | 'other'

export type ReportStatus = 'pending' | 'auto_resolved' | 'escalated' | 'dismissed' | 'actioned'

export type TriageAction = 'auto_block' | 'escalate' | 'dismiss'

export interface Report {
  id: string
  toolId: string
  reporterId: string
  reason: ReportReason
  description?: string
  status: ReportStatus
  triageAction?: TriageAction
  triageReason?: string
  createdAt: string
  resolvedAt?: string
}

export interface TriageResult {
  action: TriageAction
  reason: string
  /** Whether the tool should be immediately taken down */
  immediateBlock: boolean
}

/** Thresholds for auto-triage decisions */
const TRIAGE_CONFIG = {
  /** Number of unique reporters needed for auto-escalation */
  uniqueReporterThreshold: 3,
  /** Report reasons that trigger immediate review */
  highPriorityReasons: ['phishing', 'malware', 'harmful'] as ReportReason[],
  /** If a tool already has a moderation flag with this risk score, auto-block on any report */
  existingFlagAutoBlockThreshold: 60,
}

/**
 * Auto-triage a new report based on report history and moderation state.
 */
export function triageReport(input: {
  report: { reason: ReportReason; description?: string }
  existingReports: Array<{ reporterId: string; reason: ReportReason }>
  toolModerationRiskScore?: number
  creatorIsVerified: boolean
}): TriageResult {
  const { report, existingReports, toolModerationRiskScore, creatorIsVerified } = input

  // High-priority reasons always escalate
  if (TRIAGE_CONFIG.highPriorityReasons.includes(report.reason)) {
    // If the tool already had a moderate+ risk score, auto-block
    if (
      toolModerationRiskScore !== undefined &&
      toolModerationRiskScore >= TRIAGE_CONFIG.existingFlagAutoBlockThreshold
    ) {
      return {
        action: 'auto_block',
        reason: `High-priority report (${report.reason}) on tool with existing risk score ${toolModerationRiskScore}`,
        immediateBlock: true,
      }
    }

    return {
      action: 'escalate',
      reason: `High-priority report reason: ${report.reason}`,
      immediateBlock: false,
    }
  }

  // Check for multiple unique reporters
  const uniqueReporters = new Set(existingReports.map((r) => r.reporterId))
  // +1 for the current report
  if (uniqueReporters.size + 1 >= TRIAGE_CONFIG.uniqueReporterThreshold) {
    return {
      action: 'escalate',
      reason: `${uniqueReporters.size + 1} unique reporters reached threshold`,
      immediateBlock: false,
    }
  }

  // Verified creators get benefit of the doubt for low-priority reports
  if (creatorIsVerified && !TRIAGE_CONFIG.highPriorityReasons.includes(report.reason)) {
    return {
      action: 'dismiss',
      reason: 'Low-priority report on verified creator tool — pending pattern analysis',
      immediateBlock: false,
    }
  }

  // Default: escalate for human review
  return {
    action: 'escalate',
    reason: 'Default triage — queued for human review',
    immediateBlock: false,
  }
}
