export type AnalysisTier = "free" | "premium";

export type ScoreCategory =
  | "Exceptional"
  | "Very Attractive"
  | "Above Average"
  | "Average"
  | "Below Average";

export interface AIAnalysisResult {
  overallScore: number;
  symmetryScore: number;
  goldenRatioScore: number;
  boneStructureScore: number;
  harmonyScore: number;
  skinScore: number;
  dimorphismScore: number;
  percentile: number;
  category: ScoreCategory;
  summary: string;
  strengths: string[];
  weakestDimension: string;
  freeTip: string;
  premiumHook: string;
  premiumTips?: string[];
}
