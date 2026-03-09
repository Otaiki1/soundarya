import { GrokAnalysisResult, ScoreCategory } from './grok'

export interface Analysis extends GrokAnalysisResult {
  id: string
  userId?: string
  sessionId: string
  ipHash: string
  premiumUnlocked: boolean
  premiumTier: 'free' | 'premium' | 'elite'
  premiumTips?: string[]
  stripePaymentId?: string
  countryCode?: string
  countryName?: string
  r2Key?: string
  photoDeletedAt?: string
  sharedCount: number
  challengeToken?: string
  createdAt: string
  updatedAt: string
}

export interface AnalysisMetadata {
  id: string
  overallScore: number
  category: ScoreCategory
  percentile: number
  countryCode?: string
  countryName?: string
  createdAt: string
}
