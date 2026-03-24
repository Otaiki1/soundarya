export interface LeaderboardEntry {
  rank: number
  id: string
  overallScore: number
  percentile?: number | null
  category?: string
  countryCode?: string
  displayName: string
  createdAt: string
  walletAddress?: string
  minted?: boolean
}
