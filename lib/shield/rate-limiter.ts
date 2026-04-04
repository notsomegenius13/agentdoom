/**
 * Shield: Rate Limiter
 * Redis-based per-user and per-IP rate limiting via Upstash.
 *
 * Generation limits:
 *   - Anonymous: 3/hour per IP
 *   - Free user: 10/hour
 *   - Pro user: 100/hour
 *
 * API limits: 60 requests/min per IP for all /api/* endpoints
 * Admin bypass: requests with valid ADMIN_API_KEY skip all limits
 */

import { Redis } from '@upstash/redis'

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  limit: number
  resetInSeconds: number
  retryAfterSeconds?: number
}

export type UserTier = 'anonymous' | 'free' | 'pro'

const TIER_LIMITS: Record<UserTier, number> = {
  anonymous: 3,
  free: 10,
  pro: 100,
}

const WINDOW_SECONDS = 3600 // 1 hour

/** Per-IP limits for general API abuse prevention */
const IP_LIMITS: Record<string, { limit: number; windowSeconds: number }> = {
  generate: { limit: 3, windowSeconds: 3600 },     // 3 generations/hour per IP (anonymous)
  api: { limit: 60, windowSeconds: 60 },            // 60 requests/minute per IP
  report: { limit: 10, windowSeconds: 3600 },       // 10 reports/hour per IP
}

/**
 * Check if a request carries a valid admin API key that bypasses rate limits.
 */
export function isAdminRequest(authHeader: string | null): boolean {
  const adminKey = process.env.ADMIN_API_KEY
  if (!adminKey) return false
  if (!authHeader) return false
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader
  return token === adminKey
}

let redis: Redis | null = null

function isRedisConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
}

function allowedResult(limit: number, windowSeconds: number): RateLimitResult {
  return {
    allowed: true,
    remaining: limit,
    limit,
    resetInSeconds: windowSeconds,
  }
}

function getRedis(): Redis {
  if (!isRedisConfigured()) {
    throw new Error('Upstash Redis is not configured')
  }
  if (!redis) {
    redis = Redis.fromEnv()
  }
  return redis
}

function rateLimitKey(userId: string): string {
  return `shield:ratelimit:${userId}`
}

/**
 * Check and consume a rate limit token for a user.
 * Uses Redis sliding window counter with TTL.
 */
export async function checkRateLimit(
  userId: string,
  tier: UserTier = 'free'
): Promise<RateLimitResult> {
  const limit = TIER_LIMITS[tier]
  if (!isRedisConfigured()) return allowedResult(limit, WINDOW_SECONDS)

  const client = getRedis()
  const key = rateLimitKey(userId)

  try {
    // Atomic increment + TTL set
    const current = await client.incr(key)

    // Set TTL on first request in window
    if (current === 1) {
      await client.expire(key, WINDOW_SECONDS)
    }

    const ttl = await client.ttl(key)
    const resetInSeconds = ttl > 0 ? ttl : WINDOW_SECONDS

    if (current > limit) {
      return {
        allowed: false,
        remaining: 0,
        limit,
        resetInSeconds,
        retryAfterSeconds: resetInSeconds,
      }
    }

    return {
      allowed: true,
      remaining: limit - current,
      limit,
      resetInSeconds,
    }
  } catch {
    return allowedResult(limit, WINDOW_SECONDS)
  }
}

/**
 * Get current usage without consuming a token.
 */
export async function getRateLimitStatus(
  userId: string,
  tier: UserTier = 'free'
): Promise<RateLimitResult> {
  const limit = TIER_LIMITS[tier]
  if (!isRedisConfigured()) return allowedResult(limit, WINDOW_SECONDS)

  const client = getRedis()
  const key = rateLimitKey(userId)

  try {
    const current = (await client.get<number>(key)) || 0
    const ttl = await client.ttl(key)
    const resetInSeconds = ttl > 0 ? ttl : WINDOW_SECONDS

    return {
      allowed: current < limit,
      remaining: Math.max(0, limit - current),
      limit,
      resetInSeconds,
      retryAfterSeconds: current >= limit ? resetInSeconds : undefined,
    }
  } catch {
    return allowedResult(limit, WINDOW_SECONDS)
  }
}

/**
 * Check IP-based rate limit for a specific action category.
 * Provides abuse prevention independent of user authentication.
 */
export async function checkIpRateLimit(
  ip: string,
  action: keyof typeof IP_LIMITS = 'api'
): Promise<RateLimitResult> {
  const config = IP_LIMITS[action] || IP_LIMITS.api
  if (!isRedisConfigured()) return allowedResult(config.limit, config.windowSeconds)

  const client = getRedis()
  const key = `shield:ip:${action}:${ip}`

  try {
    const current = await client.incr(key)

    if (current === 1) {
      await client.expire(key, config.windowSeconds)
    }

    const ttl = await client.ttl(key)
    const resetInSeconds = ttl > 0 ? ttl : config.windowSeconds

    if (current > config.limit) {
      return {
        allowed: false,
        remaining: 0,
        limit: config.limit,
        resetInSeconds,
        retryAfterSeconds: resetInSeconds,
      }
    }

    return {
      allowed: true,
      remaining: config.limit - current,
      limit: config.limit,
      resetInSeconds,
    }
  } catch {
    return allowedResult(config.limit, config.windowSeconds)
  }
}

/**
 * Build standard rate limit headers for HTTP responses.
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.resetInSeconds),
  }
  if (result.retryAfterSeconds !== undefined) {
    headers['Retry-After'] = String(result.retryAfterSeconds)
  }
  return headers
}

/**
 * Log a rate limit hit to Redis for analytics/monitoring.
 * Stored as a daily counter so Ledgers dashboard can query it.
 */
export async function logRateLimitHit(
  identifier: string,
  action: string,
  tier: UserTier | 'ip'
): Promise<void> {
  try {
    const client = getRedis()
    const date = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    const key = `shield:ratelimit:hits:${date}:${action}:${tier}`
    await client.incr(key)
    // Expire after 30 days
    await client.expire(key, 30 * 24 * 3600)
    console.warn(`[Shield] Rate limit hit: ${action} ${tier} ${identifier}`)
  } catch {
    // Non-critical — don't block the request
  }
}

/**
 * Build a 429 JSON response with rate limit headers and a friendly message.
 */
export function rateLimitResponse(
  message: string,
  result: RateLimitResult
): Response {
  return new Response(
    JSON.stringify({
      error: message,
      remaining: 0,
      resetInSeconds: result.resetInSeconds,
    }),
    {
      status: 429,
      headers: { 'Content-Type': 'application/json', ...rateLimitHeaders(result) },
    }
  )
}
