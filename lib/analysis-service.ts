import { randomUUID } from "crypto";
import { checkRateLimit, hashIP } from "@/lib/rate-limit";
import { analyseWithGemini } from "@/lib/gemini";
import {
  imageToBase64,
  processImageForAnalysis,
  validateImage,
} from "@/lib/image-validation";
import { computeScanHash } from "@/lib/scans";
import { attestScanOnchain, persistRelayerTx } from "@/lib/relayer";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { AnalysisPublic } from "@/types/analysis";
import type { AnalysisTier } from "@/types/ai";

interface CreateAnalysisParams {
  photo: File;
  sessionId: string;
  ipHash: string;
  countryCode?: string;
  countryName?: string;
  userId?: string | null;
  tier?: AnalysisTier;
  skipRateLimit?: boolean;
}

function toPublicAnalysis(
  analysisId: string,
  createdAt: string,
  countryCode: string | undefined,
  countryName: string | undefined,
  analysis: NonNullable<Awaited<ReturnType<typeof analyseWithGemini>>["result"]>,
  tier: AnalysisTier,
  persisted: boolean,
  persistenceError?: string,
): AnalysisPublic {
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
    weaknesses: tier === "free" ? [] : analysis.weaknesses ?? [],
    tradeoffs: tier === "elite" || tier === "premium" ? analysis.tradeoffs ?? [] : [],
    weakestDimension: analysis.weakestDimension,
    freeTip: analysis.freeTip,
    premiumTips: tier === "free" ? [] : analysis.premiumTips ?? [],
    citations: tier === "free" ? [] : analysis.citations ?? [],
    improvementPredictions: tier === "elite" ? analysis.improvementPredictions ?? [] : [],
    countryCode,
    countryName,
    premiumUnlocked: tier !== "free",
    unlockTier: tier === "elite" ? 3 : tier === "premium" ? 2 : 0,
    persisted,
    persistenceError,
    createdAt,
    goldenRatioScore: analysis.proportionalityScore,
    summary: analysis.executiveSummary,
    premiumHook:
      "Unlock the extended report to see weaknesses, citations, and practical next-step guidance.",
  };
}

export async function createStoredAnalysis({
  photo,
  sessionId,
  ipHash,
  countryCode,
  countryName,
  userId,
  tier = "free",
}: CreateAnalysisParams): Promise<AnalysisPublic> {
  const validation = await validateImage(photo);
  if (!validation.isValid) {
    throw new Error(validation.error || "Invalid image");
  }

  const processedImage = await processImageForAnalysis(photo);
  const imageBase64 = imageToBase64(processedImage.buffer);
  const aiResult = await analyseWithGemini(imageBase64, "image/jpeg", tier);

  if (!aiResult.success || !aiResult.result) {
    throw new Error(
      "AI analysis failed: " + (aiResult.error?.error || "Unknown error"),
    );
  }

  const analysis = aiResult.result;
  const analysisId = randomUUID();
  const createdAt = new Date().toISOString();
  const scanHash = computeScanHash(analysisId);

  const insertPayload = {
    id: analysisId,
    user_id: userId ?? null,
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
    premium_unlocked: tier !== "free",
    premium_tier: tier === "elite" ? "elite" : tier === "premium" ? "premium" : "free",
    unlock_tier: tier === "elite" ? 3 : tier === "premium" ? 2 : 0,
    country_code: countryCode,
    country_name: countryName,
    scan_hash: scanHash,
    photo_deleted_at: createdAt,
    created_at: createdAt,
  };

  const { error } = await supabaseAdmin.from("analyses").insert(insertPayload);
  if (error) {
    console.error("Database error:", error);
    return toPublicAnalysis(
      analysisId,
      createdAt,
      countryCode,
      countryName,
      analysis,
      tier,
      false,
      "Analysis completed, but it could not be saved. Check your Supabase connection.",
    );
  }

  void attestScanOnchain(analysisId).then((txHash) => {
    if (txHash) {
      void persistRelayerTx(analysisId, txHash);
    }
  });

  return toPublicAnalysis(
    analysisId,
    createdAt,
    countryCode,
    countryName,
    analysis,
    tier,
    true,
  );
}

export async function ensureRateLimit(ipHash: string) {
  const rateLimitResult = await checkRateLimit(ipHash);
  if (!rateLimitResult.allowed) {
    return rateLimitResult;
  }
  return null;
}

export async function deriveIpHash(clientIP: string) {
  return hashIP(clientIP);
}
