import { getPromptForTier, type CalibrationMode } from "./prompts";
import {
  personalizeImprovementPredictions,
  personalizeReportList,
  personalizeReportText,
} from "./report-copy";
import type {
  AIAnalysisResult,
  AnalysisTier,
  FaceArchetype,
  ImprovementPrediction,
  ScoreCategory,
} from "@/types/ai";

export interface GeminiAPIError {
  error: string;
  code?: string;
  status?: number;
}

export interface GeminiAPIResponse {
  success: boolean;
  result?: AIAnalysisResult;
  error?: GeminiAPIError;
}

function isRetryableGeminiStatus(status: number): boolean {
  return status === 401 || status === 403 || status === 429 || status >= 500;
}

const DEFAULT_GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getGeminiApiKeys(): string[] {
  const multiKeyValue = process.env.GEMINI_API_KEYS ?? "";
  const parsedMultiKeys = multiKeyValue
    .split(/[\n,]/)
    .map((value) => value.trim())
    .filter(Boolean);

  const singleKey = process.env.GEMINI_API_KEY?.trim();

  return Array.from(
    new Set([
      ...parsedMultiKeys,
      ...(singleKey ? [singleKey] : []),
    ]),
  );
}

export function getGeminiModels(): string[] {
  const explicitModels = (process.env.GEMINI_ANALYSIS_MODELS ?? "")
    .split(/[\n,]/)
    .map((value) => value.trim())
    .filter(Boolean);
  const primaryModel = process.env.GEMINI_ANALYSIS_MODEL?.trim();

  return Array.from(
    new Set([
      ...explicitModels,
      ...(primaryModel ? [primaryModel] : []),
      ...DEFAULT_GEMINI_MODELS,
    ]),
  );
}

export async function generateGeminiContent(
  body: Record<string, unknown>,
  model?: string,
): Promise<Response> {
  const apiKeys = getGeminiApiKeys();
  const models = model ? [model] : getGeminiModels();

  if (apiKeys.length === 0) {
    throw new Error("No Gemini API keys are configured");
  }

  const requestBody = JSON.stringify(body);
  let lastResponse: Response | null = null;
  let lastError: unknown = null;

  for (const [modelIndex, candidateModel] of models.entries()) {
    for (const [keyIndex, apiKey] of apiKeys.entries()) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${candidateModel}:generateContent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey,
            },
            body: requestBody,
          },
        );

        if (response.ok) {
          return response;
        }

        lastResponse = response;

        const hasNextKey = keyIndex < apiKeys.length - 1;
        const hasNextModel = modelIndex < models.length - 1;
        if (response.status === 404 && hasNextModel) {
          console.warn(
            `Gemini model ${candidateModel} returned 404. Skipping to fallback model ${modelIndex + 2}/${models.length}.`,
          );
          break;
        }

        if (!isRetryableGeminiStatus(response.status) || (!hasNextKey && !hasNextModel)) {
          return response;
        }

        const nextHint = hasNextKey
          ? `backup API key ${keyIndex + 2}/${apiKeys.length}`
          : `fallback model ${modelIndex + 2}/${models.length}`;
        console.warn(
          `Gemini request failed with status ${response.status} on model ${candidateModel}. Retrying with ${nextHint}.`,
        );

        if (response.status >= 500 || response.status === 429) {
          await sleep(300);
        }
      } catch (error) {
        lastError = error;
        const hasNextKey = keyIndex < apiKeys.length - 1;
        const hasNextModel = modelIndex < models.length - 1;

        if (!hasNextKey && !hasNextModel) {
          throw error;
        }

        const nextHint = hasNextKey
          ? `backup API key ${keyIndex + 2}/${apiKeys.length}`
          : `fallback model ${modelIndex + 2}/${models.length}`;
        console.warn(
          `Gemini request threw before completion on model ${candidateModel}. Retrying with ${nextHint}.`,
          error,
        );
        await sleep(300);
      }
    }
  }

  if (lastResponse) {
    return lastResponse;
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Gemini request failed before receiving a response");
}

export function isGeminiServiceUnavailableError(
  error: GeminiAPIError | undefined,
): boolean {
  if (!error) return false;

  if (typeof error.status === "number") {
    return error.status === 401 || error.status === 403 || error.status === 429 || error.status >= 500;
  }

  if (error.code === "NETWORK_ERROR") {
    return true;
  }

  const normalizedMessage = error.error.toLowerCase();
  return (
    normalizedMessage.includes("no gemini api keys") ||
    normalizedMessage.includes("network error") ||
    normalizedMessage.includes("fetch failed") ||
    normalizedMessage.includes("gemini api error")
  );
}

