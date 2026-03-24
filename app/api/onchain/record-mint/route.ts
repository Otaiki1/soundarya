import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
    try {
        const {
            analysisId,
            walletAddress,
            txHash,
            scoreData,
            status,
            tokenId,
        } =
            await request.json();

        if (!analysisId || !walletAddress || !txHash) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 },
            );
        }

        const mintPayload = {
            analysis_id: analysisId,
            wallet_address: walletAddress,
            tx_hash: txHash,
            status: status || "pending",
            ...(scoreData ? { score_data: scoreData } : {}),
        };

        const mintPayloadWithToken = tokenId
            ? { ...mintPayload, token_id: tokenId }
            : mintPayload;

        const { data: existingMint } = await supabaseAdmin
            .from("nft_mints")
            .select("id")
            .eq("tx_hash", txHash)
            .maybeSingle();

        const buildQuery = (payload: typeof mintPayload | typeof mintPayloadWithToken) =>
            existingMint
                ? supabaseAdmin
                      .from("nft_mints")
                      .update(payload)
                      .eq("id", existingMint.id)
                : supabaseAdmin.from("nft_mints").insert(payload);

        let { data: mint, error } = await buildQuery(mintPayloadWithToken)
            .select()
            .single();

        if (error && tokenId) {
            const fallback = await buildQuery(mintPayload).select().single();
            mint = fallback.data;
            error = fallback.error;
        }

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
            status: mint.status,
            tokenId: mint.token_id ?? null,
        });
    } catch (error) {
        console.error("Mint record error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
