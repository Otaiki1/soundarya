export interface LeaderboardEntry {
  rank: number
  id: string
  overallScore: number
  percentile: number
  category: string
  countryCode?: string
  displayName: string
  createdAt: string
}