import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const PROFILE_ANALYSIS_FIELDS =
  "id, overall_score, category, summary, created_at, unlock_tier";

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let ownProfile = null;
    if (user?.id) {
      const result = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      ownProfile = result.data;
    }

    const normalizedAddress = address?.toLowerCase() ?? null;
    const ownWalletAddress = ownProfile?.wallet_address?.toLowerCase() ?? null;
    const isOwnWalletView =
      Boolean(user?.id) &&
      Boolean(normalizedAddress) &&
      ownWalletAddress === normalizedAddress;

    let publicProfile = null;
    if (normalizedAddress && !isOwnWalletView) {
      const result = await supabaseAdmin
        .from("profiles")
        .select("id, username, wallet_address")
        .eq("wallet_address", normalizedAddress)
        .maybeSingle();
      publicProfile = result.data;
    }

    const profile =
      isOwnWalletView || !normalizedAddress ? ownProfile : publicProfile;

    const queries = [];
    if (user?.id && (!normalizedAddress || isOwnWalletView)) {
      queries.push(
        supabaseAdmin
          .from("analyses")
          .select(PROFILE_ANALYSIS_FIELDS)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      );
    }
    if (normalizedAddress && isOwnWalletView) {
      queries.push(
        supabaseAdmin
          .from("analyses")
          .select(PROFILE_ANALYSIS_FIELDS)
          .eq("wallet_address", normalizedAddress)
          .order("created_at", { ascending: false }),
      );
    }

    const results = await Promise.all(queries);
    const analysisMap = new Map<
      string,
      {
        id: string;
        overall_score: number;
        category: string;
        summary: string;
        created_at: string;
        unlock_tier: number | null;
      }
    >();
    for (const result of results) {
      for (const analysis of result.data ?? []) {
        analysisMap.set(analysis.id, analysis);
      }
    }

    const { data: nftMints } = normalizedAddress && isOwnWalletView
      ? await supabaseAdmin
          .from("nft_mints")
          .select("*")
          .eq("wallet_address", normalizedAddress)
          .order("minted_at", { ascending: false })
      : { data: [] };

    return NextResponse.json({
      profile: profile || null,
      analyses: Array.from(analysisMap.values()).sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }),
      nftMints: nftMints || [],
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
