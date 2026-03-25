import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { checkRateLimit } from '@/lib/rate-limit'
import { validateImage, processImageForAnalysis, imageToBase64 } from '@/lib/image-validation'
import { analyseWithGemini } from '@/lib/gemini'
import { getCountryFromIP } from '@/lib/ip-geolocation'
import { extractIPFromRequest } from '@/lib/ip-geolocation'
import { hashIP } from '@/lib/rate-limit'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData()
    const photo = formData.get('photo') as File
    const sessionId = formData.get('sessionId') as string

    if (!photo || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields: photo and sessionId' },
        { status: 400 }
      )
    }

    // Get client IP for rate limiting and geolocation
    const clientIP = extractIPFromRequest(request)
    if (!clientIP) {
      return NextResponse.json(
        { error: 'Unable to determine client IP' },
        { status: 400 }
      )
    }

    const ipHash = await hashIP(clientIP)

    // Check rate limit (3 free analyses per IP per 24h)
    const rateLimitResult = await checkRateLimit(ipHash)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: rateLimitResult.retryAfter,
          remaining: rateLimitResult.remaining
        },
        { status: 429 }
      )
    }

    // Validate image
    const validation = await validateImage(photo)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Process image for analysis (resize, compress)
    const processedImage = await processImageForAnalysis(photo)

    // Convert to base64 for Gemini image analysis
    const imageBase64 = imageToBase64(processedImage.buffer)

    // Get country for leaderboard
    const country = await getCountryFromIP(clientIP)

    // Call Gemini API (free tier)
    const aiResult = await analyseWithGemini(imageBase64, 'image/jpeg', 'free')

    if (!aiResult.success || !aiResult.result) {
      return NextResponse.json(
        { error: 'AI analysis failed: ' + (aiResult.error?.error || 'Unknown error') },
        { status: 500 }
      )
    }

    const analysis = aiResult.result

    // Store analysis in database
    const { data: storedAnalysis, error: dbError } = await supabaseAdmin
      .from('analyses')
      .insert({
        session_id: sessionId,
        ip_hash: ipHash,
        country_code: country.countryCode,
        country_name: country.countryName,
        overall_score: analysis.overallScore,
        symmetry_score: analysis.symmetryScore,
        golden_ratio_score: analysis.goldenRatioScore,
        bone_structure_score: analysis.boneStructureScore,
        harmony_score: analysis.harmonyScore,
        skin_score: analysis.skinScore,
        dimorphism_score: analysis.dimorphismScore,
        percentile: analysis.percentile,
        category: analysis.category,
        summary: analysis.summary,
        strengths: analysis.strengths,
        weakest_dimension: analysis.weakestDimension,
        free_tip: analysis.freeTip,
        premium_hook: analysis.premiumHook,
        // premium_tips not stored for free tier
        photo_deleted_at: new Date().toISOString()
      })
      .select('id, created_at')
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({
        id: randomUUID(),
        overallScore: analysis.overallScore,
        symmetryScore: analysis.symmetryScore,
        goldenRatioScore: analysis.goldenRatioScore,
        boneStructureScore: analysis.boneStructureScore,
        harmonyScore: analysis.harmonyScore,
        skinScore: analysis.skinScore,
        dimorphismScore: analysis.dimorphismScore,
        percentile: analysis.percentile,
        category: analysis.category,
        summary: analysis.summary,
        strengths: analysis.strengths,
        weakestDimension: analysis.weakestDimension,
        freeTip: analysis.freeTip,
        premiumHook: analysis.premiumHook,
        countryCode: country.countryCode,
        countryName: country.countryName,
        premiumUnlocked: false,
        persisted: false,
        persistenceError: 'Analysis completed, but it could not be saved. Check your Supabase connection.',
        createdAt: new Date().toISOString(),
      })
    }

    // Return free-tier response (no premium content)
    const response = {
      id: storedAnalysis.id,
      overallScore: analysis.overallScore,
      symmetryScore: analysis.symmetryScore,
      goldenRatioScore: analysis.goldenRatioScore,
      boneStructureScore: analysis.boneStructureScore,
      harmonyScore: analysis.harmonyScore,
      skinScore: analysis.skinScore,
      dimorphismScore: analysis.dimorphismScore,
      percentile: analysis.percentile,
      category: analysis.category,
      summary: analysis.summary,
      strengths: analysis.strengths,
      weakestDimension: analysis.weakestDimension,
      freeTip: analysis.freeTip,
      premiumHook: analysis.premiumHook,
      countryCode: country.countryCode,
      countryName: country.countryName,
      premiumUnlocked: false,
      persisted: true,
      createdAt: storedAnalysis.created_at
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Analysis endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
