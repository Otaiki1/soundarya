import { getPromptForTier } from "./prompts";
import type { AIAnalysisResult, AnalysisTier, ScoreCategory } from "@/types/ai";

export interface GeminiAPIError {
  error: string;
  code?: string;
}

export interface GeminiAPIResponse {
  success: boolean;
  result?: AIAnalysisResult;
  error?: GeminiAPIError;
}

function getAnalysisSchema(tier: AnalysisTier) {
  const properties = {
    overallScore: { type: "number" },
    symmetryScore: { type: "integer" },
    goldenRatioScore: { type: "integer" },
    boneStructureScore: { type: "integer" },
    harmonyScore: { type: "integer" },
    skinScore: { type: "integer" },
    dimorphismScore: { type: "integer" },
    percentile: { type: "integer" },
    category: {
      type: "string",
      enum: [
        "Exceptional",
        "Very Attractive",
        "Above Average",
        "Average",
        "Below Average",
      ],
    },
    summary: { type: "string" },
    strengths: { type: "array", items: { type: "string" } },
    weakestDimension: { type: "string" },
    freeTip: { type: "string" },
    premiumHook: { type: "string" },
    ...(tier === "premium"
      ? { premiumTips: { type: "array", items: { type: "string" } } }
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

function validateAnalysisResult(
  parsed: AIAnalysisResult,
  tier: AnalysisTier,
): GeminiAPIResponse {
  const requiredFields = [
    "overallScore",
    "symmetryScore",
    "goldenRatioScore",
    "boneStructureScore",
    "harmonyScore",
    "skinScore",
    "dimorphismScore",
    "percentile",
    "category",
    "summary",
    "strengths",
    "weakestDimension",
    "freeTip",
    "premiumHook",
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

  const dimensionScores = [
    parsed.symmetryScore,
    parsed.goldenRatioScore,
    parsed.boneStructureScore,
    parsed.harmonyScore,
    parsed.skinScore,
    parsed.dimorphismScore,
  ];

  for (const score of dimensionScores) {
    if (score < 1 || score > 100 || !Number.isInteger(score)) {
      return {
        success: false,
        error: {
          error: "Dimension scores must be integers between 1 and 100",
        },
      };
    }
  }

  if (
    parsed.percentile < 1 ||
    parsed.percentile > 99 ||
    !Number.isInteger(parsed.percentile)
  ) {
    return {
      success: false,
      error: {
        error: "percentile must be an integer between 1 and 99",
      },
    };
  }

  const validCategories: ScoreCategory[] = [
    "Exceptional",
    "Very Attractive",
    "Above Average",
    "Average",
    "Below Average",
  ];

  if (!validCategories.includes(parsed.category)) {
    return {
      success: false,
      error: {
        error: `Invalid category. Must be one of: ${validCategories.join(", ")}`,
      },
    };
  }

  const validWeakestDimensions = [
    "Symmetry",
    "Golden Ratio",
    "Bone Structure",
    "Harmony",
    "Skin Quality",
    "Dimorphism",
  ];

  if (!validWeakestDimensions.includes(parsed.weakestDimension)) {
    return {
      success: false,
      error: {
        error: `weakestDimension must be one of: ${validWeakestDimensions.join(", ")}`,
      },
    };
  }

  if (!Array.isArray(parsed.strengths) || parsed.strengths.length < 3) {
    return {
      success: false,
      error: { error: "strengths must contain at least 3 items" },
    };
  }

  if (
    tier === "premium" &&
    (!Array.isArray(parsed.premiumTips) || parsed.premiumTips.length !== 20)
  ) {
    return {
      success: false,
      error: { error: "Premium tier must include exactly 20 premiumTips" },
    };
  }

  return {
    success: true,
    result: {
      ...parsed,
      premiumTips: tier === "premium" ? parsed.premiumTips : undefined,
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
            maxOutputTokens: 1800,
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
