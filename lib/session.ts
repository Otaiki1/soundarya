/**
 * Session management for anonymous users
 * Each user gets a unique session token stored in localStorage
 * This is used for rate limiting and tracking free analyses
 */

const SESSION_KEY = 'soundarya_session_id'

/**
 * Get or create a unique session ID for this user/device
 * Used for rate limiting and anonymous analysis tracking
 */
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') {
    // Server-side: generate a new one
    return crypto.randomUUID()
  }

  let sessionId = localStorage.getItem(SESSION_KEY)
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem(SESSION_KEY, sessionId)
  }
  return sessionId
}

/**
 * Clear the session (for logout)
 */
export function clearSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY)
  }
}

/**
 * Verify session is valid (exists)
 */
export function hasValidSession(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  return !!localStorage.getItem(SESSION_KEY)
}
