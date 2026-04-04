import { NextRequest, NextResponse } from 'next/server'
import { processReport, type ReportSubmission } from '@/lib/shield/report-handler'
import { checkIpRateLimit, rateLimitHeaders } from '@/lib/shield/rate-limiter'

const VALID_REASONS = ['harmful', 'copyright', 'phishing', 'spam', 'nsfw', 'malware', 'other'] as const

export async function POST(req: NextRequest) {
  // IP-based rate limiting for reports
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rateCheck = await checkIpRateLimit(ip, 'report')

  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: 'Too many reports. Please try again later.' },
      { status: 429, headers: rateLimitHeaders(rateCheck) }
    )
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { toolId, reason, description } = body as {
    toolId?: string
    reason?: string
    description?: string
  }

  // Validate required fields
  if (!toolId || typeof toolId !== 'string') {
    return NextResponse.json({ error: 'toolId is required' }, { status: 400 })
  }

  if (!reason || !VALID_REASONS.includes(reason as (typeof VALID_REASONS)[number])) {
    return NextResponse.json(
      { error: `reason must be one of: ${VALID_REASONS.join(', ')}` },
      { status: 400 }
    )
  }

  // Validate description length if provided
  if (description && (typeof description !== 'string' || description.length > 2000)) {
    return NextResponse.json(
      { error: 'description must be a string under 2000 characters' },
      { status: 400 }
    )
  }

  // TODO: extract userId from auth session (Clerk) once auth is wired up
  const reporterId = ip

  const submission: ReportSubmission = {
    toolId,
    reporterId,
    reason: reason as ReportSubmission['reason'],
    description: description || undefined,
  }

  const result = processReport({
    submission,
    existingReports: [], // TODO: query DB for existing reports on this tool
    toolModerationRiskScore: undefined,
    creatorIsVerified: false,
  })

  return NextResponse.json(
    {
      reportId: result.reportId,
      status: result.status,
      message: 'Report submitted. Thank you for helping keep AgentDoom safe.',
    },
    { status: 201, headers: rateLimitHeaders(rateCheck) }
  )
}
