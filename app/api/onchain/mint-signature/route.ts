import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
    try {
        const { analysisId, walletAddress } = await request.json();

        if (!analysisId || !walletAddress) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 },
            );
        }

        // Fetch analysis data
        const { data: analysis, error } = await supabaseAdmin
            .from("analyses")
            .select("*")
            .eq("id", analysisId)
            .single();

        if (error || !analysis) {
            return NextResponse.json(
                { error: "Analysis not found" },
                { status: 404 },
            );
        }

        // Prepare score data for contract
        const scoreData = {
            overallScore: Math.floor(analysis.overall_score * 100), // Scale to avoid decimals
            symmetry: Math.floor(analysis.symmetry_score * 100),
            goldenRatio: Math.floor(analysis.golden_ratio_score * 100),
            boneStructure: Math.floor(analysis.bone_structure_score * 100),
            harmony: Math.floor(analysis.harmony_score * 100),
            skinQuality: Math.floor(analysis.skin_score * 100),
            dimorphism: Math.floor(analysis.dimorphism_score * 100),
            percentile: analysis.percentile,
        };

        // In a real implementation, you would:
        // 1. Sign the scoreData with your backend private key
        // 2. Return a valid signature that the smart contract can verify

        // For now, return mock signature
        const signature =
            "0x" +
            Buffer.from("mock-signature-" + analysisId)
                .toString("hex")
                .padEnd(130, "0");

        const mintPrice = "0.001"; // 0.001 ETH

        return NextResponse.json({
            signature,
            scoreData,
            mintPrice,
        });
    } catch (error) {
        console.error("Mint signature error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
