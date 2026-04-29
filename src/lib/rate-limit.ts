/**
 * In-memory rate limiter — per-lambda instance.
 * State resets on cold start. Suitable for development and low-traffic production.
 *
 * FOR PRODUCTION AT SCALE: replace the Map-based implementation below with
 * Upstash Redis (or similar) while keeping the same exported signature:
 *   checkLimit(userId: string, action: string): boolean
 * The call sites in API routes import only checkLimit, so the swap is a
 * one-file change.
 */

const WINDOW_MS = 60 * 60 * 1000 // 1 hour
const MAX_CALLS = 100

interface BucketEntry {
  count: number
  windowStart: number
}

const buckets = new Map<string, BucketEntry>()

/**
 * Returns true if the call is allowed, false if the limit has been exceeded.
 * 100 calls per userId+action per hour.
 */
export function checkLimit(userId: string, action: string): boolean {
  const key = `${userId}:${action}`
  const now = Date.now()
  const entry = buckets.get(key)

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    buckets.set(key, { count: 1, windowStart: now })
    return true
  }

  if (entry.count >= MAX_CALLS) {
    return false
  }

  entry.count++
  return true
}
