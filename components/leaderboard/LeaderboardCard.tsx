import { LeaderboardEntry } from '@/types/leaderboard'

interface LeaderboardCardProps {
  entry: LeaderboardEntry
  showCountry?: boolean
}

export function LeaderboardCard({ entry, showCountry = false }: LeaderboardCardProps) {
  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-600 bg-yellow-50'
    if (rank === 2) return 'text-gray-600 bg-gray-50'
    if (rank === 3) return 'text-orange-600 bg-orange-50'
    return 'text-gray-600 bg-gray-50'
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`flex items-center justify-center w-12 h-12 rounded-full ${getRankColor(entry.rank)}`}>
            <span className="text-lg font-bold">
              {getRankIcon(entry.rank)}
            </span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {entry.displayName}
              </h3>
              {showCountry && entry.countryCode && (
                <span className="text-sm text-gray-500">
                  {entry.countryCode}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4 mt-1">
              <span className="text-2xl font-bold text-blue-600">
                {entry.overallScore.toFixed(1)}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {entry.category}
              </span>
              <span className="text-sm text-gray-600">
                Top {entry.percentile}%
              </span>
            </div>
          </div>
        </div>

        <div className="text-right text-sm text-gray-500">
          {new Date(entry.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  )
}