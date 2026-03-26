/**
 * User profile and authentication types
 */

export interface UserProfile {
  id: string
  username?: string
  wallet_address?: string
  email?: string
  country_code?: string
  avatar_url?: string
  subscription_tier: 'free' | 'premium' | 'elite'
  total_analyses: number
  best_score?: number
  rescan_credits: number
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