const SCORE_CATEGORIES: ScoreCategory[] = [
  "Exceptional",
  "Very Attractive",
  "Above Average",
  "Average",
  "Below Average",
];

const FACE_ARCHETYPES: FaceArchetype[] = [
  "Sharp",
  "Balanced",
  "Soft",
  "Angular",
  "Rounded",
  "Defined",
];

const FACE_ARCHETYPE_ALIASES: Record<string, FaceArchetype> = {
  sharp: "Sharp",
  angular: "Angular",
  balanced: "Balanced",
  soft: "Soft",
  rounded: "Rounded",
  defined: "Defined",
  "sharp angular": "Sharp",
  "sharp-angular": "Sharp",
  "soft balanced": "Balanced",
  "soft-balanced": "Balanced",
  "strong structured": "Defined",
  "strong-structured": "Defined",
  "delicate refined": "Soft",
  "delicate-refined": "Soft",
  "harmonious even": "Balanced",
  "harmonious-even": "Balanced",
};

const WEAKEST_DIMENSIONS = [
  "Symmetry",
  "Harmony",
  "Proportionality",
  "Averageness",
  "Bone Structure",
  "Skin Quality",
  "Dimorphism",
  "Neoteny",
  "Adiposity",
];

const DIMENSION_ALIASES: Record<string, string> = {
  symmetry: "Symmetry",
  harmony: "Harmony",
  proportionality: "Proportionality",
  proportion: "Proportionality",
  proportions: "Proportionality",
  "golden ratio": "Proportionality",
  goldenratio: "Proportionality",
  ratio: "Proportionality",
  averageness: "Averageness",
  average: "Averageness",
  "bone structure": "Bone Structure",
  bonestructure: "Bone Structure",
  structure: "Bone Structure",
  "skin quality": "Skin Quality",
  skinquality: "Skin Quality",
  skin: "Skin Quality",
  dimorphism: "Dimorphism",
  "sexual dimorphism": "Dimorphism",
  neoteny: "Neoteny",
  adiposity: "Adiposity",
  facialadiposity: "Adiposity",
  "facial adiposity": "Adiposity",
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10;
}

// Only unambiguously photography-specific phrases to avoid false positives.
// Single words like "light", "angle", "pose", "edit", "background" are
// legitimate in appearance advice ("highlight", "jaw angle", "posture", etc.)
const PHOTO_ADVICE_PATTERNS = [
  "selfie",
  "camera",
  "retouch",
  "photoshop",
  "take a photo",
  "take a picture",
  "better photo",
  "better picture",
  "better lighting",
  "good lighting",
  "different lighting",
  "improve lighting",
  "photo quality",
  "picture quality",
  "image quality",
  "photo filter",
  "upload a photo",
  "photograph yourself",
];

function deriveCategory(overallScore: number): ScoreCategory {
  if (overallScore >= 9) return "Exceptional";
  if (overallScore >= 8) return "Very Attractive";
  if (overallScore >= 7) return "Above Average";
  if (overallScore >= 5.5) return "Average";
  return "Below Average";
}

function normalizeFaceArchetype(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  const normalized = trimmed.toLowerCase().replace(/[_-]+/g, " ");
  return FACE_ARCHETYPE_ALIASES[normalized] ?? trimmed;
}

function getDimensionScores(result: AIAnalysisResult): number[] {
  return [
    result.symmetryScore,
    result.harmonyScore,
    result.proportionalityScore,
    result.averagenessScore,
    result.boneStructureScore,
    result.skinScore,
    result.dimorphismScore,
    result.neotenyScore,
    result.adiposityScore,
  ];
}

