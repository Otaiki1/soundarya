import type { ImprovementPrediction } from "@/types/ai";

const DIRECT_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bthe face presents\b/gi, "your face shows"],
  [/\bthis face presents\b/gi, "your face shows"],
  [/\bthe face shows\b/gi, "your face shows"],
  [/\bthis face shows\b/gi, "your face shows"],
  [/\bthe face has\b/gi, "your face has"],
  [/\bthis face has\b/gi, "your face has"],
  [/\bthe face appears\b/gi, "your face appears"],
  [/\bthis face appears\b/gi, "your face appears"],
  [/\bthe face reads\b/gi, "your face reads"],
  [/\bthis face reads\b/gi, "your face reads"],
  [/\bthe face\b/gi, "your face"],
  [/\bthis face\b/gi, "your face"],
  [/\bthe subject's face\b/gi, "your face"],
  [/\bthis subject's face\b/gi, "your face"],
  [/\bthe subject\b/gi, "you"],
  [/\bthis subject\b/gi, "you"],
  [/\bthe individual\b/gi, "you"],
  [/\bthis individual\b/gi, "you"],
  [/\bthe user's face\b/gi, "your face"],
  [/\bfor the subject\b/gi, "for you"],
  [/\bfor this subject\b/gi, "for you"],
  [/\bfor the individual\b/gi, "for you"],
];

const FEATURE_NOUN_PATTERN =
  /\bthe (skin|jawline|cheekbones|midface|lower third|upper third|forehead|nose|lips|chin|brows|eyes|eye area|facial thirds|facial structure)\b/gi;

export const PERSONALIZED_PREMIUM_HOOK =
  "Unlock your full report to see where your face is losing points, which traits need the most attention, and what to improve first.";

export function personalizeReportText(text: string | null | undefined) {
  if (typeof text !== "string") {
    return "";
  }

  let personalized = text.trim();

  for (const [pattern, replacement] of DIRECT_REPLACEMENTS) {
    personalized = personalized.replace(pattern, replacement);
  }

  personalized = personalized.replace(
    FEATURE_NOUN_PATTERN,
    (_match, feature: string) => `your ${feature}`,
  );

  return personalized.replace(/\s+/g, " ").trim();
}

export function personalizeReportList(items: string[] | null | undefined) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item) => personalizeReportText(item)).filter(Boolean);
}

export function personalizeImprovementPredictions(
  predictions: ImprovementPrediction[] | null | undefined,
) {
  if (!Array.isArray(predictions)) {
    return [];
  }

  return predictions.map((prediction) => ({
    ...prediction,
    change: personalizeReportText(prediction.change),
    timeframe: personalizeReportText(prediction.timeframe),
  }));
}
