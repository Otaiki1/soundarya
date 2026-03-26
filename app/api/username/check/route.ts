import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

function isValidUsername(username: string) {
  return /^[a-z0-9_]{3,20}$/.test(username);
}

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username");

  if (!username) {
    return NextResponse.json(
      { available: false, error: "username is required" },
      { status: 400 },
    );
  }

  const normalized = normalizeUsername(username);
  if (!isValidUsername(normalized)) {
    return NextResponse.json({
      available: false,
      valid: false,
    });
  }

  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("username", normalized)
    .maybeSingle();

  return NextResponse.json({
    available: !data,
    valid: true,
    username: normalized,
  });
}
