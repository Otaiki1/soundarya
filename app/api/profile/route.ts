import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get("address");

    if (!address) {
        return NextResponse.json({ error: "Missing address" }, { status: 400 });
    }

    try {
        // Find profile by wallet address
        // Note: Assuming we have a way to link wallet to profile. 
        // For now, let's search analyses by user_id if we can map address -> user_id, 
        // or just search analyses by a session if needed.
        // BUT for a real profile, we'd want a wallet_address field in profiles.
        
        const { data: profile, error: profileError } = await supabaseAdmin
            .from("profiles")
            .select("*")
            .eq("id", address) // Or map address to UUID if using Supabase Auth with Web3
            .single();

        // Let's also fetch analyses for this "user" (using address as placeholder for user_id)
        const { data: analyses, error: analysesError } = await supabaseAdmin
            .from("analyses")
            .select("*")
            .eq("user_id", address)
            .order("created_at", { ascending: false });

        return NextResponse.json({
            profile: profile || { id: address, subscription_tier: "free" },
            analyses: analyses || [],
        });
    } catch (error) {
        console.error("Profile fetch error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
