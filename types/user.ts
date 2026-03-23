/**
 * User profile and authentication types
 */

export interface UserProfile {
  id: string
  username?: string
  email?: string
  country_code?: string
  avatar_url?: string
  subscription_tier: 'free' | 'premium' | 'elite'

  total_analyses: number
  best_score?: number
  created_at: string
  updated_at: string
}

/**
 * Current user session (from auth)
 */
export interface UserSession {
  id: string
  email?: string
  profile?: UserProfile
  isAuthenticated: boolean
}

/**
 * Subscription details
 */
export interface Subscription {
  id: string
  user_id: string
  tier: 'free' | 'premium' | 'elite'

  status: 'active' | 'past_due' | 'cancelled'
  current_period_start?: string
  current_period_end?: string
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}
