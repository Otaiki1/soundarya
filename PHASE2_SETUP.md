# Phase 2 Setup Guide: Database & Authentication

## Prerequisites

You should have completed **Phase 1** and have Supabase keys in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Step 1: Create Database Schema

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://app.supabase.com
2. Navigate to **SQL Editor** → **New Query**
3. Copy the entire contents of `lib/schema.sql`
4. Paste into the query editor
5. Click **Run** (⌘+Enter / Ctrl+Enter)

✅ **Verify**: You should see no errors and the tables will appear in the **Table Editor**

### Option B: Using Supabase CLI

```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push  # if you have migrations set up
# OR manually paste schema.sql in the SQL editor
```

## Step 2: Verify Database Tables

After running the schema, verify all tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

Expected tables:
- `profiles` ✅
- `analyses` ✅
- `leaderboard_daily` ✅
- `country_stats` ✅
- `stripe_events` ✅
- `email_subscriptions` ✅

## Step 3: Verify Row-Level Security (RLS)

In Supabase Dashboard → **Authentication** → **Policies**:

Expected policies:
- `profiles_select_own` - users can only read own profile
- `profiles_update_own` - users can only update own profile
- `analyses_select_own` - users can only read own analyses

## Step 4: Verify Triggers

In Supabase Dashboard → **SQL Editor**, run:

```sql
SELECT trigger_name, event_manipulation
FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```

Expected triggers:
- `analyses_updated_at` - auto-updates timestamp
- `profiles_updated_at` - auto-updates timestamp
- `analyses_update_profile` - syncs profile stats

## Step 5: Test Database Connection

Run this command to test the connection:

```bash
cd /Users/0t41k1/Documents/soundarya
npm run dev
```

Then in another terminal, test the connection:

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "database": true,
  "grok": false,
  "timestamp": "2026-03-09T..."
}
```

## Step 6: Enable Materialized Views Refresh

The schema includes cron jobs to refresh leaderboards every 5 minutes. To verify they're scheduled:

1. Go to Supabase Dashboard → **SQL Editor**
2. Run this query:

```sql
SELECT
    jobid,
    schedule,
    command,
    nodename
FROM cron.job
WHERE database = 'postgres';
```

You should see 2 cron jobs scheduled.

## Troubleshooting

### "Extension pg_cron not found"

Some Supabase projects don't have pg_cron enabled. Run this in SQL Editor:

```sql
CREATE EXTENSION IF NOT EXISTS "pg_cron";
```

### "UUID extension not found"

Similarly for UUID:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### RLS policies not working

Verify RLS is enabled on each table:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

All should have `rowsecurity = true`.

### Materialized views not created

If you see no `leaderboard_daily` view, check for errors in the SQL output and run again.

## Next Steps

Once database is verified:

1. ✅ Database schema created
2. ✅ RLS policies enabled
3. ✅ Triggers active
4. ✅ Materialized views scheduled

You're ready for **Phase 3: Core API Routes**

Run this to continue:

```bash
# From EXECUTION_PLAN.md, Phase 3.1+
npm run dev  # Start dev server to test API routes
```

## Files in This Phase

- ✅ `lib/supabase/client.ts` - Browser client
- ✅ `lib/supabase/server.ts` - Server client
- ✅ `lib/supabase/admin.ts` - Admin client (⚠️ never expose to client)
- ✅ `middleware.ts` - Auth and session refresh
- ✅ `lib/schema.sql` - Complete database schema
- ✅ `lib/session.ts` - Anonymous session management
- ✅ `lib/rate-limit.ts` - Rate limiting (3/day)
- ✅ `lib/ip-geolocation.ts` - Country detection

## Reference

- Supabase Docs: https://supabase.com/docs
- Soundarya Technical Doc: Section 4-5 (Database & Auth)
- Execution Plan: Section Phase 2
