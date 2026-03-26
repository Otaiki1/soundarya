import { getPromptForTier } from "./prompts";
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
}

export interface GeminiAPIResponse {
  success: boolean;
  result?: AIAnalysisResult;
  error?: GeminiAPIError;
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

    for (const part of parts) {
      const text = (part as { text?: unknown }).text;
      if (typeof text === "string" && text.trim()) {
        return text;
      }
    }
  }

  return null;
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
    weakestDimension:
      typeof normalizedWeakest === "string" &&
      WEAKEST_DIMENSIONS.includes(normalizedWeakest)
        ? normalizedWeakest
        : inferWeakestDimension(parsed),
    improvementPredictions: Array.isArray(parsed.improvementPredictions)
      ? parsed.improvementPredictions.map((prediction) => ({
          ...prediction,
          affectedDimensions: Array.isArray(prediction.affectedDimensions)
            ? prediction.affectedDimensions.map((dimension) =>
                typeof dimension === "string"
                  ? normalizeDimensionLabel(dimension)
                  : dimension,
              )
            : prediction.affectedDimensions,
        }))
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
      typeof prediction.deltaScore === "number" &&
      Array.isArray(prediction.affectedDimensions) &&
      typeof prediction.timeframe === "string" &&
      ["easy", "medium", "hard"].includes(prediction.difficulty)
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

  const dimensionScores = [
    normalized.symmetryScore,
    normalized.harmonyScore,
    normalized.proportionalityScore,
    normalized.averagenessScore,
    normalized.boneStructureScore,
    normalized.skinScore,
    normalized.dimorphismScore,
    normalized.neotenyScore,
    normalized.adiposityScore,
  ];

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

  const strengthCount = normalized.strengths.length;
  if (
    !Array.isArray(normalized.strengths) ||
    strengthCount < 3 ||
    (tier === "free" ? strengthCount !== 3 : strengthCount > 7)
  ) {
    return {
      success: false,
      error: { error: "Unexpected strengths count for tier" },
    };
  }

  if (tier === "free") {
    return {
        success: true,
        result: {
        ...normalized,
        weaknesses: [],
        tradeoffs: [],
        premiumTips: [],
        citations: [],
        improvementPredictions: [],
      },
    };
  }

  if (
    !Array.isArray(normalized.weaknesses) ||
    normalized.weaknesses.length < 3 ||
    normalized.weaknesses.length > 5
  ) {
    return {
      success: false,
      error: { error: "Premium and elite tiers require 3-5 weaknesses" },
    };
  }

  if (!Array.isArray(normalized.tradeoffs)) {
    return {
      success: false,
      error: { error: "tradeoffs must be an array" },
    };
  }

  if (!Array.isArray(normalized.premiumTips) || normalized.premiumTips.length !== 20) {
    return {
      success: false,
      error: { error: "premiumTips must contain exactly 20 items" },
    };
  }

  if (!Array.isArray(normalized.citations) || normalized.citations.length === 0) {
    return {
      success: false,
      error: { error: "Premium and elite tiers require citations" },
    };
  }

  if (tier === "elite") {
    if (
      !Array.isArray(normalized.improvementPredictions) ||
      normalized.improvementPredictions.length < 4 ||
      normalized.improvementPredictions.length > 6 ||
      !validateImprovementPredictions(normalized.improvementPredictions)
    ) {
      return {
        success: false,
        error: { error: "Elite tier requires 4-6 valid improvementPredictions" },
      };
    }
  }

  return {
    success: true,
    result: {
      ...normalized,
      improvementPredictions:
        normalized.improvementPredictions ?? [],
    },
  };
}

function stripDataUrlPrefix(imageBase64: string): string {
  const commaIndex = imageBase64.indexOf(",");
  return commaIndex >= 0 ? imageBase64.slice(commaIndex + 1) : imageBase64;
}

export async function analyseWithGemini(
  imageBase64: string,
  mimeType: string,
  tier: AnalysisTier,
): Promise<GeminiAPIResponse> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return {
        success: false,
        error: { error: "GEMINI_API_KEY is not configured" },
      };
    }

    const prompt = getPromptForTier(tier);
    const model = process.env.GEMINI_ANALYSIS_MODEL || "gemini-2.5-flash";

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
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
            temperature: 0.2,
            maxOutputTokens: tier === "elite" ? 2600 : 2200,
          },
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: {
          error: `Gemini API error: ${response.status} ${response.statusText}`,
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
      console.error("Gemini JSON parse failure. Raw output:", outputText);
      return {
        success: false,
        error: { error: "Failed to parse Gemini response as JSON" },
      };
    }

    return validateAnalysisResult(parsed, tier);
  } catch (error) {
    console.error("Gemini API call error:", error);
    return {
      success: false,
      error: {
        error:
          error instanceof Error
            ? error.message
            : "Unknown error calling Gemini API",
      },
    };
  }
}

export async function testGeminiAPI(): Promise<{
  available: boolean;
  error?: string;
}> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return { available: false, error: "GEMINI_API_KEY not configured" };
    }

    const model = process.env.GEMINI_ANALYSIS_MODEL || "gemini-2.5-flash";
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: "Reply with the single word online." }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 10,
          },
        }),
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
