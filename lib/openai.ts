import { getPromptForTier } from "./prompts";
import type { AIAnalysisResult, AnalysisTier, ScoreCategory } from "@/types/ai";

export interface OpenAIAPIError {
  error: string;
  code?: string;
}

export interface OpenAIAPIResponse {
  success: boolean;
  result?: AIAnalysisResult;
  error?: OpenAIAPIError;
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
    name: "soundarya_analysis",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: Object.keys(properties),
      properties,
    },
  } as const;
}

function extractOutputText(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;

  const directOutputText = (payload as { output_text?: unknown }).output_text;
  if (typeof directOutputText === "string" && directOutputText.trim()) {
    return directOutputText;
  }

  const output = (payload as { output?: unknown }).output;
  if (!Array.isArray(output)) return null;

  for (const item of output) {
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;

    for (const part of content) {
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
): OpenAIAPIResponse {
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

export async function analyseWithOpenAI(
  imageBase64: string,
  _mimeType: string,
  tier: AnalysisTier,
): Promise<OpenAIAPIResponse> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return {
        success: false,
        error: { error: "OPENAI_API_KEY is not configured" },
      };
    }

    const prompt = getPromptForTier(tier);
    const model = process.env.OPENAI_ANALYSIS_MODEL || "gpt-4o-mini";

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        instructions: prompt.systemPrompt,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: prompt.userPrompt,
              },
              {
                type: "input_image",
                image_url: imageBase64,
                detail: "high",
              },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            ...getAnalysisSchema(tier),
          },
        },
        temperature: 0.2,
        max_output_tokens: 1800,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: {
          error: `OpenAI API error: ${response.status} ${response.statusText}`,
          code:
            typeof errorData?.error?.code === "string"
              ? errorData.error.code
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
          error: "Invalid response from OpenAI: missing structured output",
        },
      };
    }

    let parsed: AIAnalysisResult;

    try {
      parsed = JSON.parse(outputText) as AIAnalysisResult;
    } catch {
      return {
        success: false,
        error: { error: "Failed to parse OpenAI response as JSON" },
      };
    }

    return validateAnalysisResult(parsed, tier);
  } catch (error) {
    console.error("OpenAI API call error:", error);
    return {
      success: false,
      error: {
        error:
          error instanceof Error
            ? error.message
            : "Unknown error calling OpenAI API",
      },
    };
  }
}

export async function testOpenAIAPI(): Promise<{
  available: boolean;
  error?: string;
}> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return { available: false, error: "OPENAI_API_KEY not configured" };
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_ANALYSIS_MODEL || "gpt-4o-mini",
        input: "Reply with the single word online.",
        max_output_tokens: 10,
      }),
    });

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
