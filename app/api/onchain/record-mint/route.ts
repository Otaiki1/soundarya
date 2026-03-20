import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
    try {
        const { analysisId, walletAddress, txHash, scoreData } =
            await request.json();

        if (!analysisId || !walletAddress || !txHash) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 },
            );
        }

        // Store mint record
        const { data: mint, error } = await supabaseAdmin
            .from("nft_mints")
            .insert({
                analysis_id: analysisId,
                wallet_address: walletAddress,
                tx_hash: txHash,
                status: "pending",
                score_data: scoreData,
            })
            .select()
            .single();

        if (error) {
            console.error("Mint record error:", error);
            return NextResponse.json(
                { error: "Failed to record mint" },
                { status: 500 },
            );
        }

        return NextResponse.json({
            mintId: mint.id,
            txHash,
            status: "pending",
        });
    } catch (error) {
        console.error("Mint record error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