function getCalibrationIssues(result: AIAnalysisResult): string[] {
  const issues: string[] = [];
  const dimensionScores = getDimensionScores(result);
  const avgDimensionScore =
    dimensionScores.reduce((sum, score) => sum + score, 0) / dimensionScores.length;
  const exceptionalDimensions = dimensionScores.filter((score) => score >= 80).length;
  const eliteDimensions = dimensionScores.filter((score) => score >= 85).length;
  const clusteredSpread = Math.max(...dimensionScores) - Math.min(...dimensionScores);
  const allHighDimensions = dimensionScores.every((score) => score > 75);

  if (result.overallScore >= 8 && avgDimensionScore < 70) {
    issues.push("overall score is high relative to average dimension score");
  }

  if (result.overallScore >= 7.5 && exceptionalDimensions === 0) {
    issues.push("overall score is high without any exceptional dimensions");
  }

  if (result.overallScore >= 8.5 && exceptionalDimensions < 3) {
    issues.push("overall score above 8.5 requires multiple exceptional dimensions");
  }

  if (allHighDimensions && result.overallScore < 8.5) {
    issues.push("all dimensions are unusually high for the reported overall score");
  }

  if (result.overallScore >= 9 && eliteDimensions < 4) {
    issues.push("overall score above 9.0 requires several elite dimensions");
  }

  if (result.confidenceScore < 0.35 && result.overallScore > 7.5) {
    issues.push("low confidence image should not produce a very high score");
  }

  if (result.overallScore >= 8 && result.percentile < 80) {
    issues.push("percentile is too low for a top-tier overall score");
  }

  if (result.overallScore < 5.5 && result.percentile > 55) {
    issues.push("percentile is too high for a below-average overall score");
  }

  if (result.overallScore >= 7.5 && clusteredSpread <= 6) {
    issues.push("dimension scores are too tightly clustered for a strong result");
  }

  if (
    Array.isArray(result.improvementPredictions) &&
    result.improvementPredictions.some((prediction) => prediction.deltaScore > 1)
  ) {
    issues.push("improvement predictions contain unrealistic score deltas");
  }

  return issues;
}

function containsPhotographyAdvice(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return PHOTO_ADVICE_PATTERNS.some((pattern) => normalized.includes(pattern));
}

function getAnalysisSchema(tier: AnalysisTier) {
  const properties = {
    overallScore: { type: "number" },
    percentile: { type: "integer" },
    category: { type: "string", enum: SCORE_CATEGORIES },
    faceArchetype: { type: "string", enum: FACE_ARCHETYPES },
    confidenceScore: { type: "number" },
    symmetryScore: { type: "integer" },
    harmonyScore: { type: "integer" },
    proportionalityScore: { type: "integer" },
    averagenessScore: { type: "integer" },
    boneStructureScore: { type: "integer" },
    skinScore: { type: "integer" },
    dimorphismScore: { type: "integer" },
    neotenyScore: { type: "integer" },
    adiposityScore: { type: "integer" },
    executiveSummary: { type: "string" },
    strengths: { type: "array", items: { type: "string" } },
    weakestDimension: { type: "string" },
    freeTip: { type: "string" },
    ...(tier !== "free"
      ? {
          weaknesses: { type: "array", items: { type: "string" } },
          tradeoffs: { type: "array", items: { type: "string" } },
          premiumTips: { type: "array", items: { type: "string" } },
          citations: { type: "array", items: { type: "string" } },
        }
      : {}),
    ...(tier === "elite"
      ? {
          improvementPredictions: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: [
                "change",
                "deltaScore",
                "affectedDimensions",
                "timeframe",
                "difficulty",
              ],
              properties: {
                change: { type: "string" },
                deltaScore: { type: "number" },
                affectedDimensions: {
                  type: "array",
                  items: { type: "string" },
                },
                timeframe: { type: "string" },
                difficulty: {
                  type: "string",
                  enum: ["easy", "medium", "hard"],
                },
              },
            },
          },
        }
      : {}),
  };

  return {
    type: "object",
    additionalProperties: false,
    required: Object.keys(properties),
    properties,
  } as const;
}

function extractOutputText(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;

  const candidates = (payload as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates)) return null;

  for (const candidate of candidates) {
    const parts = (candidate as { content?: { parts?: unknown } }).content?.parts;
    if (!Array.isArray(parts)) continue;

    const chunks: string[] = [];
    for (const part of parts) {
      const text = (part as { text?: unknown }).text;
      if (typeof text === "string" && text.length > 0) {
        chunks.push(text);
      }
    }
    const joined = chunks.join("").trim();
    if (joined) {
      return joined;
    }
  }

  return null;
}

