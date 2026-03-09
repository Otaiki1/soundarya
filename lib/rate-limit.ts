import { supabaseAdmin } from './supabase/admin'

const FREE_ANALYSES_PER_DAY = 3
const WINDOW_MS = 24 * 60 * 60 * 1000 // 24 hours

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfter?: number
}

/**
 * Check rate limit for an IP address
 * Free tier: 3 analyses per IP per 24 hours
 *
 * @param ipHash - Hashed IP address (SHA-256)
 * @returns Rate limit status and remaining analyses
 */
export async function checkRateLimit(ipHash: string): Promise<RateLimitResult> {
  try {
    const windowStart = new Date(Date.now() - WINDOW_MS).toISOString()

    // Count analyses from this IP in the last 24 hours
    const { count } = await supabaseAdmin
      .from('analyses')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gt('created_at', windowStart)

    const used = count || 0
    const remaining = Math.max(0, FREE_ANALYSES_PER_DAY - used)

    if (remaining === 0) {
      return {
        allowed: false,
        remaining: 0,
        retryAfter: WINDOW_MS,
      }
    }

    return {
      allowed: true,
      remaining: remaining - 1,
    }
  } catch (error) {
    console.error('[Rate Limit] Error checking rate limit:', error)
    // On error, allow the request (don't block due to service error)
    return {
      allowed: true,
      remaining: FREE_ANALYSES_PER_DAY - 1,
    }
  }
}

/**
 * Hash an IP address for storage (never store raw IPs)
 * Uses SHA-256 with a salt from environment
 */
export async function hashIP(ip: string): Promise<string> {
  try {
    const encoder = new TextEncoder()
    const salt = process.env.CRON_SECRET || 'soundarya-default-salt'
    const data = encoder.encode(ip + salt)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    return hashHex.slice(0, 16) // Use first 16 chars
  } catch (error) {
    console.error('[Rate Limit] Error hashing IP:', error)
    // Fallback: simple hash
    return btoa(ip).slice(0, 16)
  }
}
