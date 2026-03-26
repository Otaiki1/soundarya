import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

function dedupeAnalyses(rows: Record<string, any>[]) {
  const map = new Map<string, Record<string, any>>();
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

    const queries: Array<Promise<{ data: Record<string, any>[] | null }>> = [];

    if (user?.id) {
      queries.push(
        Promise.resolve(
          supabaseAdmin
            .from("analyses")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
        ),
      );
    }

    if (walletAddress) {
      queries.push(
        Promise.resolve(
          supabaseAdmin
            .from("analyses")
            .select("*")
            .eq("wallet_address", walletAddress.toLowerCase())
            .order("created_at", { ascending: false }),
        ),
      );
    }

    if (sessionId) {
      queries.push(
        Promise.resolve(
          supabaseAdmin
            .from("analyses")
            .select("*")
            .eq("session_id", sessionId)
            .order("created_at", { ascending: false }),
        ),
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
