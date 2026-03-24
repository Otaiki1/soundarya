import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { testOpenAIAPI } from '@/lib/openai'

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

  // Check OpenAI API configuration and connectivity
  checks.openai_configured = !!process.env.OPENAI_API_KEY

  if (checks.openai_configured) {
    try {
      const openAITest = await testOpenAIAPI()
      checks.openai_api = openAITest.available
      if (!openAITest.available) {
        checks.openai_api_error = openAITest.error || 'Unknown error'
      }
    } catch (error) {
      checks.openai_api = false
      checks.openai_api_error = String(error)
    }
  } else {
    checks.openai_api = false
    checks.openai_api_error = 'OPENAI_API_KEY not configured'
  }

  // Check R2 configuration
  checks.r2_configured =
    !!process.env.CLOUDFLARE_R2_ENDPOINT &&
    !!process.env.CLOUDFLARE_R2_ACCESS_KEY_ID &&
    !!process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY &&
    !!process.env.CLOUDFLARE_R2_BUCKET_NAME

  // Overall status - all critical services must be working
  const allOk = checks.database && checks.supabase_configured && checks.openai_api && checks.r2_configured
  const statusCode = allOk ? 200 : 503

  return NextResponse.json(checks, { status: statusCode })
}
