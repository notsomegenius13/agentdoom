/**
 * Creator Verification System for AgentDoom
 *
 * Verification badge requirements:
 * 1. Identity confirmed (email verified via Clerk)
 * 2. At least 10 published tools
 * 3. Average rating of 4+ stars across tools
 * 4. Zero active moderation violations
 */

export interface VerificationStatus {
  eligible: boolean
  verified: boolean
  requirements: VerificationRequirement[]
}

export interface VerificationRequirement {
  key: string
  label: string
  met: boolean
  current: number | boolean
  target: number | boolean
}

export interface CreatorProfile {
  userId: string
  emailVerified: boolean
  toolsCreated: number
  averageRating: number
  activeViolations: number
  isVerified: boolean
}

const REQUIREMENTS = {
  identityVerified: { label: 'Email verified', target: true },
  minTools: { label: 'At least 10 published tools', target: 10 },
  minRating: { label: 'Average rating 4+ stars', target: 4.0 },
  noViolations: { label: 'No active moderation violations', target: 0 },
} as const

/**
 * Check if a creator meets all verification requirements.
 */
export function checkVerification(profile: CreatorProfile): VerificationStatus {
  const requirements: VerificationRequirement[] = [
    {
      key: 'identityVerified',
      label: REQUIREMENTS.identityVerified.label,
      met: profile.emailVerified === true,
      current: profile.emailVerified,
      target: true,
    },
    {
      key: 'minTools',
      label: REQUIREMENTS.minTools.label,
      met: profile.toolsCreated >= REQUIREMENTS.minTools.target,
      current: profile.toolsCreated,
      target: REQUIREMENTS.minTools.target,
    },
    {
      key: 'minRating',
      label: REQUIREMENTS.minRating.label,
      met: profile.averageRating >= REQUIREMENTS.minRating.target,
      current: profile.averageRating,
      target: REQUIREMENTS.minRating.target,
    },
    {
      key: 'noViolations',
      label: REQUIREMENTS.noViolations.label,
      met: profile.activeViolations === 0,
      current: profile.activeViolations,
      target: 0,
    },
  ]

  const eligible = requirements.every((r) => r.met)

  return {
    eligible,
    verified: profile.isVerified && eligible,
    requirements,
  }
}

/**
 * Revoke verification if a creator receives a new moderation violation.
 * Returns true if verification was revoked.
 */
export function shouldRevokeVerification(profile: CreatorProfile): boolean {
  if (!profile.isVerified) return false
  return profile.activeViolations > 0
}
