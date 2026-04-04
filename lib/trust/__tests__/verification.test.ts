import { describe, it, expect } from 'vitest'
import { checkVerification, shouldRevokeVerification, type CreatorProfile } from '../verification'

describe('checkVerification', () => {
  const fullyQualifiedProfile: CreatorProfile = {
    userId: 'user-1',
    emailVerified: true,
    toolsCreated: 15,
    averageRating: 4.5,
    activeViolations: 0,
    isVerified: true,
  }

  it('returns eligible and verified for fully qualified creator', () => {
    const status = checkVerification(fullyQualifiedProfile)
    expect(status.eligible).toBe(true)
    expect(status.verified).toBe(true)
    expect(status.requirements.every((r) => r.met)).toBe(true)
  })

  it('returns not eligible when email is not verified', () => {
    const status = checkVerification({ ...fullyQualifiedProfile, emailVerified: false })
    expect(status.eligible).toBe(false)
    expect(status.requirements.find((r) => r.key === 'identityVerified')!.met).toBe(false)
  })

  it('returns not eligible with fewer than 10 tools', () => {
    const status = checkVerification({ ...fullyQualifiedProfile, toolsCreated: 5 })
    expect(status.eligible).toBe(false)
    expect(status.requirements.find((r) => r.key === 'minTools')!.met).toBe(false)
  })

  it('returns not eligible with low rating', () => {
    const status = checkVerification({ ...fullyQualifiedProfile, averageRating: 3.5 })
    expect(status.eligible).toBe(false)
  })

  it('returns not eligible with active violations', () => {
    const status = checkVerification({ ...fullyQualifiedProfile, activeViolations: 1 })
    expect(status.eligible).toBe(false)
  })

  it('returns eligible but not verified if isVerified is false', () => {
    const status = checkVerification({ ...fullyQualifiedProfile, isVerified: false })
    expect(status.eligible).toBe(true)
    expect(status.verified).toBe(false)
  })
})

describe('shouldRevokeVerification', () => {
  it('revokes when verified creator gets a violation', () => {
    expect(shouldRevokeVerification({
      userId: 'u1', emailVerified: true, toolsCreated: 10,
      averageRating: 4.5, activeViolations: 1, isVerified: true,
    })).toBe(true)
  })

  it('does not revoke for unverified creator', () => {
    expect(shouldRevokeVerification({
      userId: 'u1', emailVerified: true, toolsCreated: 10,
      averageRating: 4.5, activeViolations: 1, isVerified: false,
    })).toBe(false)
  })

  it('does not revoke for verified creator with no violations', () => {
    expect(shouldRevokeVerification({
      userId: 'u1', emailVerified: true, toolsCreated: 10,
      averageRating: 4.5, activeViolations: 0, isVerified: true,
    })).toBe(false)
  })
})
