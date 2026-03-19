import { LeaderboardEntry } from '@/types/leaderboard'

interface LeaderboardCardProps {
  entry: LeaderboardEntry
  showCountry?: boolean
}

export function LeaderboardCard({ entry, showCountry = false }: LeaderboardCardProps) {
  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'border-gold/30 bg-gold/5'
    if (rank === 2) return 'border-white/10 bg-white/5'
    if (rank === 3) return 'border-white/10 bg-white/5'
    return 'border-white/5 bg-transparent'
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  return (
    <div className={`group border p-5 sm:p-6 transition-all hover:bg-white/2 ${getRankStyle(entry.rank)}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 sm:gap-8">
        <div className="flex items-center gap-4 sm:gap-6 min-w-0">
          <div className="shrink-0 flex items-center justify-center w-12 h-12 rounded-full border border-white/10 bg-deep text-lg font-serif">
            {getRankIcon(entry.rank)}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-1.5 flex-wrap">
              <h3 className="text-lg sm:text-xl font-serif tracking-wide text-text truncate">
                {entry.displayName}
              </h3>
              {showCountry && entry.countryCode && (
                <span className="text-[10px] tracking-[0.2em] text-muted uppercase opacity-60">
                  {entry.countryCode}
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-3xl text-gold leading-none">
                  {entry.overallScore.toFixed(1)}
                </span>
                <span className="text-[10px] text-muted tracking-wide uppercase">Score</span>
              </div>
              
              <div className="h-4 w-px bg-white/10 hidden md:block"></div>
              
              <span className="text-[10px] tracking-[0.12em] uppercase text-muted py-1 px-2.5 border border-white/5 bg-white/5 rounded-sm">
                {entry.category}
              </span>
              
              <span className="text-[10px] tracking-[0.12em] text-muted uppercase">
                Top {entry.percentile}%
              </span>
            </div>
          </div>
        </div>

        <div className="text-[10px] tracking-[0.16em] text-muted uppercase opacity-60 sm:text-right shrink-0">
          {new Date(entry.createdAt).toLocaleDateString(undefined, { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          })}
        </div>
      </div>
    </div>
  )
}