function getGeminiFinishReason(payload: unknown): string | undefined {
  const candidates = (payload as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return undefined;
  const reason = (candidates[0] as { finishReason?: unknown }).finishReason;
  return typeof reason === "string" ? reason : undefined;
}

function extractJsonCandidate(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch?.[1]) {
    return fenceMatch[1].trim();
  }

  const firstObject = trimmed.indexOf("{");
  const lastObject = trimmed.lastIndexOf("}");
  if (firstObject !== -1 && lastObject !== -1 && lastObject > firstObject) {
    return trimmed.slice(firstObject, lastObject + 1);
  }

  const firstArray = trimmed.indexOf("[");
  const lastArray = trimmed.lastIndexOf("]");
  if (firstArray !== -1 && lastArray !== -1 && lastArray > firstArray) {
    return trimmed.slice(firstArray, lastArray + 1);
  }

  return trimmed;
}

function tryParseJson(text: string): AIAnalysisResult | null {
  const candidates = [
    text,
    extractJsonCandidate(text),
  ].filter((candidate): candidate is string => Boolean(candidate));

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as AIAnalysisResult;
    } catch {
      // Continue to the next candidate.
    }
  }

  return null;
}

function validateIntegerScore(score: number): boolean {
  return Number.isInteger(score) && score >= 1 && score <= 100;
}

function normalizeDimensionLabel(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

  const compact = normalized.replace(/\s+/g, "");
  const direct =
    DIMENSION_ALIASES[normalized] ??
    DIMENSION_ALIASES[compact];

  if (direct) return direct;

  for (const [alias, canonical] of Object.entries(DIMENSION_ALIASES)) {
    if (normalized.includes(alias) || compact.includes(alias.replace(/\s+/g, ""))) {
      return canonical;
    }
  }

  return value;
}

function sanitizeStringArray(value: unknown, maxItems?: number): string[] {
  if (!Array.isArray(value)) return [];

  const cleaned = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  return typeof maxItems === "number" ? cleaned.slice(0, maxItems) : cleaned;
}

function inferWeakestDimension(parsed: AIAnalysisResult): string {
  const dimensions = [
    { label: "Symmetry", score: parsed.symmetryScore },
    { label: "Harmony", score: parsed.harmonyScore },
    { label: "Proportionality", score: parsed.proportionalityScore },
    { label: "Averageness", score: parsed.averagenessScore },
    { label: "Bone Structure", score: parsed.boneStructureScore },
    { label: "Skin Quality", score: parsed.skinScore },
    { label: "Dimorphism", score: parsed.dimorphismScore },
    { label: "Neoteny", score: parsed.neotenyScore },
    { label: "Adiposity", score: parsed.adiposityScore },
  ];

  return dimensions.reduce((lowest, current) =>
    current.score < lowest.score ? current : lowest,
  ).label;
}

function normalizeAnalysisResult(parsed: AIAnalysisResult): AIAnalysisResult {
  const normalizedWeakest =
    typeof parsed.weakestDimension === "string"
      ? normalizeDimensionLabel(parsed.weakestDimension)
      : parsed.weakestDimension;

  return {
    ...parsed,
    overallScore:
      typeof parsed.overallScore === "number"
        ? roundToTenth(clamp(parsed.overallScore, 1, 10))
        : parsed.overallScore,
    percentile:
      typeof parsed.percentile === "number"
        ? clamp(Math.round(parsed.percentile), 1, 99)
        : parsed.percentile,
    category:
      typeof parsed.overallScore === "number"
        ? deriveCategory(parsed.overallScore)
        : parsed.category,
    faceArchetype: normalizeFaceArchetype(parsed.faceArchetype) as FaceArchetype,
    confidenceScore:
      typeof parsed.confidenceScore === "number"
        ? clamp(parsed.confidenceScore, 0, 1)
        : parsed.confidenceScore,
    executiveSummary:
      typeof parsed.executiveSummary === "string"
        ? personalizeReportText(parsed.executiveSummary.trim())
        : parsed.executiveSummary,
    strengths: personalizeReportList(sanitizeStringArray(parsed.strengths, 7)),
    weaknesses: personalizeReportList(sanitizeStringArray(parsed.weaknesses, 5)),
    tradeoffs: personalizeReportList(sanitizeStringArray(parsed.tradeoffs, 8)),
    premiumTips: personalizeReportList(sanitizeStringArray(parsed.premiumTips, 20)),
    citations: sanitizeStringArray(parsed.citations, 20),
    weakestDimension:
      typeof normalizedWeakest === "string" &&
      WEAKEST_DIMENSIONS.includes(normalizedWeakest)
        ? normalizedWeakest
        : inferWeakestDimension(parsed),
    freeTip:
      typeof parsed.freeTip === "string"
        ? personalizeReportText(parsed.freeTip.trim())
        : parsed.freeTip,
    improvementPredictions: Array.isArray(parsed.improvementPredictions)
      ? personalizeImprovementPredictions(
          parsed.improvementPredictions.slice(0, 6).map((prediction) => ({
            change:
              typeof prediction.change === "string"
                ? prediction.change.trim()
                : prediction.change,
            deltaScore:
              typeof prediction.deltaScore === "number"
                ? roundToTenth(prediction.deltaScore)
                : prediction.deltaScore,
            affectedDimensions: Array.isArray(prediction.affectedDimensions)
              ? prediction.affectedDimensions
                  .map((dimension) =>
                    typeof dimension === "string"
                      ? normalizeDimensionLabel(dimension)
                      : dimension,
                  )
                  .filter((dimension): dimension is string => typeof dimension === "string")
              : prediction.affectedDimensions,
            timeframe:
              typeof prediction.timeframe === "string"
                ? prediction.timeframe.trim()
                : prediction.timeframe,
            difficulty: prediction.difficulty,
          })),
        )
      : parsed.improvementPredictions,
  };
}

