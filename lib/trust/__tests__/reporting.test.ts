import { describe, it, expect } from 'vitest'
import { triageReport } from '../reporting'

describe('triageReport', () => {
  it('auto-blocks high-priority report on tool with existing risk score', () => {
    const result = triageReport({
      report: { reason: 'phishing' },
      existingReports: [],
      toolModerationRiskScore: 75,
      creatorIsVerified: false,
    })

    expect(result.action).toBe('auto_block')
    expect(result.immediateBlock).toBe(true)
  })

  it('escalates high-priority report on tool without risk score', () => {
    const result = triageReport({
      report: { reason: 'malware' },
      existingReports: [],
      toolModerationRiskScore: 10,
      creatorIsVerified: false,
    })

    expect(result.action).toBe('escalate')
    expect(result.immediateBlock).toBe(false)
  })

  it('escalates when unique reporter threshold is reached', () => {
    const result = triageReport({
      report: { reason: 'spam' },
      existingReports: [
        { reporterId: 'user-1', reason: 'spam' },
        { reporterId: 'user-2', reason: 'spam' },
      ],
      creatorIsVerified: false,
    })

    expect(result.action).toBe('escalate')
    expect(result.reason).toContain('unique reporters')
  })

  it('dismisses low-priority report on verified creator', () => {
    const result = triageReport({
      report: { reason: 'spam' },
      existingReports: [],
      creatorIsVerified: true,
    })

    expect(result.action).toBe('dismiss')
  })

  it('does not dismiss high-priority report on verified creator', () => {
    const result = triageReport({
      report: { reason: 'phishing' },
      existingReports: [],
      creatorIsVerified: true,
    })

    expect(result.action).not.toBe('dismiss')
  })

  it('escalates by default for unverified creator with low-priority report', () => {
    const result = triageReport({
      report: { reason: 'other' },
      existingReports: [],
      creatorIsVerified: false,
    })

    expect(result.action).toBe('escalate')
    expect(result.reason).toContain('human review')
  })
})
