'use client'
import { useState, useEffect } from 'react'
import { LeaderboardCard } from '@/components/leaderboard/LeaderboardCard'
import { LeaderboardEntry } from '@/types/leaderboard'

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState<'global' | 'country'>('global')
  const [country, setCountry] = useState('')

  useEffect(() => {
    fetchLeaderboard()
  }, [type, country])

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ type })
      if (type === 'country' && country) {
        params.set('country', country)
      }

      const response = await fetch(`/api/leaderboard?${params}`)
      if (response.ok) {
        const data = await response.json()
        setEntries(data)
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-shell">
      <div className="section-shell max-w-5xl">
        <div className="text-center mb-12 sm:mb-16">
          <p className="eyebrow mb-4">Rankings</p>
          <h1 className="heading-display text-[clamp(2rem,4vw,3.75rem)] text-text mb-5">
            Beauty <em className="text-gold">Leaderboard</em>
          </h1>
          <p className="text-soft text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            See how you rank among thousands of beauty analyses from around the world.
          </p>
        </div>

        {/* Filters */}
        <div className="surface-card p-6 sm:p-8 mb-8 sm:mb-10">
          <div className="grid sm:grid-cols-2 gap-5 sm:gap-6">
            <div className="flex-1">
              <label className="block eyebrow mb-3">
                Leaderboard Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'global' | 'country')}
                className="w-full bg-surface border border-white/10 text-text text-xs tracking-wide uppercase px-4 py-3 focus:outline-none focus:border-gold transition-colors appearance-none cursor-pointer rounded-sm"
              >
                <option value="global">Global Rankings</option>
                <option value="country">By Country</option>
              </select>
            </div>

            {type === 'country' && (
              <div className="flex-1">
                <label className="block eyebrow mb-3">
                  Country Code
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value.toUpperCase())}
                  placeholder="e.g. US, IN, GB"
                  className="w-full bg-surface border border-white/10 text-text text-xs tracking-wide uppercase px-4 py-3 focus:outline-none focus:border-gold transition-colors placeholder:text-muted/20 rounded-sm"
                  maxLength={2}
                />
              </div>
            )}
          </div>
        </div>

        {/* Leaderboard List */}
        <div className="space-y-3">
          {loading ? (
            <div className="surface-card p-12 text-center">
              <div className="w-12 h-12 border-2 border-white/10 border-t-gold rounded-full animate-spin mx-auto mb-6"></div>
              <p className="eyebrow">Loading rankings...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="surface-card p-12 text-center text-xs tracking-wide uppercase text-soft">
              No entries found for the selected criteria.
            </div>
          ) : (
            <div className="grid gap-4">
              {entries.map((entry) => (
                <LeaderboardCard
                  key={entry.id}
                  entry={entry}
                  showCountry={type === 'global'}
                />
              ))}
            </div>
          )}
        </div>
        
        <div className="mt-10 text-center">
          <p className="text-[10px] tracking-[0.2em] text-muted uppercase opacity-50">
            Updated every hour • Only top 100 displayed
          </p>
        </div>
      </div>
    </div>
  )
}