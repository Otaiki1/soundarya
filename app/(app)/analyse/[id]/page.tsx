import { supabaseAdmin } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { ScoreHero } from '@/components/results/ScoreHero'
import { DimensionBars } from '@/components/results/DimensionBars'
import { ShareRow } from '@/components/results/ShareRow'

interface PageParams {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageParams) {
  const { id } = await params
  const { data } = await supabaseAdmin
    .from('analyses')
    .select('overall_score, percentile')
    .eq('id', id)
    .single()

  if (!data) return { title: 'Analysis Not Found' }

  return {
    title: `Your Soundarya Score: ${data.overall_score}/10`,
    description: `Top ${data.percentile}% of analyzed faces`,
    openGraph: {
      images: [`/api/scorecard/${id}`],
    },
  }
}

export default async function AnalysePage({ params }: PageParams) {
  const { id } = await params

  // Fetch analysis from database
  const { data: analysis, error } = await supabaseAdmin
    .from('analyses')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !analysis) {
    notFound()
  }

  // Convert snake_case DB fields to camelCase for client
  const clientAnalysis = {
    id: analysis.id,
    overallScore: analysis.overall_score,
    symmetryScore: analysis.symmetry_score,
    harmonyScore: analysis.harmony_score,
    proportionalityScore: analysis.proportionality_score,
    averagenessScore: analysis.averageness_score,
    boneStructureScore: analysis.bone_structure_score,
    skinScore: analysis.skin_score,
    dimorphismScore: analysis.dimorphism_score,
    neotenyScore: analysis.neoteny_score,
    adiposityScore: analysis.adiposity_score,
    percentile: analysis.percentile,
    category: analysis.category,
    faceArchetype: analysis.face_archetype,
    confidenceScore: analysis.confidence_score,
    executiveSummary: analysis.summary,
    summary: analysis.summary,
    strengths: analysis.strengths || [],
    weaknesses: analysis.weaknesses || [],
    tradeoffs: analysis.tradeoffs || [],
    weakestDimension: analysis.weakest_dimension,
    freeTip: analysis.free_tip,
    premiumTips: analysis.premium_tips || [],
    citations: analysis.citations || [],
    improvementPredictions: analysis.improvement_predictions || [],
    premiumHook: "Unlock the extended report to see weaknesses, citations, and practical next-step guidance.",
    countryCode: analysis.country_code,
    countryName: analysis.country_name,
    premiumUnlocked: analysis.premium_unlocked || false,
    unlockTier: analysis.unlock_tier || 0,
    goldenRatioScore: analysis.proportionality_score,
    createdAt: analysis.created_at
  }

  return (
    <div className="page-shell">
      <div className="section-shell max-w-5xl">
        <div className="space-y-8 sm:space-y-10">
          <ScoreHero analysis={clientAnalysis} />
          <DimensionBars analysis={clientAnalysis} />
          <ShareRow analysis={clientAnalysis} />
        </div>
      </div>
    </div>
  )
}
