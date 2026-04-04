/**
 * Shield: Report Handler
 * Processes user-submitted tool reports and manages the admin review queue.
 * Integrates with existing lib/trust/reporting.ts for triage logic.
 */

import { triageReport, type ReportReason, type ReportStatus, type TriageAction } from '@/lib/trust/reporting'

export interface ReportSubmission {
  toolId: string
  reporterId: string
  reason: ReportReason
  description?: string
}

export interface ReportResult {
  reportId: string
  status: ReportStatus
  triageAction: TriageAction
  triageReason: string
  immediateBlock: boolean
}

export interface AdminQueueItem {
  reportId: string
  toolId: string
  toolTitle: string
  creatorId: string
  reason: ReportReason
  description?: string
  reportCount: number
  triageAction: TriageAction
  status: ReportStatus
  createdAt: string
}

export interface AdminQueueFilter {
  status?: ReportStatus
  reason?: ReportReason
  limit?: number
  offset?: number
}

/**
 * SQL for the admin review queue view.
 * Aggregates reports per tool with triage metadata.
 */
export const ADMIN_QUEUE_SQL = `
CREATE OR REPLACE VIEW admin_report_queue AS
SELECT
  r.id AS report_id,
  r.tool_id,
  t.title AS tool_title,
  t.creator_id,
  r.reason,
  r.description,
  r.triage_action,
  r.status,
  r.created_at,
  (SELECT COUNT(*) FROM reports r2 WHERE r2.tool_id = r.tool_id AND r2.status != 'dismissed') AS report_count
FROM reports r
JOIN tools t ON t.id = r.tool_id
WHERE r.status IN ('pending', 'escalated')
ORDER BY
  CASE r.triage_action
    WHEN 'auto_block' THEN 0
    WHEN 'escalate' THEN 1
    ELSE 2
  END,
  r.created_at ASC;
`

/**
 * SQL for security events audit table.
 */
export const SECURITY_EVENTS_SQL = `
CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'prompt_blocked', 'output_blocked', 'rate_limited',
    'report_submitted', 'tool_auto_blocked', 'tool_escalated'
  )),
  user_id UUID REFERENCES users(id),
  tool_id UUID REFERENCES tools(id),
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_user ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_created ON security_events(created_at DESC);
`

/**
 * Process a new report submission.
 * Runs triage logic and returns the result with recommended action.
 */
export function processReport(input: {
  submission: ReportSubmission
  existingReports: Array<{ reporterId: string; reason: ReportReason }>
  toolModerationRiskScore?: number
  creatorIsVerified: boolean
}): ReportResult {
  const { submission, existingReports, toolModerationRiskScore, creatorIsVerified } = input

  const triage = triageReport({
    report: { reason: submission.reason, description: submission.description },
    existingReports,
    toolModerationRiskScore,
    creatorIsVerified,
  })

  // Map triage action to report status
  let status: ReportStatus
  switch (triage.action) {
    case 'auto_block':
      status = 'auto_resolved'
      break
    case 'escalate':
      status = 'escalated'
      break
    case 'dismiss':
      status = 'dismissed'
      break
  }

  return {
    reportId: crypto.randomUUID(),
    status,
    triageAction: triage.action,
    triageReason: triage.reason,
    immediateBlock: triage.immediateBlock,
  }
}

/**
 * Build the SQL query for fetching the admin review queue.
 */
export function buildAdminQueueQuery(filter: AdminQueueFilter = {}): {
  sql: string
  params: unknown[]
} {
  const conditions: string[] = []
  const params: unknown[] = []
  let paramIndex = 1

  if (filter.status) {
    conditions.push(`status = $${paramIndex++}`)
    params.push(filter.status)
  } else {
    conditions.push(`status IN ('pending', 'escalated')`)
  }

  if (filter.reason) {
    conditions.push(`reason = $${paramIndex++}`)
    params.push(filter.reason)
  }

  const limit = Math.min(filter.limit || 50, 100)
  const offset = filter.offset || 0

  const sql = `
    SELECT
      r.id AS report_id,
      r.tool_id,
      t.title AS tool_title,
      t.creator_id,
      r.reason,
      r.description,
      r.triage_action,
      r.status,
      r.created_at,
      (SELECT COUNT(*) FROM reports r2 WHERE r2.tool_id = r.tool_id AND r2.status != 'dismissed') AS report_count
    FROM reports r
    JOIN tools t ON t.id = r.tool_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY
      CASE r.triage_action
        WHEN 'auto_block' THEN 0
        WHEN 'escalate' THEN 1
        ELSE 2
      END,
      r.created_at ASC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `
  params.push(limit, offset)

  return { sql, params }
}
