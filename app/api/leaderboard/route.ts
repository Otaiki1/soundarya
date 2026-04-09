import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const type = searchParams.get('type') || 'global'
    const country = searchParams.get('country')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)

    if (type !== 'global' && type !== 'country') {
      return NextResponse.json(
        { error: 'Invalid type. Must be "global" or "country"' },
        { status: 400 }
      )
    }

    if (type === 'country' && !country) {
      return NextResponse.json(
        { error: 'Country code required for country leaderboard' },
        { status: 400 }
      )
    }

    let query = supabaseAdmin
      .from('leaderboard_daily')
      .select(`
        id,
        overall_score,
        percentile,
        category,
        country_code,
        created_at,
        profiles!user_id (
          display_name
        )
      `)
      .order('overall_score', { ascending: false })
      .limit(limit)

    // Filter by country if specified
    if (type === 'country' && country) {
      query = query.eq('country_code', country.toUpperCase())
    }

    const { data: leaderboard, error } = await query

    if (error) {
      console.error('Leaderboard query error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard' },
        { status: 500 }
      )
    }

    // Transform the data for client response
    const transformedLeaderboard = leaderboard?.map((entry, index) => ({
      rank: index + 1,
      id: entry.id,
      overallScore: entry.overall_score,
      percentile: entry.percentile,
      category: entry.category,
      countryCode: entry.country_code,
      displayName: (entry.profiles as any)?.display_name || 'Anonymous',
      createdAt: entry.created_at
    })) || []

    // Cache headers: 5 minutes with stale-while-revalidate
    const response = NextResponse.json(transformedLeaderboard)
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')

    return response

  } catch (error) {
    console.error('Leaderboard API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}