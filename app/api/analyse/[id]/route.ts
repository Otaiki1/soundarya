import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  PERSONALIZED_PREMIUM_HOOK,
  personalizeReportList,
  personalizeReportText,
} from '@/lib/report-copy'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: analysisId } = await params
    if (!analysisId) {
      return NextResponse.json(
        { error: 'Analysis ID is required' },
        { status: 400 }
      )
    }

    // Check if user is authenticated
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let analysis

    if (user) {
      // Authenticated user: check ownership by user_id
      const { data, error } = await supabaseAdmin
        .from('analyses')
        .select('*')
        .eq('id', analysisId)
        .eq('user_id', user.id)
        .single()

      if (error || !data) {
        return NextResponse.json(
          { error: 'Analysis not found or access denied' },
          { status: 404 }
        )
      }

      analysis = data
    } else {
      // Anonymous user: check ownership by session_id from query params
      const sessionId = request.nextUrl.searchParams.get('sessionId')
      if (!sessionId) {
        return NextResponse.json(
          { error: 'Session ID required for anonymous access' },
          { status: 401 }
        )
      }

      const { data, error } = await supabaseAdmin
        .from('analyses')
        .select('*')
        .eq('id', analysisId)
        .eq('session_id', sessionId)
        .single()

      if (error || !data) {
        return NextResponse.json(
          { error: 'Analysis not found or access denied' },
          { status: 404 }
        )
      }

      analysis = data
    }

    // Return analysis data (exclude premium content unless user has paid)
    const response = {
      id: analysis.id,
      overallScore: analysis.overall_score,
      symmetryScore: analysis.symmetry_score,
      goldenRatioScore: analysis.golden_ratio_score,
      boneStructureScore: analysis.bone_structure_score,
      harmonyScore: analysis.harmony_score,
      skinScore: analysis.skin_score,
      dimorphismScore: analysis.dimorphism_score,
      percentile: analysis.percentile,
      category: analysis.category,
      summary: personalizeReportText(analysis.summary),
      strengths: personalizeReportList(analysis.strengths),
      weakestDimension: analysis.weakest_dimension,
      freeTip: personalizeReportText(analysis.free_tip),
      premiumHook: PERSONALIZED_PREMIUM_HOOK,
      countryCode: analysis.country_code,
      createdAt: analysis.created_at,
      // Only include premium tips if user has paid (check payment status)
      // For now, exclude premium content - will be added in Phase 5
      // premiumTips: analysis.premium_tips
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Fetch analysis error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
