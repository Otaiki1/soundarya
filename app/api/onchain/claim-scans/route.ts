import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, scanHashes } = await request.json();

    if (!walletAddress || !Array.isArray(scanHashes) || scanHashes.length === 0) {
      return NextResponse.json(
        { error: "walletAddress and scanHashes are required" },
        { status: 400 },
      );
    }

    const normalizedWallet = String(walletAddress).toLowerCase();
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabaseAdmin
        .from("profiles")
        .upsert({
          id: user.id,
          wallet_address: normalizedWallet,
        });
    }

    const { data, error } = await supabaseAdmin
      .from("analyses")
      .update({
        wallet_address: normalizedWallet,
      })
      .in("scan_hash", scanHashes)
      .select("id, scan_hash");

    if (error) {
      return NextResponse.json(
        { error: "Failed to claim scans" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      linkedCount: data?.length ?? 0,
      claimedScanHashes: data?.map((row) => row.scan_hash) ?? [],
      analysisIds: data?.map((row) => row.id) ?? [],
    });
  } catch (error) {
    console.error("Claim scans route error:", error);
    return NextResponse.json(
      { error: "Unable to claim scans" },
      { status: 500 },
    );
  }
}
