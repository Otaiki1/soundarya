import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { attestScanOnchain, persistRelayerTx } from "@/lib/relayer";
import { checkRateLimit, hashIP } from "@/lib/rate-limit";
import { analyseWithGemini } from "@/lib/gemini";
import {
  extractIPFromRequest,
  getCountryFromIP,
} from "@/lib/ip-geolocation";
import {
  imageToBase64,
  processImageForAnalysis,
  validateImage,
} from "@/lib/image-validation";
import { computeScanHash } from "@/lib/scans";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function toPublicAnalysis(
  analysisId: string,
  createdAt: string,
  countryCode: string | undefined,
  countryName: string | undefined,
  analysis: Awaited<ReturnType<typeof analyseWithGemini>>["result"],
  persisted: boolean,
  persistenceError?: string,
) {
  if (!analysis) {
    throw new Error("Analysis result missing");
  }

  return {
    id: analysisId,
    overallScore: analysis.overallScore,
    percentile: analysis.percentile,
    category: analysis.category,
    faceArchetype: analysis.faceArchetype,
    confidenceScore: analysis.confidenceScore,
    symmetryScore: analysis.symmetryScore,
    harmonyScore: analysis.harmonyScore,
    proportionalityScore: analysis.proportionalityScore,
    averagenessScore: analysis.averagenessScore,
    boneStructureScore: analysis.boneStructureScore,
    skinScore: analysis.skinScore,
    dimorphismScore: analysis.dimorphismScore,
    neotenyScore: analysis.neotenyScore,
    adiposityScore: analysis.adiposityScore,
    executiveSummary: analysis.executiveSummary,
    strengths: analysis.strengths,
    weaknesses: analysis.weaknesses ?? [],
    tradeoffs: analysis.tradeoffs ?? [],
    weakestDimension: analysis.weakestDimension,
    freeTip: analysis.freeTip,
    premiumTips: analysis.premiumTips ?? [],
    citations: analysis.citations ?? [],
    improvementPredictions: analysis.improvementPredictions ?? [],
    countryCode,
    countryName,
    premiumUnlocked: false,
    unlockTier: 0,
    persisted,
    persistenceError,
    createdAt,
    // Transitional aliases while the UI is upgraded.
    goldenRatioScore: analysis.proportionalityScore,
    summary: analysis.executiveSummary,
    premiumHook:
      "Unlock the extended report to see weaknesses, citations, and practical next-step guidance.",
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const photo = formData.get("photo") as File;
    const sessionId = formData.get("sessionId") as string;

    if (!photo || !sessionId) {
      return NextResponse.json(
        { error: "Missing required fields: photo and sessionId" },
        { status: 400 },
      );
    }

    const clientIP = extractIPFromRequest(request);
    if (!clientIP) {
      return NextResponse.json(
        { error: "Unable to determine client IP" },
        { status: 400 },
      );
    }

    const ipHash = await hashIP(clientIP);
    const rateLimitResult = await checkRateLimit(ipHash);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          retryAfter: rateLimitResult.retryAfter,
          remaining: rateLimitResult.remaining,
        },
        { status: 429 },
      );
    }

    const validation = await validateImage(photo);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const processedImage = await processImageForAnalysis(photo);
    const imageBase64 = imageToBase64(processedImage.buffer);
    const country = await getCountryFromIP(clientIP);

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const aiResult = await analyseWithGemini(imageBase64, "image/jpeg", "free");
    if (!aiResult.success || !aiResult.result) {
      return NextResponse.json(
        {
          error:
            "AI analysis failed: " + (aiResult.error?.error || "Unknown error"),
        },
        { status: 500 },
      );
    }

    const analysis = aiResult.result;
    const analysisId = randomUUID();
    const scanHash = computeScanHash(analysisId);
    const createdAt = new Date().toISOString();

    const insertPayload = {
      id: analysisId,
      user_id: user?.id ?? null,
      session_id: sessionId,
      ip_hash: ipHash,
      overall_score: analysis.overallScore,
      symmetry_score: analysis.symmetryScore,
      harmony_score: analysis.harmonyScore,
      proportionality_score: analysis.proportionalityScore,
      averageness_score: analysis.averagenessScore,
      bone_structure_score: analysis.boneStructureScore,
      skin_score: analysis.skinScore,
      dimorphism_score: analysis.dimorphismScore,
      neoteny_score: analysis.neotenyScore,
      adiposity_score: analysis.adiposityScore,
      percentile: analysis.percentile,
      category: analysis.category,
      face_archetype: analysis.faceArchetype,
      confidence_score: analysis.confidenceScore,
      summary: analysis.executiveSummary,
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses ?? [],
      tradeoffs: analysis.tradeoffs ?? [],
      weakest_dimension: analysis.weakestDimension,
      free_tip: analysis.freeTip,
      premium_tips: analysis.premiumTips ?? [],
      citations: analysis.citations ?? [],
      improvement_predictions: analysis.improvementPredictions ?? [],
      premium_unlocked: false,
      premium_tier: "free",
      unlock_tier: 0,
      country_code: country.countryCode,
      country_name: country.countryName,
      scan_hash: scanHash,
      photo_deleted_at: createdAt,
      created_at: createdAt,
    };

    const { error: dbError } = await supabaseAdmin
      .from("analyses")
      .insert(insertPayload);

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        toPublicAnalysis(
          analysisId,
          createdAt,
          country.countryCode,
          country.countryName,
          analysis,
          false,
          "Analysis completed, but it could not be saved. Check your Supabase connection.",
        ),
      );
    }

    void attestScanOnchain(analysisId).then((txHash) => {
      if (txHash) {
        void persistRelayerTx(analysisId, txHash);
      }
    });

    return NextResponse.json(
      toPublicAnalysis(
        analysisId,
        createdAt,
        country.countryCode,
        country.countryName,
        analysis,
        true,
      ),
    );
  } catch (error) {
    console.error("Analysis endpoint error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
