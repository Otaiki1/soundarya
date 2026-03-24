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
        const { data: analysisData, error: fetchError } = await supabaseAdmin
            .from("analyses")
            .select("*")
            .eq("id", analysisId)
            .single();

        if (fetchError || !analysisData) {
            return NextResponse.json(
                { error: "Analysis not found" },
                { status: 404 },
            );
        }

        // Convert UUID string to a BigInt for the contract analysisId
        const numericAnalysisId = BigInt("0x" + analysisId.replace(/-/g, ""));

        // Prepare ScoreData for the new SoundaryaScore contract
        const scoreData = {
            analysisId: numericAnalysisId.toString(),
            nonce: Math.floor(Math.random() * 1000000).toString(), // Mock nonce for now
            to: walletAddress,
            score: Math.floor(analysisData.overall_score * 10).toString(),
            dim0: Math.floor(analysisData.symmetry_score * 10).toString(),
            dim1: Math.floor(analysisData.golden_ratio_score * 10).toString(),
            dim2: Math.floor(analysisData.bone_structure_score * 10).toString(),
            dim3: Math.floor(analysisData.harmony_score * 10).toString(),
            dim4: Math.floor(analysisData.skin_score * 10).toString(),
            dim5: Math.floor(analysisData.dimorphism_score * 10).toString(),
            dim6: Math.floor(analysisData.percentile * 10).toString(),
        };

        // Mock signature (In production, use Ethers/Viem to sign this data)
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
