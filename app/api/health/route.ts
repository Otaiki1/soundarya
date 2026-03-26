import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { testGeminiAPI } from '@/lib/gemini'

export const runtime = 'edge'

export async function GET() {
  const checks: Record<string, boolean | string> = {
    timestamp: new Date().toISOString(),
  }

  // Check database connection
  try {
    const { error } = await supabaseAdmin.from('profiles').select('id').limit(1)
    checks.database = !error
    if (error) {
      checks.database_error = error.message
    }
  } catch (error) {
    checks.database = false
    checks.database_error = String(error)
  }

  // Check Supabase configuration
  checks.supabase_configured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !!process.env.SUPABASE_SERVICE_ROLE_KEY

  checks.chain_configured =
    !!process.env.NEXT_PUBLIC_SCORE_NFT_ADDRESS &&
    !!process.env.NEXT_PUBLIC_LEADERBOARD_ADDRESS &&
    !!process.env.NEXT_PUBLIC_CHAIN_ID

  checks.signers_configured =
    !!process.env.MINTER_PRIVATE_KEY &&
    !!process.env.RELAYER_PRIVATE_KEY &&
    !!process.env.BASE_RPC_URL

  checks.resend_configured = !!process.env.RESEND_API_KEY

  // Check Gemini API configuration and connectivity
  checks.gemini_configured = !!process.env.GEMINI_API_KEY

  if (checks.gemini_configured) {
    try {
      const geminiTest = await testGeminiAPI()
      checks.gemini_api = geminiTest.available
      if (!geminiTest.available) {
        checks.gemini_api_error = geminiTest.error || 'Unknown error'
      }
    } catch (error) {
      checks.gemini_api = false
      checks.gemini_api_error = String(error)
    }
  } else {
    checks.gemini_api = false
    checks.gemini_api_error = 'GEMINI_API_KEY not configured'
  }

  checks.image_storage = 'in-memory-only'

  // Overall status - all critical services must be working
  const allOk =
    checks.database &&
    checks.supabase_configured &&
    checks.gemini_api &&
    checks.chain_configured &&
    checks.signers_configured
  const statusCode = allOk ? 200 : 503

  return NextResponse.json(checks, { status: statusCode })
}
