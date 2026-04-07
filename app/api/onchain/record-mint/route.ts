import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasAnalysisAccess } from "@/lib/analysis-access";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
    try {
        const {
            analysisId,
            walletAddress,
            sessionId,
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

        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        const { data: analysis, error: analysisError } = await supabaseAdmin
            .from("analyses")
            .select("id, user_id, session_id, wallet_address")
            .eq("id", analysisId)
            .single();

        if (analysisError || !analysis) {
            return NextResponse.json(
                { error: "Analysis not found" },
                { status: 404 },
            );
        }

        if (
            !hasAnalysisAccess({
                analysis,
                userId: user?.id,
                sessionId: typeof sessionId === "string" ? sessionId : null,
                walletAddress,
            })
        ) {
            return NextResponse.json(
                { error: "You do not have access to record this mint" },
                { status: 403 },
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
