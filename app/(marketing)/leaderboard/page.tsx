'use client'

import { useState, useEffect } from 'react'
import { LeaderboardCard } from '@/components/leaderboard/LeaderboardCard'
import { LeaderboardEntry } from '@/types/leaderboard'
import { useReadContract } from 'wagmi'
import { SOUNDARYA_LEADERBOARD_ADDRESS, SOUNDARYA_LEADERBOARD_ABI } from '@/lib/contracts'
import { Navbar } from '@/components/ui/Navbar'

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  // 1. Fetch current epoch
  const { data: currentEpoch } = useReadContract({
    abi: SOUNDARYA_LEADERBOARD_ABI,
    address: SOUNDARYA_LEADERBOARD_ADDRESS as `0x${string}`,
    functionName: 'currentEpoch',
  })

  // 2. Fetch top users from the contract
  const { data: topUsers, isLoading: isContractLoading } = useReadContract({
    abi: SOUNDARYA_LEADERBOARD_ABI,
    address: SOUNDARYA_LEADERBOARD_ADDRESS as `0x${string}`,
    functionName: 'getTopUsers',
    args: [currentEpoch || BigInt(0)],
    query: {
      enabled: !!currentEpoch,
    }
  })

  useEffect(() => {
    if (topUsers && Array.isArray(topUsers) && topUsers.length >= 2) {
      const addresses = topUsers[0] as readonly `0x${string}`[]
      const scores = topUsers[1] as readonly bigint[]
      const validEntries = addresses
        .map((address, index) => ({
          address,
          score: Number(scores[index] ?? BigInt(0)),
        }))
        .filter((entry) => entry.address !== '0x0000000000000000000000000000000000000000')

      const transformed: LeaderboardEntry[] = validEntries.map((entry, index) => ({
        rank: index + 1,
        id: entry.address,
        overallScore: entry.score / 10,
        displayName: `${entry.address.slice(0, 6)}...${entry.address.slice(-4)}`,
        walletAddress: entry.address,
        minted: true,
        category: 'Verified entry',
        createdAt: new Date().toISOString(),
      }))

      setEntries(transformed)
      setLoading(false)
    } else if (!isContractLoading) {
      setEntries([])
      setLoading(false)
    }
  }, [topUsers, isContractLoading])

  return (
    <div className="min-h-screen bg-deep text-text">
      <Navbar />
      <div className="page-shell pt-32 sm:pt-40">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-16 sm:mb-24 reveal">
          <div className="max-w-2xl">
            <p className="eyebrow mb-6">Rankings</p>
            <h1 className="font-serif text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.05] font-light text-text">
              Top Scores <br />
              <em className="text-gold italic">On-Chain</em>
            </h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-x-12 gap-y-6 border-b border-border-light pb-4">
            <span className="text-[10px] tracking-[0.25em] uppercase text-gold border-b border-gold -mb-[17px] pb-4">
              Global Epoch {currentEpoch?.toString() || '...'}
            </span>
          </div>
        </div>

        {/* Leaderboard List */}
        <div className="space-y-3">
          {loading || isContractLoading ? (
            <div className="surface-card p-12 text-center">
              <div className="w-12 h-12 border-2 border-white/10 border-t-gold rounded-full animate-spin mx-auto mb-6"></div>
              <p className="eyebrow">Loading on-chain rankings...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="surface-card p-12 text-center text-xs tracking-wide uppercase text-soft">
              No entries found for the current epoch.
            </div>
          ) : (
            <div className="grid gap-4">
              {entries.map((entry) => (
                <LeaderboardCard
                  key={entry.id}
                  entry={entry}
                  showCountry={true}
                />
              ))}
            </div>
          )}
        </div>
        
        <div className="mt-10 text-center">
          <p className="text-[10px] tracking-[0.2em] text-muted uppercase opacity-50">
            Updated in real-time on Base • Top 10 displayed
          </p>
        </div>
        </div>
      </div>
    </div>
  )
}
