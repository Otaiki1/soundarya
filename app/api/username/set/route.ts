import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

function isValidUsername(username: string) {
  return /^[a-z0-9_]{3,20}$/.test(username);
}

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();
    const normalized = normalizeUsername(username || "");

    if (!isValidUsername(normalized)) {
      return NextResponse.json(
        { error: "Username must be 3-20 characters using letters, numbers, or underscores." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("username", normalized)
      .maybeSingle();

    if (existing && existing.id !== user.id) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 409 },
      );
    }

    const { error } = await supabaseAdmin.from("profiles").upsert({
      id: user.id,
      email: user.email,
      username: normalized,
    });

    if (error) {
      return NextResponse.json(
        { error: "Failed to update username" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, username: normalized });
  } catch (error) {
    console.error("Set username route error:", error);
    return NextResponse.json(
      { error: "Unable to update username" },
      { status: 500 },
    );
  }
}
