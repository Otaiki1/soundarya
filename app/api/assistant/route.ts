import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { generateGeminiContent, getGeminiApiKeys } from "@/lib/gemini";

async function runAssistantPrompt(message: string, context: Record<string, any>) {
  const model = process.env.GEMINI_ANALYSIS_MODEL || "gemini-2.5-flash";
  const prompt = `You are Uzoza's Beauty Assistant.
Answer directly, respectfully, and practically. Use the provided analysis context only.
Do not diagnose disease or recommend invasive procedures.

Analysis context:
${JSON.stringify(context, null, 2)}

User message:
${message}`;

  const response = await generateGeminiContent(
    {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 600 },
    },
    model,
  );

  if (!response.ok) {
    throw new Error(`Assistant model error: ${response.status}`);
  }

  const data = await response.json();
  return (
    data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
    "I couldn't generate a response right now."
  );
}

export async function POST(request: NextRequest) {
  try {
    const { message, analysisId, sessionId } = await request.json();

    if (getGeminiApiKeys().length === 0) {
      return NextResponse.json(
        { error: "Assistant is not configured right now" },
        { status: 503 },
      );
    }

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let query = supabaseAdmin.from("analyses").select("*").gte("unlock_tier", 2);
    if (analysisId) query = query.eq("id", analysisId);

    if (user?.id) {
      query = query.eq("user_id", user.id);
    } else if (sessionId) {
      query = query.eq("session_id", sessionId);
    } else {
      return NextResponse.json(
        { error: "Assistant access requires an authenticated user or sessionId" },
        { status: 401 },
      );
    }

    const { data: analysis, error } = analysisId
      ? await query.single()
      : await query.order("created_at", { ascending: false }).limit(1).maybeSingle();

    if (error || !analysis) {
      return NextResponse.json(
        { error: "Premium or Elite access is required for the assistant" },
        { status: 403 },
      );
    }

    const reply = await runAssistantPrompt(message, analysis);

    await supabaseAdmin.from("assistant_messages").insert([
      {
        user_id: user?.id ?? null,
        session_id: sessionId ?? null,
        role: "user",
        content: message,
        analysis_context_id: analysis.id,
      },
      {
        user_id: user?.id ?? null,
        session_id: sessionId ?? null,
        role: "assistant",
        content: reply,
        analysis_context_id: analysis.id,
      },
    ]);

    return NextResponse.json({ success: true, reply, analysisId: analysis.id });
  } catch (error) {
    console.error("Assistant route error:", error);
    return NextResponse.json(
      { error: "Unable to answer right now" },
      { status: 500 },
    );
  }
}
