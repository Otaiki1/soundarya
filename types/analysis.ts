import type { AIAnalysisResult, ScoreCategory, FaceArchetype, ImprovementPrediction } from './ai'

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
  stripe_payment_id?: string

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
  proportionalityScore: number
  averagenessScore: number
  neotenyScore: number
  adiposityScore: number
  percentile: number
  category: ScoreCategory
  faceArchetype: FaceArchetype
  confidenceScore: number
  summary: string
  executiveSummary: string
  strengths: string[]
  weaknesses: string[]
  tradeoffs: string[]
  weakestDimension: string
  freeTip: string
  premiumHook: string
  premiumTips: string[]
  citations: string[]
  improvementPredictions: ImprovementPrediction[]
  countryCode?: string
  countryName?: string
  premiumUnlocked: boolean
  unlockTier: number
  persisted: boolean
  persistenceError?: string
  createdAt: string
}

/**
 * Update payload for premium unlock
 */
export interface AnalysisUpdatePremium {
  premium_unlocked: boolean
  premium_tier: 'premium' | 'elite'
  premium_tips: string[]
  stripe_payment_id: string
}
