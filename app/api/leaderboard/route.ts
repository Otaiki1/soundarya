import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { base } from 'viem/chains'
import { SOUNDARYA_LEADERBOARD_ABI, SOUNDARYA_LEADERBOARD_ADDRESS } from '@/lib/contracts'

const publicClient = createPublicClient({
  chain: base,
  transport: http(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const type = searchParams.get('type') || 'global'

    if (type !== 'global') {
      return NextResponse.json(
        { error: 'Onchain leaderboard currently supports global rankings only.' },
        { status: 400 }
      )
    }

    const currentEpoch = await publicClient.readContract({
      address: SOUNDARYA_LEADERBOARD_ADDRESS,
      abi: SOUNDARYA_LEADERBOARD_ABI,
      functionName: 'currentEpoch',
    })

    const topUsers = (await publicClient.readContract({
      address: SOUNDARYA_LEADERBOARD_ADDRESS,
      abi: SOUNDARYA_LEADERBOARD_ABI,
      functionName: 'getTopUsers',
      args: [currentEpoch],
    })) as readonly [readonly `0x${string}`[], readonly bigint[]]

    const [addresses, scores] = topUsers

    const entries = addresses
      .map((address, index) => ({
        address,
        score: scores[index],
      }))
      .filter((entry) => entry.address !== '0x0000000000000000000000000000000000000000')
      .map((entry, index) => ({
        rank: index + 1,
        id: entry.address,
        overallScore: Number(entry.score) / 10,
        displayName: `${entry.address.slice(0, 6)}...${entry.address.slice(-4)}`,
        walletAddress: entry.address,
        minted: true,
        category: 'Verified entry',
        createdAt: new Date().toISOString(),
      }))

    const response = NextResponse.json(entries)
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120')

    return response
  } catch (error) {
    console.error('Leaderboard API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
