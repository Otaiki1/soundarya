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
    <div className="page-shell pt-32 sm:pt-40">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-16 sm:mb-24 reveal">
          <div className="max-w-2xl">
            <p className="eyebrow mb-6">Rankings</p>
            <h1 className="font-serif text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.05] font-light text-text">
              Top Scores <br />
              <em className="text-gold italic">Globally</em>
            </h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-x-12 gap-y-6 border-b border-border-light pb-4">
            <button
              onClick={() => setType('global')}
              className={`text-[10px] tracking-[0.25em] uppercase transition-all ${type === 'global' ? 'text-gold border-b border-gold -mb-[17px] pb-4' : 'text-muted hover:text-text'}`}
            >
              Global
            </button>
            <button
              onClick={() => setType('country')}
              className={`text-[10px] tracking-[0.25em] uppercase transition-all ${type === 'country' ? 'text-gold border-b border-gold -mb-[17px] pb-4' : 'text-muted hover:text-text'}`}
            >
              By Country
            </button>
            
            {type === 'country' && (
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value.toUpperCase())}
                placeholder="Region Code (US, IN...)"
                className="bg-transparent border-none text-[10px] tracking-[0.25em] uppercase text-gold placeholder:text-muted/30 focus:outline-none w-40"
                maxLength={2}
              />
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