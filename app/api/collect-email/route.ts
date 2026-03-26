import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function buildReportEmail(analysis: Record<string, any>, unlockTier: number) {
  const strengths = Array.isArray(analysis.strengths) ? analysis.strengths : [];
  const citations = Array.isArray(analysis.citations) ? analysis.citations : [];
  const premiumTips = Array.isArray(analysis.premium_tips)
    ? analysis.premium_tips
    : [];

  const title =
    unlockTier >= 2 ? "Your full Soundarya report" : "Your Soundarya summary";

  const html = `
    <div style="font-family: Georgia, serif; background:#120d09; color:#f6ead9; padding:32px;">
      <div style="max-width:640px; margin:0 auto; border:1px solid rgba(201,169,110,0.25); padding:32px; background:rgba(255,255,255,0.02);">
        <p style="letter-spacing:0.24em; text-transform:uppercase; font-size:11px; color:#c9a96e;">Soundarya</p>
        <h1 style="font-size:36px; font-weight:400; margin:12px 0 8px;">${title}</h1>
        <p style="font-size:18px; margin:0 0 24px;">Score ${Number(analysis.overall_score).toFixed(1)} · ${analysis.category}</p>
        <p style="line-height:1.8; color:#ddcdb5;">${analysis.summary}</p>
        <h2 style="font-size:22px; font-weight:400; margin-top:28px;">Top strengths</h2>
        <ul style="padding-left:18px; color:#ddcdb5;">
          ${strengths.slice(0, 3).map((item: string) => `<li style="margin:8px 0;">${item}</li>`).join("")}
        </ul>
        <p style="margin-top:24px; color:#ddcdb5;"><strong>Free tip:</strong> ${analysis.free_tip}</p>
        ${
          unlockTier >= 2
            ? `
              <h2 style="font-size:22px; font-weight:400; margin-top:28px;">Premium insights</h2>
              <ul style="padding-left:18px; color:#ddcdb5;">
                ${premiumTips.slice(0, 8).map((item: string) => `<li style="margin:8px 0;">${item}</li>`).join("")}
              </ul>
              ${
                citations.length
                  ? `<h3 style="font-size:16px; font-weight:400; margin-top:28px; color:#c9a96e;">Research citations</h3>
                     <ul style="padding-left:18px; color:#b89b72;">${citations.map((item: string) => `<li style="margin:6px 0;">${item}</li>`).join("")}</ul>`
                  : ""
              }
            `
            : `
              <p style="margin-top:28px; color:#ddcdb5;">Unlock Premium to receive all nine dimensions, your weaknesses, named citations, and personalised next steps.</p>
            `
        }
      </div>
    </div>
  `;

  return { title, html };
}

async function sendViaResend(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) return false;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || "hello@soundarya.ai",
      to: [to],
      subject,
      html,
    }),
  });

  return response.ok;
}

export async function POST(request: NextRequest) {
  try {
    const { analysisId, email } = await request.json();

    if (!analysisId || !email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "A valid analysisId and email are required" },
        { status: 400 },
      );
    }

    const { data: analysis, error: analysisError } = await supabaseAdmin
      .from("analyses")
      .update({ user_email: email })
      .eq("id", analysisId)
      .select("*")
      .single();

    if (analysisError || !analysis) {
      return NextResponse.json(
        { error: "Analysis not found" },
        { status: 404 },
      );
    }

    const unlockTier = Number(analysis.unlock_tier ?? 0);
    const emailPayload = buildReportEmail(analysis, unlockTier);
    const sent = await sendViaResend(email, emailPayload.title, emailPayload.html);

    if (sent) {
      await supabaseAdmin
        .from("analyses")
        .update({ email_sent_at: new Date().toISOString() })
        .eq("id", analysisId);
    }

    return NextResponse.json({ success: true, sent });
  } catch (error) {
    console.error("Collect email route error:", error);
    return NextResponse.json(
      { error: "Unable to collect email" },
      { status: 500 },
    );
  }
}
