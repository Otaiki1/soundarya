import { NextRequest, NextResponse } from "next/server";
import {
  AnalysisServiceError,
  createStoredAnalysis,
  deriveIpHash,
  ensureMonthlyFreeQuota,
} from "@/lib/analysis-service";
import {
  extractIPFromRequest,
  getCountryFromIP,
} from "@/lib/ip-geolocation";
import {
  buildFreeQuotaRawKey,
  hashFreeQuotaKey,
} from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const photo = formData.get("photo") as File;
    const sessionId = formData.get("sessionId") as string;
    const walletField = formData.get("walletAddress");
    const walletAddress =
      typeof walletField === "string" && walletField.trim()
        ? walletField.trim()
        : undefined;

    if (!photo || !sessionId) {
      return NextResponse.json(
        { error: "Missing required fields: photo and sessionId" },
        { status: 400 },
      );
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

    let userId: string | undefined;
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id;
    } catch (authError) {
      console.warn("Analysis auth lookup skipped:", authError);
    }

    const quotaRaw = buildFreeQuotaRawKey({
      userId,
      walletAddress,
      sessionId,
    });
    const freeQuotaKeyHash = await hashFreeQuotaKey(quotaRaw);
    const quotaResult = await ensureMonthlyFreeQuota(freeQuotaKeyHash);
    if (quotaResult) {
      return NextResponse.json(
        {
          error:
            "You have used all 3 free analyses for this month. They reset on the 1st (UTC), or connect the same wallet next time so your limit follows your address.",
          code: "FREE_QUOTA_EXCEEDED",
          retryAfter: quotaResult.retryAfter,
          remaining: quotaResult.remaining,
          resetsAt: quotaResult.resetsAt,
        },
        { status: 429 },
      );
    }

    const result = await createStoredAnalysis({
      photo,
      sessionId,
      ipHash,
      freeQuotaKeyHash,
      countryCode: country.countryCode,
      countryName: country.countryName,
      userId,
      tier: "free",
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Analysis endpoint error:", error);

    if (error instanceof AnalysisServiceError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }

    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
