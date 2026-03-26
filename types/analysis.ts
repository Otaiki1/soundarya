import type {
  AIAnalysisResult,
  FaceArchetype,
  ImprovementPrediction,
  ScoreCategory,
} from "./ai";

export type LoadingStage =
  | "detecting"
  | "symmetry"
  | "ratio"
  | "structure"
  | "writing";

export interface Analysis extends AIAnalysisResult {
  id: string;
  user_id?: string;
  session_id: string;
  ip_hash: string;
  premium_unlocked: boolean;
  premium_tier: "free" | "premium" | "elite";
  premium_tips?: string[];
  country_code?: string;
  country_name?: string;
  user_email?: string;
  email_sent_at?: string;
  relayer_tx_hash?: string;
  scan_hash?: string;
  wallet_address?: string;
  unlock_tier: number;
  photo_deleted_at?: string;
  shared_count: number;
  challenge_token?: string;
  created_at: string;
  updated_at: string;
}

export interface AnalysisPublic {
  id: string;
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
  countryCode?: string;
  countryName?: string;
  premiumUnlocked: boolean;
  unlockTier?: number;
  persisted?: boolean;
  persistenceError?: string;
  createdAt: string;

  // Transitional aliases used by existing components while the UI is migrated.
  goldenRatioScore: number;
  summary: string;
  premiumHook: string;
}

export interface AnalysisUpdatePremium {
  premium_unlocked: boolean;
  premium_tier: "premium" | "elite";
  premium_tips: string[];
  unlock_tier: number;
}