function validateImprovementPredictions(
  predictions: ImprovementPrediction[] | undefined,
) {
  if (!predictions) return true;

  return predictions.every((prediction) => {
    return (
      typeof prediction.change === "string" &&
      prediction.change.trim().length > 0 &&
      typeof prediction.deltaScore === "number" &&
      prediction.deltaScore > 0 &&
      prediction.deltaScore <= 1 &&
      Array.isArray(prediction.affectedDimensions) &&
      prediction.affectedDimensions.length > 0 &&
      prediction.affectedDimensions.every((dimension) =>
        WEAKEST_DIMENSIONS.includes(normalizeDimensionLabel(dimension)),
      ) &&
      typeof prediction.timeframe === "string" &&
      prediction.timeframe.trim().length > 0 &&
      ["easy", "medium", "hard"].includes(prediction.difficulty) &&
      !(prediction.deltaScore >= 0.8 && prediction.difficulty === "easy")
    );
  });
}

function validateAnalysisResult(
  parsed: AIAnalysisResult,
  tier: AnalysisTier,
): GeminiAPIResponse {
  const normalized = normalizeAnalysisResult(parsed);

  const requiredFields = [
    "overallScore",
    "percentile",
    "category",
    "faceArchetype",
    "confidenceScore",
    "symmetryScore",
    "harmonyScore",
    "proportionalityScore",
    "averagenessScore",
    "boneStructureScore",
    "skinScore",
    "dimorphismScore",
    "neotenyScore",
    "adiposityScore",
    "executiveSummary",
    "strengths",
    "weakestDimension",
    "freeTip",
  ] as const;

  const missingFields = requiredFields.filter((field) => !(field in normalized));
  if (missingFields.length > 0) {
    return {
      success: false,
      error: {
        error: `Missing required fields: ${missingFields.join(", ")}`,
      },
    };
  }

  if (normalized.overallScore < 1 || normalized.overallScore > 10) {
    return {
      success: false,
      error: { error: "overallScore must be between 1.0 and 10.0" },
    };
  }

  if (normalized.percentile < 1 || normalized.percentile > 99) {
    return {
      success: false,
      error: { error: "percentile must be an integer between 1 and 99" },
    };
  }

  if (!SCORE_CATEGORIES.includes(normalized.category)) {
    return {
      success: false,
      error: { error: "Invalid category returned by Gemini" },
    };
  }

  if (!FACE_ARCHETYPES.includes(normalized.faceArchetype)) {
    return {
      success: false,
      error: { error: "Invalid faceArchetype returned by Gemini" },
    };
  }

  if (normalized.confidenceScore < 0 || normalized.confidenceScore > 1) {
    return {
      success: false,
      error: { error: "confidenceScore must be between 0 and 1" },
    };
  }

  const dimensionScores = getDimensionScores(normalized);

  if (!dimensionScores.every(validateIntegerScore)) {
    return {
      success: false,
      error: {
        error: "All dimension scores must be integers between 1 and 100",
      },
    };
  }

  if (!WEAKEST_DIMENSIONS.includes(normalized.weakestDimension)) {
    return {
      success: false,
      error: {
        error: `weakestDimension must be one of: ${WEAKEST_DIMENSIONS.join(", ")}`,
      },
    };
  }

  const normalizedStrengths =
    tier === "free"
      ? normalized.strengths.slice(0, 3)
      : normalized.strengths.slice(0, 7);
  const normalizedWeaknesses = normalized.weaknesses ?? [];
  const normalizedTradeoffs = normalized.tradeoffs ?? [];
  const normalizedPremiumTips = normalized.premiumTips ?? [];
  const normalizedCitations = normalized.citations ?? [];
  const normalizedImprovementPredictions =
    normalized.improvementPredictions ?? [];

  if (normalizedStrengths.length === 0) {
    return {
      success: false,
      error: { error: "At least one strength is required" },
    };
  }

  if (
    typeof normalized.executiveSummary !== "string" ||
    normalized.executiveSummary.length === 0
  ) {
    return {
      success: false,
      error: { error: "executiveSummary is required" },
    };
  }

  if (typeof normalized.freeTip !== "string" || normalized.freeTip.length === 0) {
    return {
      success: false,
      error: { error: "freeTip is required" },
    };
  }

  if (containsPhotographyAdvice(normalized.freeTip)) {
    return {
      success: false,
      error: {
        error: "freeTip must focus on improving appearance, not photo quality",
      },
    };
  }

  if (tier === "free") {
    if (normalizedStrengths.length < 3) {
      return {
        success: false,
        error: { error: "Free tier requires exactly 3 strengths" },
      };
    }

    return {
      success: true,
      result: {
        ...normalized,
        strengths: normalizedStrengths,
        weaknesses: [],
        tradeoffs: [],
        premiumTips: [],
        citations: [],
        improvementPredictions: [],
      },
    };
  }

  if (normalizedWeaknesses.length < 2) {
    return {
      success: false,
      error: { error: "Premium and elite tiers require at least 2 weaknesses" },
    };
  }

  if (normalizedTradeoffs.length < 2) {
    return {
      success: false,
      error: { error: "Premium and elite tiers require at least 2 tradeoffs" },
    };
  }

  if (normalizedPremiumTips.length < 8) {
    return {
      success: false,
      error: { error: "Premium and elite tiers require at least 8 premium tips" },
    };
  }

  if (normalizedPremiumTips.some(containsPhotographyAdvice)) {
    return {
      success: false,
      error: {
        error: "premiumTips must focus on appearance improvements, not photo quality",
      },
    };
  }

  if (normalizedCitations.length < 2) {
    return {
      success: false,
      error: { error: "Premium and elite tiers require at least 2 citations" },
    };
  }

  if (tier === "elite") {
    if (
      normalizedImprovementPredictions.length < 3 ||
      !validateImprovementPredictions(normalizedImprovementPredictions)
    ) {
      return {
        success: false,
        error: {
          error: "Elite tier requires at least 3 valid improvement predictions",
        },
      };
    }
  }

  return {
    success: true,
    result: {
      ...normalized,
      strengths: normalizedStrengths,
      weaknesses: normalizedWeaknesses,
      tradeoffs: normalizedTradeoffs,
      premiumTips: normalizedPremiumTips,
      citations: normalizedCitations,
      improvementPredictions: normalizedImprovementPredictions,
    },
  };
}

