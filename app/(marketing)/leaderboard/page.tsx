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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Beauty Leaderboard
          </h1>
          <p className="text-gray-600">
            See how you rank among thousands of beauty analyses
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Leaderboard Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'global' | 'country')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="global">Global</option>
                <option value="country">By Country</option>
              </select>
            </div>

            {type === 'country' && (
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country Code
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value.toUpperCase())}
                  placeholder="US, IN, GB, etc."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={2}
                />
              </div>
            )}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading leaderboard...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
              No entries found for the selected criteria.
            </div>
          ) : (
            entries.map((entry) => (
              <LeaderboardCard
                key={entry.id}
                entry={entry}
                showCountry={type === 'global'}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}