import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { createStoredAnalysis, deriveIpHash } from "@/lib/analysis-service";
import { SOUNDARYA_CHAIN, SOUNDARYA_RPC_URL, SOUNDARYA_SCORE_ABI, SOUNDARYA_SCORE_ADDRESS } from "@/lib/contracts";
import { getCountryFromIP, extractIPFromRequest } from "@/lib/ip-geolocation";
import { hasAnalysisAccess } from "@/lib/analysis-access";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const publicClient = createPublicClient({
  chain: SOUNDARYA_CHAIN,
  transport: http(SOUNDARYA_RPC_URL),
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const photo = formData.get("photo") as File;
    const sessionId = formData.get("sessionId") as string;
    const previousAnalysisId = formData.get("previousAnalysisId") as string;
    const walletAddress = formData.get("walletAddress") as string | null;

    if (!photo || !sessionId || !previousAnalysisId) {
      return NextResponse.json(
        { error: "photo, sessionId, and previousAnalysisId are required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: previousAnalysis } = await supabaseAdmin
      .from("analyses")
      .select("id, user_id, session_id, wallet_address, unlock_tier")
      .eq("id", previousAnalysisId)
      .single();

    if (!previousAnalysis) {
      return NextResponse.json(
        { error: "Previous analysis not found" },
        { status: 404 },
      );
    }

    if (
      !hasAnalysisAccess({
        analysis: previousAnalysis,
        userId: user?.id,
        sessionId,
        walletAddress,
      })
    ) {
      return NextResponse.json(
        { error: "You do not have access to rescan this analysis" },
        { status: 403 },
      );
    }

    if (walletAddress) {
      const canRescan = await publicClient.readContract({
        address: SOUNDARYA_SCORE_ADDRESS,
        abi: SOUNDARYA_SCORE_ABI,
        functionName: "canRescan",
        args: [walletAddress as `0x${string}`],
      });

      if (!canRescan) {
        return NextResponse.json(
          { error: "Rescan is not available yet" },
          { status: 409 },
        );
      }
    }

    const clientIP = extractIPFromRequest(request);
    if (!clientIP) {
      return NextResponse.json(
        { error: "Unable to determine client IP" },
        { status: 400 },
      );
    }

    const ipHash = await deriveIpHash(clientIP);
    const country = await getCountryFromIP(clientIP);

    const nextTier =
      Number(previousAnalysis.unlock_tier ?? 0) >= 3 ? "elite" : "premium";

    const current = await createStoredAnalysis({
      photo,
      sessionId,
      ipHash,
      countryCode: country.countryCode,
      countryName: country.countryName,
      userId: user?.id,
      tier: nextTier,
    });

    return NextResponse.json({
      previous: {
        id: previousAnalysis.id,
        unlockTier: Number(previousAnalysis.unlock_tier ?? 0),
      },
      current,
    });
  } catch (error) {
    console.error("Rescan route error:", error);
    return NextResponse.json(
      { error: "Unable to run rescan" },
      { status: 500 },
    );
  }
}
