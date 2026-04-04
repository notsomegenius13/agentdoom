import { describe, it, expect, vi, beforeEach } from 'vitest'
import { moderateTool, preScreenPrompt, type ModerationResult } from '../moderate'

// Mock the models layer
vi.mock('@/lib/models', () => ({
  complete: vi.fn(),
}))

import { complete } from '@/lib/models'
const mockComplete = vi.mocked(complete)

function mockModerationResponse(flags: Array<{ category: string; confidence: number; reason: string }>, riskScore: number) {
  mockComplete.mockResolvedValueOnce({
    content: JSON.stringify({ flags, riskScore }),
    model: 'claude-haiku-4-5-20251001',
    latency: 50,
    cost: 0.001,
    usedFallback: false,
  })
}

describe('moderateTool', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('passes clean content', async () => {
    mockModerationResponse(
      [{ category: 'clean', confidence: 1.0, reason: 'No policy violations detected' }],
      0
    )

    const result = await moderateTool({
      prompt: 'Build a tip calculator',
      title: 'Tip Calculator',
      html: '<div>Calculator HTML</div>',
    })

    expect(result.verdict).toBe('pass')
    expect(result.riskScore).toBe(0)
    expect(result.flags[0].category).toBe('clean')
  })

  it('blocks high-risk content (riskScore >= 80)', async () => {
    mockModerationResponse(
      [{ category: 'phishing', confidence: 0.95, reason: 'Fake login form collecting credentials' }],
      92
    )

    const result = await moderateTool({
      prompt: 'Make a Google login page',
      title: 'Google Login',
      html: '<form><input name="password"></form>',
    })

    expect(result.verdict).toBe('block')
    expect(result.riskScore).toBe(92)
    expect(result.flags[0].category).toBe('phishing')
  })

  it('flags medium-risk content for review (40 <= riskScore < 80)', async () => {
    mockModerationResponse(
      [{ category: 'copyright', confidence: 0.6, reason: 'May contain copyrighted lyrics' }],
      55
    )

    const result = await moderateTool({
      prompt: 'Song lyrics display',
      title: 'Lyrics Viewer',
      html: '<div>Some lyrics</div>',
    })

    expect(result.verdict).toBe('review')
    expect(result.riskScore).toBe(55)
  })

  it('handles multiple flags', async () => {
    mockModerationResponse(
      [
        { category: 'spam', confidence: 0.7, reason: 'SEO spam patterns' },
        { category: 'malware', confidence: 0.5, reason: 'Suspicious external script' },
      ],
      65
    )

    const result = await moderateTool({
      prompt: 'SEO booster tool',
      title: 'SEO Tool',
      html: '<script src="http://evil.com/mine.js"></script>',
    })

    expect(result.verdict).toBe('review')
    expect(result.flags).toHaveLength(2)
  })

  it('clamps confidence to 0-1 range', async () => {
    mockModerationResponse(
      [{ category: 'harmful', confidence: 1.5, reason: 'test' }],
      30
    )

    const result = await moderateTool({
      prompt: 'test', title: 'test', html: '<div></div>',
    })

    expect(result.flags[0].confidence).toBe(1)
  })

  it('clamps riskScore to 0-100 range', async () => {
    mockModerationResponse(
      [{ category: 'clean', confidence: 1.0, reason: 'clean' }],
      -10
    )

    const result = await moderateTool({
      prompt: 'test', title: 'test', html: '<div></div>',
    })

    expect(result.riskScore).toBe(0)
  })

  it('calls model with correct task type', async () => {
    mockModerationResponse(
      [{ category: 'clean', confidence: 1.0, reason: 'clean' }],
      0
    )

    await moderateTool({
      prompt: 'Build a calculator',
      title: 'Calculator',
      html: '<div>calc</div>',
    })

    expect(mockComplete).toHaveBeenCalledWith(
      expect.objectContaining({ task: 'moderate' })
    )
  })
})

describe('preScreenPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('screens prompt without html', async () => {
    mockModerationResponse(
      [{ category: 'clean', confidence: 1.0, reason: 'No issues' }],
      0
    )

    const result = await preScreenPrompt('Build me a todo list')
    expect(result.verdict).toBe('pass')
  })
})
