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
    goldenRatioScore: analysis.golden_ratio_score,
    boneStructureScore: analysis.bone_structure_score,
    harmonyScore: analysis.harmony_score,
    skinScore: analysis.skin_score,
    dimorphismScore: analysis.dimorphism_score,
    percentile: analysis.percentile,
    category: analysis.category,
    summary: analysis.summary,
    strengths: analysis.strengths,
    weakestDimension: analysis.weakest_dimension,
    freeTip: analysis.free_tip,
    premiumHook: analysis.premium_hook,
    countryCode: analysis.country_code,
    premiumUnlocked: analysis.premium_unlocked || false,
    createdAt: analysis.created_at
  }

  return (
    <div className="page-shell pt-32 sm:pt-40 pb-20">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          <div className="reveal">
            <ScoreHero analysis={clientAnalysis} />
            <div className="mt-12 hidden lg:block">
              <ShareRow analysisId={clientAnalysis.id} />
            </div>
          </div>
          
          <div className="reveal space-y-16">
            <DimensionBars analysis={clientAnalysis} />
            <div className="lg:hidden">
              <ShareRow analysisId={clientAnalysis.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}