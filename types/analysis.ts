import type { AIAnalysisResult, ScoreCategory } from './ai'

/**
 * Loading stages for analysis animation
 */
export type LoadingStage = 'detecting' | 'symmetry' | 'ratio' | 'structure' | 'writing'

/**
 * Analysis database record (uses snake_case from DB)
 */
export interface Analysis extends AIAnalysisResult {
  id: string
  user_id?: string
  session_id: string
  ip_hash: string

  // Payment
  premium_unlocked: boolean
  premium_tier: 'free' | 'premium' | 'elite'
  premium_tips?: string[]


  // Metadata
  country_code?: string
  country_name?: string
  r2_key?: string
  photo_deleted_at?: string
  shared_count: number
  challenge_token?: string

  // Timestamps
  created_at: string
  updated_at: string
}

/**
 * Client-safe analysis (public fields only, no premium content if not paid)
 */
export interface AnalysisPublic {
  id: string
  overallScore: number
  symmetryScore: number
  goldenRatioScore: number
  boneStructureScore: number
  harmonyScore: number
  skinScore: number
  dimorphismScore: number
  percentile: number
  category: ScoreCategory
  summary: string
  strengths: string[]
  freeTip: string
  premiumHook: string
  countryCode?: string
  countryName?: string
  premiumUnlocked: boolean
  createdAt: string
}

/**
 * Update payload for premium unlock
 */
export interface AnalysisUpdatePremium {
  premium_unlocked: boolean
  premium_tier: 'premium' | 'elite'
  premium_tips: string[]

}
