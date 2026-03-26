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

function validateIntegerScore(score: number): boolean {
  return Number.isInteger(score) && score >= 1 && score <= 100;
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

  const missingFields = requiredFields.filter((field) => !(field in parsed));
  if (missingFields.length > 0) {
    return {
      success: false,
      error: {
        error: `Missing required fields: ${missingFields.join(", ")}`,
      },
    };
  }

  if (parsed.overallScore < 1 || parsed.overallScore > 10) {
    return {
      success: false,
      error: { error: "overallScore must be between 1.0 and 10.0" },
    };
  }

  if (parsed.percentile < 1 || parsed.percentile > 99) {
    return {
      success: false,
      error: { error: "percentile must be an integer between 1 and 99" },
    };
  }

  if (!SCORE_CATEGORIES.includes(parsed.category)) {
    return {
      success: false,
      error: { error: "Invalid category returned by Gemini" },
    };
  }

  if (!FACE_ARCHETYPES.includes(parsed.faceArchetype)) {
    return {
      success: false,
      error: { error: "Invalid faceArchetype returned by Gemini" },
    };
  }

  if (parsed.confidenceScore < 0 || parsed.confidenceScore > 1) {
    return {
      success: false,
      error: { error: "confidenceScore must be between 0 and 1" },
    };
  }

  const dimensionScores = [
    parsed.symmetryScore,
    parsed.harmonyScore,
    parsed.proportionalityScore,
    parsed.averagenessScore,
    parsed.boneStructureScore,
    parsed.skinScore,
    parsed.dimorphismScore,
    parsed.neotenyScore,
    parsed.adiposityScore,
  ];

  if (!dimensionScores.every(validateIntegerScore)) {
    return {
      success: false,
      error: {
        error: "All dimension scores must be integers between 1 and 100",
      },
    };
  }

  if (!WEAKEST_DIMENSIONS.includes(parsed.weakestDimension)) {
    return {
      success: false,
      error: {
        error: `weakestDimension must be one of: ${WEAKEST_DIMENSIONS.join(", ")}`,
      },
    };
  }

  const strengthCount = parsed.strengths.length;
  if (
    !Array.isArray(parsed.strengths) ||
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
        ...parsed,
        weaknesses: [],
        tradeoffs: [],
        premiumTips: [],
        citations: [],
        improvementPredictions: [],
      },
    };
  }

  if (
    !Array.isArray(parsed.weaknesses) ||
    parsed.weaknesses.length < 3 ||
    parsed.weaknesses.length > 5
  ) {
    return {
      success: false,
      error: { error: "Premium and elite tiers require 3-5 weaknesses" },
    };
  }

  if (!Array.isArray(parsed.tradeoffs)) {
    return {
      success: false,
      error: { error: "tradeoffs must be an array" },
    };
  }

  if (!Array.isArray(parsed.premiumTips) || parsed.premiumTips.length !== 20) {
    return {
      success: false,
      error: { error: "premiumTips must contain exactly 20 items" },
    };
  }

  if (!Array.isArray(parsed.citations) || parsed.citations.length === 0) {
    return {
      success: false,
      error: { error: "Premium and elite tiers require citations" },
    };
  }

  if (tier === "elite") {
    if (
      !Array.isArray(parsed.improvementPredictions) ||
      parsed.improvementPredictions.length < 4 ||
      parsed.improvementPredictions.length > 6 ||
      !validateImprovementPredictions(parsed.improvementPredictions)
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
      ...parsed,
      improvementPredictions:
        parsed.improvementPredictions ?? [],
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

    let parsed: AIAnalysisResult;

    try {
      parsed = JSON.parse(outputText) as AIAnalysisResult;
    } catch {
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
