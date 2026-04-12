import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

interface ScoreHistoryAnalysis {
  id: string;
  overall_score: number;
  category: string;
  summary: string;
  created_at: string;
  unlock_tier: number | null;
}

const SCORE_HISTORY_FIELDS =
  "id, overall_score, category, summary, created_at, unlock_tier";

function dedupeAnalyses(rows: ScoreHistoryAnalysis[]) {
  const map = new Map<string, ScoreHistoryAnalysis>();
  for (const row of rows) {
    map.set(row.id, row);
  }
  return Array.from(map.values()).sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get("sessionId");
    const walletAddress = request.nextUrl.searchParams.get("walletAddress");

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const ownProfile = user?.id
      ? await supabaseAdmin
          .from("profiles")
          .select("wallet_address")
          .eq("id", user.id)
          .maybeSingle()
      : null;

    const normalizedWalletAddress = walletAddress?.toLowerCase() ?? null;
    const canViewRequestedWallet =
      Boolean(user?.id) &&
      Boolean(normalizedWalletAddress) &&
      ownProfile?.data?.wallet_address?.toLowerCase() === normalizedWalletAddress;

    const queries: Array<PromiseLike<{ data: ScoreHistoryAnalysis[] | null }>> = [];

    if (user?.id) {
      queries.push(
        supabaseAdmin
          .from("analyses")
          .select(SCORE_HISTORY_FIELDS)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      );
    }

    if (normalizedWalletAddress && canViewRequestedWallet) {
      queries.push(
        supabaseAdmin
          .from("analyses")
          .select(SCORE_HISTORY_FIELDS)
          .eq("wallet_address", normalizedWalletAddress)
          .order("created_at", { ascending: false }),
      );
    }

    if (sessionId) {
      queries.push(
        supabaseAdmin
          .from("analyses")
          .select(SCORE_HISTORY_FIELDS)
          .eq("session_id", sessionId)
          .order("created_at", { ascending: false }),
      );
    }

    const results = await Promise.all(queries);
    const analyses = dedupeAnalyses(
      results.flatMap((result) => result.data ?? []),
    );

    const scores = analyses
      .map((analysis) => Number(analysis.overall_score))
      .filter((score) => !Number.isNaN(score));

    const oldestScore = scores.length ? scores[scores.length - 1] : 0;
    const newestScore = scores.length ? scores[0] : 0;

    return NextResponse.json({
      analyses,
      bestScore: scores.length ? Math.max(...scores) : 0,
      totalScans: analyses.length,
      improvement: scores.length > 1 ? Number((newestScore - oldestScore).toFixed(1)) : 0,
    });
  } catch (error) {
    console.error("Score history route error:", error);
    return NextResponse.json(
      { error: "Unable to fetch score history" },
      { status: 500 },
    );
  }
}
