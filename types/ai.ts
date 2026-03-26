export type AnalysisTier = "free" | "premium" | "elite";

export type ScoreCategory =
  | "Exceptional"
  | "Very Attractive"
  | "Above Average"
  | "Average"
  | "Below Average";

export type FaceArchetype =
  | "Sharp"
  | "Balanced"
  | "Soft"
  | "Angular"
  | "Rounded"
  | "Defined";

export type ImprovementDifficulty = "easy" | "medium" | "hard";

export interface ImprovementPrediction {
  change: string;
  deltaScore: number;
  affectedDimensions: string[];
  timeframe: string;
  difficulty: ImprovementDifficulty;
}

export interface AIAnalysisResult {
  overallScore: number;
  percentile: number;
  category: ScoreCategory;
  faceArchetype: FaceArchetype;
  confidenceScore: number;
  symmetryScore: number;
  harmonyScore: number;
  proportionalityScore: number;
  averagenessScore: number;
  boneStructureScore: number;
  skinScore: number;
  dimorphismScore: number;
  neotenyScore: number;
  adiposityScore: number;
  executiveSummary: string;
  strengths: string[];
  weaknesses?: string[];
  tradeoffs?: string[];
  weakestDimension: string;
  freeTip: string;
  premiumTips?: string[];
  citations?: string[];
  improvementPredictions?: ImprovementPrediction[];
}
