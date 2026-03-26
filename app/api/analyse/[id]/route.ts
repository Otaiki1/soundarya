import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function toPublicAnalysis(analysis: Record<string, any>) {
  const unlockTier = Number(analysis.unlock_tier ?? 0);
  const premiumVisible = unlockTier >= 2 || analysis.premium_unlocked;
  const eliteVisible = unlockTier >= 3;

  return {
    id: analysis.id,
    overallScore: Number(analysis.overall_score),
    percentile: analysis.percentile,
    category: analysis.category,
    faceArchetype: analysis.face_archetype,
    confidenceScore: Number(analysis.confidence_score ?? 0),
    symmetryScore: analysis.symmetry_score,
    harmonyScore: analysis.harmony_score,
    proportionalityScore: analysis.proportionality_score,
    averagenessScore: analysis.averageness_score,
    boneStructureScore: analysis.bone_structure_score,
    skinScore: analysis.skin_score,
    dimorphismScore: analysis.dimorphism_score,
    neotenyScore: analysis.neoteny_score,
    adiposityScore: analysis.adiposity_score,
    executiveSummary: analysis.summary,
    strengths: analysis.strengths ?? [],
    weaknesses: premiumVisible ? analysis.weaknesses ?? [] : [],
    tradeoffs: premiumVisible ? analysis.tradeoffs ?? [] : [],
    weakestDimension: analysis.weakest_dimension,
    freeTip: analysis.free_tip,
    premiumTips: premiumVisible ? analysis.premium_tips ?? [] : [],
    citations: premiumVisible ? analysis.citations ?? [] : [],
    improvementPredictions: eliteVisible
      ? analysis.improvement_predictions ?? []
      : [],
    countryCode: analysis.country_code,
    countryName: analysis.country_name,
    premiumUnlocked: premiumVisible,
    unlockTier,
    createdAt: analysis.created_at,
    goldenRatioScore: analysis.proportionality_score,
    summary: analysis.summary,
    premiumHook:
      "Unlock the extended report to see weaknesses, citations, and practical next-step guidance.",
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: analysisId } = await params;
    if (!analysisId) {
      return NextResponse.json(
        { error: "Analysis ID is required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const sessionId = request.nextUrl.searchParams.get("sessionId");
    let query = supabaseAdmin.from("analyses").select("*").eq("id", analysisId);

    if (user) {
      query = query.or(
        `user_id.eq.${user.id},wallet_address.eq.${request.nextUrl.searchParams.get("walletAddress") ?? ""},session_id.eq.${sessionId ?? ""}`,
      );
    } else if (sessionId) {
      query = query.eq("session_id", sessionId);
    } else {
      return NextResponse.json(
        { error: "Session ID required for anonymous access" },
        { status: 401 },
      );
    }

    const { data, error } = await query.single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Analysis not found or access denied" },
        { status: 404 },
      );
    }

    return NextResponse.json(toPublicAnalysis(data));
  } catch (error) {
    console.error("Fetch analysis error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
