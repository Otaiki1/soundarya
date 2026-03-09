export type GrokTier = 'free' | 'premium'

export type ScoreCategory =
  | 'Exceptional'
  | 'Very Attractive'
  | 'Above Average'
  | 'Average'
  | 'Below Average'

export interface GrokAnalysisResult {
  overallScore: number           // 1.0–10.0
  symmetryScore: number          // 1–100
  goldenRatioScore: number       // 1–100
  boneStructureScore: number     // 1–100
  harmonyScore: number           // 1–100
  skinScore: number              // 1–100
  dimorphismScore: number        // 1–100
  percentile: number             // 1–99 (top X%)
  category: ScoreCategory
  summary: string
  strengths: string[]
  weakestDimension: string
  freeTip: string
  premiumHook: string
  premiumTips?: string[]         // only present in premium tier
}

export interface AnalysisResponse {
  id: string
  overallScore: number
  symmetryScore: number
  goldenRatioScore: number
  boneStructureScore: number
  harmonyScore: number
  percentile: number
  category: ScoreCategory
  summary: string
  strengths: string[]
  freeTip: string
  premiumHook: string
  countryCode?: string
}
