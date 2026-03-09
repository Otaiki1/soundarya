import { createClient } from '@supabase/supabase-js'

/**
 * IMPORTANT: This client bypasses Row-Level Security (RLS).
 * NEVER import or expose this to client-side code.
 * Use only in Next.js API routes and Server Components.
 * Always validate user permissions before using this client.
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

// Type for database
export type Database = any // Will be replaced with generated types from Supabase
