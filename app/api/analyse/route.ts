import { NextRequest, NextResponse } from "next/server";
import { createStoredAnalysis, deriveIpHash, ensureRateLimit } from "@/lib/analysis-service";
import {
  extractIPFromRequest,
  getCountryFromIP,
} from "@/lib/ip-geolocation";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const photo = formData.get("photo") as File;
    const sessionId = formData.get("sessionId") as string;

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
    const rateLimitResult = await ensureRateLimit(ipHash);
    if (rateLimitResult) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          retryAfter: rateLimitResult.retryAfter,
          remaining: rateLimitResult.remaining,
        },
        { status: 429 },
      );
    }

    const country = await getCountryFromIP(clientIP);

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const result = await createStoredAnalysis({
      photo,
      sessionId,
      ipHash,
      countryCode: country.countryCode,
      countryName: country.countryName,
      userId: user?.id,
      tier: "free",
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Analysis endpoint error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
