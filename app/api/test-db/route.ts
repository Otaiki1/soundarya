import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'edge'

/**
 * Test endpoint to verify database connectivity
 * GET /api/test-db
 *
 * Returns:
 * - 200: Database connected, schema verified
 * - 500: Database connection failed
 */
export async function GET() {
  try {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Not found" },
        { status: 404 },
      )
    }

    // Test 1: Check if profiles table exists and is accessible
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .limit(1)

    if (profilesError) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Cannot query profiles table',
          error: profilesError.message,
        },
        { status: 500 }
      )
    }

    // Test 2: Check if analyses table exists
    const { data: analyses, error: analysesError } = await supabaseAdmin
      .from('analyses')
      .select('id')
      .limit(1)

    if (analysesError) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Cannot query analyses table',
          error: analysesError.message,
        },
        { status: 500 }
      )
    }

    // Test 3: Check if leaderboard view exists
    const { data: leaderboard, error: leaderboardError } = await supabaseAdmin
      .from('leaderboard_daily')
      .select('id')
      .limit(1)

    if (leaderboardError) {
      console.warn('Leaderboard view not found (expected - it needs data):', leaderboardError.message)
    }

    return NextResponse.json(
      {
        status: 'success',
        message: 'Database connection verified',
        tables: {
          profiles: {
            accessible: !profilesError,
            records: profiles?.length || 0,
          },
          analyses: {
            accessible: !analysesError,
            records: analyses?.length || 0,
          },
          leaderboard_daily: {
            accessible: !leaderboardError,
            records: leaderboard?.length || 0,
          },
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json(
      {
        status: 'error',
        message: 'Database connection failed',
        error: String(error),
      },
      { status: 500 }
    )
  }
}
