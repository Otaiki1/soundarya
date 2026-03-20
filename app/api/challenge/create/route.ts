import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { analysisId } = await request.json()

    if (!analysisId) {
      return NextResponse.json({ error: 'Analysis ID required' }, { status: 400 })
    }

    // Get analysis to verify it exists
    const { data: analysis, error: analysisError } = await supabaseAdmin
      .from('analyses')
      .select('id, user_id')
      .eq('id', analysisId)
      .single()

    if (analysisError || !analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })
    }

    // Generate unique token
    const token = crypto.randomBytes(16).toString('hex')

    // Create challenge
    const { data: challenge, error: createError } = await supabaseAdmin
      .from('challenges')
      .insert({
        challenger_id: analysis.user_id,
        analysis_id: analysisId,
        token,
      })
      .select()
      .single()

    if (createError || !challenge) {
      console.error('Challenge creation error:', createError)
      return NextResponse.json({ error: 'Failed to create challenge' }, { status: 500 })
    }

    const challengeUrl = `${request.nextUrl.origin}/challenge/${token}`

    return NextResponse.json({
      challengeId: challenge.id,
      token,
      challengeUrl,
    })
  } catch (error) {
    console.error('Challenge creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
