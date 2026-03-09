import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

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

  // Check if Supabase is configured
  checks.supabase_configured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !!process.env.SUPABASE_SERVICE_ROLE_KEY

  // Grok check (separate from database)
  checks.grok_configured = !!process.env.GROK_API_KEY

  // Overall status
  const allOk = checks.database && checks.supabase_configured
  const statusCode = allOk ? 200 : 503

  return NextResponse.json(checks, { status: statusCode })
}
