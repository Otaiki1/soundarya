import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasAnalysisAccess } from "@/lib/analysis-access";
import { supabaseAdmin } from "@/lib/supabase/admin";
import crypto from "crypto";

export async function POST(request: NextRequest) {
    try {
        const { analysisId, sessionId } = await request.json();

        if (!analysisId) {
            return NextResponse.json(
                { error: "Analysis ID required" },
                { status: 400 },
            );
        }

        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        // Get analysis to verify it exists
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
            })
        ) {
            return NextResponse.json(
                { error: "You do not have access to this analysis" },
                { status: 403 },
            );
        }

        // Generate unique token
        const token = crypto.randomBytes(16).toString("hex");

        // Create challenge
        const { data: challenge, error: createError } = await supabaseAdmin
            .from("challenges")
            .insert({
                challenger_id: analysis.user_id,
                analysis_id: analysisId,
                token,
            })
            .select()
            .single();

        if (createError || !challenge) {
            console.error("Challenge creation error:", createError);
            return NextResponse.json(
                { error: "Failed to create challenge" },
                { status: 500 },
            );
        }

        const challengeUrl = `${request.nextUrl.origin}/challenge/${token}`;

        return NextResponse.json({
            challengeId: challenge.id,
            token,
            challengeUrl,
        });
    } catch (error) {
        console.error("Challenge creation error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
