import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let profile = null;
    if (user?.id) {
      const result = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      profile = result.data;
    }

    if (!profile && address) {
      const result = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("wallet_address", address.toLowerCase())
        .maybeSingle();
      profile = result.data;
    }

    const normalizedAddress = address?.toLowerCase() ?? null;
    const isOwnWalletView =
      Boolean(user?.id) &&
      Boolean(normalizedAddress) &&
      profile?.id === user?.id;

    const queries = [];
    if (user?.id && (!normalizedAddress || isOwnWalletView)) {
      queries.push(
        supabaseAdmin
          .from("analyses")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      );
    }
    if (normalizedAddress && isOwnWalletView) {
      queries.push(
        supabaseAdmin
          .from("analyses")
          .select("*")
          .eq("wallet_address", normalizedAddress)
          .order("created_at", { ascending: false }),
      );
    }

    const results = await Promise.all(queries);
    const analysisMap = new Map<string, any>();
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
