import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> },
) {
    try {
        const { token } = await params;

        // Fetch challenge from database
        const { data: challenge, error } = await supabaseAdmin
            .from("challenges")
            .select(
                `
        id,
        challenger_id,
        analysis_id,
        created_at,
        analyses(
          overall_score,
          category,
          country_code,
          symmetry_score,
          proportionality_score,
          bone_structure_score,
          percentile
        ),
        profiles!challenges_challenger_id_fkey(
          username
        )
      `,
            )
            .eq("token", token)
            .single();

        if (error || !challenge) {
            return NextResponse.json(
                { error: "Challenge not found" },
                { status: 404 },
            );
        }

        const analysis = challenge.analyses as any;
        const profile = challenge.profiles as any;

        return NextResponse.json({
            challengerId: challenge.challenger_id,
            score: analysis.overall_score,
            category: analysis.category,
            countryCode: analysis.country_code,
            symmetry: analysis.symmetry_score,
            goldenRatio: analysis.proportionality_score,
            proportionality: analysis.proportionality_score,
            boneStructure: analysis.bone_structure_score,
            percentile: analysis.percentile,
            displayName: profile?.username || "Anonymous",
        });
    } catch (error) {
        console.error("Challenge fetch error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
