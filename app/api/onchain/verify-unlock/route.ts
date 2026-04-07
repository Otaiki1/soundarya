import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, type Hex } from "viem";
import { SOUNDARYA_CHAIN, SOUNDARYA_RPC_URL, SOUNDARYA_SCORE_ABI, SOUNDARYA_SCORE_ADDRESS } from "@/lib/contracts";
import { createClient } from "@/lib/supabase/server";
import { hasAnalysisAccess } from "@/lib/analysis-access";
import { analysisIdToContractUint } from "@/lib/scans";
import { supabaseAdmin } from "@/lib/supabase/admin";

const publicClient = createPublicClient({
  chain: SOUNDARYA_CHAIN,
  transport: http(SOUNDARYA_RPC_URL),
});

function tierToDbTier(tier: number) {
  if (tier >= 3) return "elite";
  if (tier >= 2) return "premium";
  return "free";
}

export async function POST(request: NextRequest) {
  try {
    const { analysisId, walletAddress, txHash, sessionId } = await request.json();

    if (!analysisId || !walletAddress) {
      return NextResponse.json(
        { error: "analysisId and walletAddress are required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: analysis, error: analysisError } = await supabaseAdmin
      .from("analyses")
      .select("id, user_id, session_id, wallet_address")
      .eq("id", analysisId)
      .single();

    if (analysisError || !analysis) {
      return NextResponse.json(
        { error: "Analysis not found" },
        { status: 404 },
      );
    }

    if (
      !hasAnalysisAccess({
        analysis,
        userId: user?.id,
        sessionId: typeof sessionId === "string" ? sessionId : null,
        walletAddress,
      })
    ) {
      return NextResponse.json(
        { error: "You do not have access to unlock this analysis" },
        { status: 403 },
      );
    }

    if (txHash) {
      await publicClient.waitForTransactionReceipt({ hash: txHash as Hex });
    }

    const tier = await publicClient.readContract({
      address: SOUNDARYA_SCORE_ADDRESS,
      abi: SOUNDARYA_SCORE_ABI,
      functionName: "getTier",
      args: [walletAddress as `0x${string}`, analysisIdToContractUint(analysisId)],
    });

    const tierNumber = Number(tier);
    const premiumTier = tierToDbTier(tierNumber);

    const { error } = await supabaseAdmin
      .from("analyses")
      .update({
        wallet_address: walletAddress.toLowerCase(),
        unlock_tier: tierNumber,
        premium_unlocked: tierNumber > 0,
        premium_tier: premiumTier,
      })
      .eq("id", analysisId);

    if (error) {
      return NextResponse.json(
        { error: "Failed to update unlock tier" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      analysisId,
      walletAddress,
      tier: tierNumber,
      premiumTier,
    });
  } catch (error) {
    console.error("Verify unlock route error:", error);
    return NextResponse.json(
      { error: "Unable to verify unlock" },
      { status: 500 },
    );
  }
}