function stripDataUrlPrefix(imageBase64: string): string {
  const commaIndex = imageBase64.indexOf(",");
  return commaIndex >= 0 ? imageBase64.slice(commaIndex + 1) : imageBase64;
}

/** Room for long strings (summaries, strengths, tips) without mid-JSON truncation. */
function maxAnalysisOutputTokens(tier: AnalysisTier): number {
  return tier === "elite" ? 12288 : 8192;
}

async function runGeminiAnalysisAttempt(
  imageBase64: string,
  mimeType: string,
  tier: AnalysisTier,
  calibrationMode: CalibrationMode,
  outputRetry = false,
): Promise<GeminiAPIResponse> {
  const prompt = getPromptForTier(tier, calibrationMode);
  const baseCap = maxAnalysisOutputTokens(tier);
  const maxOutputTokens = outputRetry ? Math.min(16384, baseCap * 2) : baseCap;

  const response = await generateGeminiContent(
    {
      systemInstruction: {
        parts: [{ text: prompt.systemPrompt }],
      },
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt.userPrompt },
            {
              inlineData: {
                mimeType,
                data: stripDataUrlPrefix(imageBase64),
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseJsonSchema: getAnalysisSchema(tier),
        temperature: calibrationMode === "strictRetry" ? 0.1 : 0.2,
        maxOutputTokens,
      },
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const providerMessage =
      typeof errorData?.error?.message === "string"
        ? errorData.error.message
        : undefined;
    return {
      success: false,
      error: {
        error: providerMessage
          ? `Gemini API error: ${response.status} ${response.statusText} - ${providerMessage}`
          : `Gemini API error: ${response.status} ${response.statusText}`,
        status: response.status,
        code:
          typeof errorData?.error?.status === "string"
            ? errorData.error.status
            : undefined,
      },
    };
  }

  const data = await response.json();
  const outputText = extractOutputText(data);

  if (!outputText) {
    return {
      success: false,
      error: {
        error: "Invalid response from Gemini: missing structured output",
      },
    };
  }

  const parsed = tryParseJson(outputText);

  if (!parsed) {
    const finishReason = getGeminiFinishReason(data);
    console.error(
      "Gemini JSON parse failure. finishReason:",
      finishReason ?? "(none)",
      "maxOutputTokens:",
      maxOutputTokens,
      "raw prefix:",
      outputText.slice(0, 800),
    );
    if (!outputRetry && finishReason === "MAX_TOKENS") {
      console.warn("Gemini hit MAX_TOKENS; retrying once with a higher output cap.");
      return runGeminiAnalysisAttempt(
        imageBase64,
        mimeType,
        tier,
        calibrationMode,
        true,
      );
    }
    return {
      success: false,
      error: { error: "Failed to parse Gemini response as JSON" },
    };
  }

  return validateAnalysisResult(parsed, tier);
}

export async function analyseWithGemini(
  imageBase64: string,
  mimeType: string,
  tier: AnalysisTier,
): Promise<GeminiAPIResponse> {
  try {
    if (getGeminiApiKeys().length === 0) {
      return {
        success: false,
        error: { error: "No Gemini API keys are configured", status: 503 },
      };
    }

    const firstAttempt = await runGeminiAnalysisAttempt(
      imageBase64,
      mimeType,
      tier,
      "default",
    );

    if (!firstAttempt.success || !firstAttempt.result) {
      return firstAttempt;
    }

    const firstAttemptIssues = getCalibrationIssues(firstAttempt.result);
    if (firstAttemptIssues.length === 0) {
      return firstAttempt;
    }

    console.warn(
      "Gemini analysis flagged for calibration retry:",
      firstAttemptIssues.join("; "),
    );

    const secondAttempt = await runGeminiAnalysisAttempt(
      imageBase64,
      mimeType,
      tier,
      "strictRetry",
    );

    if (!secondAttempt.success || !secondAttempt.result) {
      console.warn(
        "Gemini retry failed, returning first attempt despite calibration issues.",
      );
      return firstAttempt;
    }

    const secondAttemptIssues = getCalibrationIssues(secondAttempt.result);
    if (secondAttemptIssues.length > 0) {
      console.warn(
        "Gemini analysis still appears inflated after strict retry:",
        secondAttemptIssues.join("; "),
      );
    }

    return secondAttempt;
  } catch (error) {
    console.error("Gemini API call error:", error);
    return {
      success: false,
      error: {
        error:
          error instanceof Error
            ? error.message
            : "Unknown error calling Gemini API",
        code: error instanceof Error ? "NETWORK_ERROR" : undefined,
        status: 503,
      },
    };
  }
}

export async function testGeminiAPI(): Promise<{
  available: boolean;
  error?: string;
}> {
  try {
    if (getGeminiApiKeys().length === 0) {
      return { available: false, error: "No Gemini API keys are configured" };
    }

    const response = await generateGeminiContent(
      {
        contents: [
          {
            role: "user",
            parts: [{ text: "Reply with the single word online." }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 10,
        },
      },
    );

    if (response.ok) {
      return { available: true };
    }

    return {
      available: false,
      error: `API returned ${response.status}: ${response.statusText}`,
    };
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}
