# SOUNDARYA — सौन्दर्य
## Full Technical Implementation Document

> **Version:** 2.0 · **Stack:** Next.js 14 · Grok API · Supabase · Stripe · Vercel  
> **Last Updated:** 2025 · **Classification:** Internal Technical Reference

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Repository Structure](#2-repository-structure)
3. [Environment & Configuration](#3-environment--configuration)
4. [Database Schema (Supabase / PostgreSQL)](#4-database-schema-supabase--postgresql)
5. [Authentication System](#5-authentication-system)
6. [File Upload & Storage Pipeline](#6-file-upload--storage-pipeline)
7. [Grok API Integration — Scoring Engine](#7-grok-api-integration--scoring-engine)
8. [Scoring Prompt Architecture](#8-scoring-prompt-architecture)
9. [API Routes — Full Reference](#9-api-routes--full-reference)
10. [Payment System (Stripe)](#10-payment-system-stripe)
11. [Score Card Image Generation](#11-score-card-image-generation)
12. [Leaderboard & Real-Time System](#12-leaderboard--real-time-system)
13. [Challenge Link System](#13-challenge-link-system)
14. [Email System (Resend)](#14-email-system-resend)
15. [Analytics & Funnel Tracking (PostHog)](#15-analytics--funnel-tracking-posthog)
16. [Security & Rate Limiting](#16-security--rate-limiting)
17. [Frontend Architecture](#17-frontend-architecture)
18. [Performance Optimisation](#18-performance-optimisation)
19. [Deployment Pipeline](#19-deployment-pipeline)
20. [Monitoring & Error Handling](#20-monitoring--error-handling)
21. [Cost Breakdown & Scaling](#21-cost-breakdown--scaling)
22. [Launch Checklist](#22-launch-checklist)

---

## 1. Architecture Overview

### 1.1 System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│    Next.js 14 App Router  ·  React Server Components            │
│    Tailwind CSS  ·  Satori (OG Images)                          │
└──────────────────────┬──────────────────────────────────────────┘
                       │  HTTPS
┌──────────────────────▼──────────────────────────────────────────┐
│                      EDGE / API LAYER                           │
│    Next.js API Routes (Edge Runtime)                            │
│    Middleware: Auth check · Rate limiting · IP geolocation      │
└──────┬───────────────┬───────────────┬────────────────┬─────────┘
       │               │               │                │
┌──────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐ ┌──────▼──────┐
│  Grok API   │ │  Supabase   │ │   Stripe   │ │Cloudflare R2│
│  (xAI)      │ │  Postgres   │ │  Payments  │ │  Storage    │
│  Vision     │ │  Auth       │ │  Webhooks  │ │  (temp)     │
│  JSON Mode  │ │  Realtime   │ │            │ │  1-hr TTL   │
└─────────────┘ └─────────────┘ └────────────┘ └─────────────┘
       │               │
┌──────▼──────┐ ┌──────▼──────┐
│   Resend    │ │   PostHog   │
│   Email     │ │  Analytics  │
└─────────────┘ └─────────────┘
```

### 1.2 Key Architectural Principles

| Principle | Implementation |
|-----------|---------------|
| **Photos never persisted** | Uploaded to R2, analysed, deleted within 1 hour via cron |
| **Single AI call per analysis** | Grok returns scores + narrative + tips in one response |
| **Two-tier API cost** | Free tier calls Grok with reduced output; paid tier calls with full 20 tips |
| **Server-side auth gating** | Premium content never sent to client without payment verification |
| **Cached paid reports** | Stored in Supabase after generation — never regenerated |
| **Edge runtime** | API routes run on Vercel Edge for global low-latency |
| **Optimistic UI** | Loading states with animated stages for perceived performance |

### 1.3 Request Flow — Free Analysis

```
User uploads photo
    │
    ▼
POST /api/analyse
    │
    ├── Rate limit check (3 per IP per 24h) → 429 if exceeded
    ├── File validation (type, size, dimensions)
    ├── Upload to Cloudflare R2 (temp key, 1hr TTL)
    ├── Call Grok Vision API (free prompt — no premiumTips)
    ├── Parse JSON response
    ├── Store result in Supabase (analyses table)
    ├── Return free fields to client
    └── Schedule R2 deletion (1hr)
```

### 1.4 Request Flow — Premium Unlock

```
User clicks "Unlock Full Report — $19"
    │
    ▼
POST /api/payment/create-session
    │
    ├── Verify analysis_id exists
    ├── Create Stripe Checkout Session
    └── Redirect to Stripe hosted checkout
          │
          ▼ (on success)
Stripe Webhook → POST /api/webhooks/stripe
    │
    ├── Verify Stripe signature
    ├── Extract analysis_id from metadata
    ├── Pull image from R2 (if still exists) OR use cached base64
    ├── Call Grok Vision API (premium prompt — full 20 tips)
    ├── Update analyses table: premium_unlocked=true, premium_tips=[]
    └── Send "Your report is ready" email via Resend
```

---

## 2. Repository Structure

```
soundarya/
├── app/
│   ├── (marketing)/
│   │   ├── page.tsx                    # Landing page
│   │   ├── leaderboard/page.tsx        # Global leaderboard
│   │   └── countries/page.tsx          # Country rankings
│   ├── (app)/
│   │   ├── analyse/[id]/page.tsx       # Result page (free + locked premium)
│   │   ├── report/[id]/page.tsx        # Full premium report (auth-gated)
│   │   ├── profile/page.tsx            # User profile + glow-up tracker
│   │   └── challenge/[token]/page.tsx  # Challenge landing page
│   ├── api/
│   │   ├── analyse/route.ts            # Main analysis endpoint
│   │   ├── analyse/[id]/route.ts       # Get analysis by ID
│   │   ├── payment/
│   │   │   ├── create-session/route.ts # Create Stripe session
│   │   │   └── portal/route.ts         # Stripe customer portal
│   │   ├── webhooks/
│   │   │   └── stripe/route.ts         # Stripe webhook handler
│   │   ├── scorecard/[id]/route.ts     # OG image generation
│   │   ├── challenge/create/route.ts   # Generate challenge link
│   │   ├── leaderboard/route.ts        # Leaderboard data
│   │   └── countries/route.ts          # Country rankings data
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── upload/
│   │   ├── DropZone.tsx
│   │   ├── LoadingStages.tsx
│   │   └── ResultModal.tsx
│   ├── results/
│   │   ├── ScoreHero.tsx
│   │   ├── DimensionBars.tsx
│   │   ├── StrengthsList.tsx
│   │   ├── LockedPaywall.tsx
│   │   └── ShareRow.tsx
│   ├── leaderboard/
│   │   ├── LeaderboardCard.tsx
│   │   └── LeaderboardRow.tsx
│   ├── scorecard/
│   │   └── ScorecardTemplate.tsx      # Satori template
│   └── ui/
│       ├── Ticker.tsx
│       ├── Counter.tsx
│       └── CountryBadge.tsx
├── lib/
│   ├── grok.ts                         # Grok API client
│   ├── supabase/
│   │   ├── client.ts                   # Browser client
│   │   ├── server.ts                   # Server client
│   │   └── admin.ts                    # Admin client (service role)
│   ├── stripe.ts                       # Stripe client
│   ├── r2.ts                           # Cloudflare R2 client
│   ├── resend.ts                       # Resend email client
│   ├── posthog.ts                      # PostHog client
│   ├── rate-limit.ts                   # Rate limiting logic
│   ├── ip-geolocation.ts               # Country detection
│   ├── scorecard.ts                    # Score card generation
│   └── prompts.ts                      # Grok prompt constants
├── middleware.ts                        # Edge middleware (auth + rate limit)
├── types/
│   ├── analysis.ts
│   ├── user.ts
│   └── grok.ts
├── hooks/
│   ├── useAnalysis.ts
│   ├── useLeaderboard.ts
│   └── useRealtime.ts
├── .env.local
├── .env.example
├── next.config.js
└── package.json
```

---

## 3. Environment & Configuration

### 3.1 `.env.local` — Full Variable Reference

```bash
# ── SUPABASE ─────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...          # Server-only, never expose

# ── GROK (xAI) ───────────────────────────────────────────────────
GROK_API_KEY=xai-xxxxxxxxxxxxxxxxxxxx
GROK_MODEL=grok-2-vision-1212
GROK_FREE_MAX_TOKENS=600
GROK_PREMIUM_MAX_TOKENS=1500

# ── CLOUDFLARE R2 ────────────────────────────────────────────────
R2_ACCOUNT_ID=xxxxxxxxxxxxxxxxxxxx
R2_ACCESS_KEY_ID=xxxxxxxxxxxxxxxxxxxx
R2_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxx
R2_BUCKET_NAME=soundarya-uploads
R2_PUBLIC_URL=https://uploads.soundarya.ai    # Custom domain on R2

# ── STRIPE ───────────────────────────────────────────────────────
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PREMIUM_PRICE_ID=price_...             # $19 one-time
STRIPE_ELITE_PRICE_ID=price_...               # $49 one-time
STRIPE_SUB_PRICE_ID=price_...                 # $9.99/month

# ── RESEND ───────────────────────────────────────────────────────
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=hello@soundarya.ai

# ── POSTHOG ──────────────────────────────────────────────────────
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# ── APP ──────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=https://soundarya.ai
NEXT_PUBLIC_APP_NAME=Soundarya
CRON_SECRET=xxxxxxxxxxxxxxxxxxxx               # For Vercel cron jobs
```

### 3.2 `next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: '10mb' },
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'uploads.soundarya.ai' },
    ],
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

---

## 4. Database Schema (Supabase / PostgreSQL)

### 4.1 Full Schema

```sql
-- ── EXTENSIONS ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ── USERS (extends Supabase auth.users) ──────────────────────────────────────
CREATE TABLE public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username        TEXT UNIQUE,
  email           TEXT,
  country_code    CHAR(2),                          -- ISO 3166-1 alpha-2
  avatar_url      TEXT,
  subscription_tier TEXT DEFAULT 'free'             -- 'free' | 'premium' | 'elite'
    CHECK (subscription_tier IN ('free', 'premium', 'elite')),
  stripe_customer_id TEXT UNIQUE,
  total_analyses  INTEGER DEFAULT 0,
  best_score      NUMERIC(3,1),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ── ANALYSES ─────────────────────────────────────────────────────────────────
CREATE TABLE public.analyses (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_id        TEXT NOT NULL,                  -- anonymous session token
  ip_hash           TEXT NOT NULL,                  -- hashed for rate limiting

  -- Scores
  overall_score     NUMERIC(3,1) NOT NULL CHECK (overall_score BETWEEN 1 AND 10),
  symmetry_score    SMALLINT CHECK (symmetry_score BETWEEN 1 AND 100),
  golden_ratio_score SMALLINT CHECK (golden_ratio_score BETWEEN 1 AND 100),
  bone_structure_score SMALLINT CHECK (bone_structure_score BETWEEN 1 AND 100),
  harmony_score     SMALLINT CHECK (harmony_score BETWEEN 1 AND 100),
  skin_score        SMALLINT CHECK (skin_score BETWEEN 1 AND 100),
  dimorphism_score  SMALLINT CHECK (dimorphism_score BETWEEN 1 AND 100),
  percentile        SMALLINT CHECK (percentile BETWEEN 1 AND 99),
  category          TEXT NOT NULL
    CHECK (category IN ('Exceptional','Very Attractive','Above Average','Average','Below Average')),

  -- AI-Generated Content
  summary           TEXT NOT NULL,
  strengths         TEXT[] NOT NULL DEFAULT '{}',
  weakest_dimension TEXT,
  free_tip          TEXT,
  premium_tips      TEXT[] DEFAULT '{}',            -- empty until paid

  -- Payment
  premium_unlocked  BOOLEAN DEFAULT FALSE,
  premium_tier      TEXT DEFAULT 'free'             -- 'free' | 'premium' | 'elite'
    CHECK (premium_tier IN ('free', 'premium', 'elite')),
  stripe_payment_id TEXT,

  -- Metadata
  country_code      CHAR(2),
  country_name      TEXT,
  r2_key            TEXT,                           -- null after deletion
  photo_deleted_at  TIMESTAMPTZ,
  shared_count      INTEGER DEFAULT 0,
  challenge_token   TEXT UNIQUE,

  -- Timestamps
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_analyses_overall_score ON public.analyses(overall_score DESC);
CREATE INDEX idx_analyses_country ON public.analyses(country_code);
CREATE INDEX idx_analyses_created_at ON public.analyses(created_at DESC);
CREATE INDEX idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX idx_analyses_session ON public.analyses(session_id);
CREATE INDEX idx_analyses_ip_hash ON public.analyses(ip_hash, created_at DESC);
CREATE UNIQUE INDEX idx_analyses_challenge_token ON public.analyses(challenge_token)
  WHERE challenge_token IS NOT NULL;

-- ── LEADERBOARD (materialised view, refreshed every 5 min) ───────────────────
CREATE MATERIALIZED VIEW public.leaderboard_daily AS
SELECT
  a.id,
  a.overall_score,
  a.percentile,
  a.country_code,
  a.country_name,
  a.category,
  p.username,
  RANK() OVER (ORDER BY a.overall_score DESC) AS global_rank,
  RANK() OVER (PARTITION BY a.country_code ORDER BY a.overall_score DESC) AS country_rank,
  a.created_at
FROM public.analyses a
LEFT JOIN public.profiles p ON a.user_id = p.id
WHERE a.created_at > now() - INTERVAL '24 hours'
  AND a.overall_score > 0
ORDER BY a.overall_score DESC
LIMIT 1000;

CREATE INDEX ON public.leaderboard_daily(overall_score DESC);
CREATE INDEX ON public.leaderboard_daily(country_code, overall_score DESC);

-- Refresh every 5 minutes
SELECT cron.schedule('refresh-leaderboard', '*/5 * * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY public.leaderboard_daily');

-- ── COUNTRY STATS ─────────────────────────────────────────────────────────────
CREATE MATERIALIZED VIEW public.country_stats AS
SELECT
  country_code,
  country_name,
  COUNT(*) AS total_analyses,
  ROUND(AVG(overall_score)::numeric, 2) AS avg_score,
  MAX(overall_score) AS top_score,
  COUNT(*) FILTER (WHERE overall_score >= 8.0) AS top_tier_count
FROM public.analyses
WHERE country_code IS NOT NULL
  AND overall_score > 0
GROUP BY country_code, country_name
HAVING COUNT(*) >= 10
ORDER BY avg_score DESC;

SELECT cron.schedule('refresh-country-stats', '0 * * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY public.country_stats');

-- ── STRIPE EVENTS (idempotency) ───────────────────────────────────────────────
CREATE TABLE public.stripe_events (
  id          TEXT PRIMARY KEY,               -- Stripe event ID
  type        TEXT NOT NULL,
  processed   BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ── EMAIL SUBSCRIPTIONS ───────────────────────────────────────────────────────
CREATE TABLE public.email_subscriptions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email           TEXT UNIQUE NOT NULL,
  analysis_id     UUID REFERENCES public.analyses(id),
  country_code    CHAR(2),
  score_at_signup NUMERIC(3,1),
  subscribed      BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_subscriptions ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only read/update their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Analyses: users can read their own; anonymous can read by session_id via service role
CREATE POLICY "analyses_select_own" ON public.analyses
  FOR SELECT USING (auth.uid() = user_id);
-- Service role bypasses RLS for API routes

-- ── TRIGGERS ─────────────────────────────────────────────────────────────────
-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER analyses_updated_at
  BEFORE UPDATE ON public.analyses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-update profile best_score when new analysis inserted
CREATE OR REPLACE FUNCTION update_profile_best_score()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    UPDATE public.profiles
    SET
      best_score = GREATEST(best_score, NEW.overall_score),
      total_analyses = total_analyses + 1
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER analyses_update_profile
  AFTER INSERT ON public.analyses
  FOR EACH ROW EXECUTE FUNCTION update_profile_best_score();
```

---

## 5. Authentication System

### 5.1 Supabase Auth Configuration

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}
```

```typescript
// lib/supabase/admin.ts — server-only, never import in client components
import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // bypasses RLS
  { auth: { autoRefreshToken: false, persistSession: false } }
)
```

### 5.2 Anonymous Session Strategy

Users don't need an account to get a free score. We use a session token stored in `localStorage` and passed as a header:

```typescript
// lib/session.ts
export function getOrCreateSessionId(): string {
  const key = 'soundarya_session'
  let sessionId = localStorage.getItem(key)
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem(key, sessionId)
  }
  return sessionId
}
```

### 5.3 Middleware — Auth + Route Protection

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { /* ... */ } }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Protect premium report routes
  if (request.nextUrl.pathname.startsWith('/report/')) {
    if (!session) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    // Check payment in DB — prevent URL guessing
    const analysisId = request.nextUrl.pathname.split('/')[2]
    const { data: analysis } = await supabase
      .from('analyses')
      .select('premium_unlocked, user_id')
      .eq('id', analysisId)
      .single()

    if (!analysis?.premium_unlocked || analysis.user_id !== session.user.id) {
      return NextResponse.redirect(new URL(`/analyse/${analysisId}`, request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/report/:path*', '/profile/:path*']
}
```

---

## 6. File Upload & Storage Pipeline

### 6.1 Cloudflare R2 Client

```typescript
// lib/r2.ts
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function uploadToR2(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  await r2.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    Metadata: {
      'upload-timestamp': Date.now().toString(),
      'ttl': '3600', // 1 hour — informational, deletion via cron
    },
  }))
  return key
}

export async function deleteFromR2(key: string): Promise<void> {
  await r2.send(new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
  }))
}
```

### 6.2 Image Validation

```typescript
// lib/image-validation.ts
import sharp from 'sharp'

const MAX_FILE_SIZE = 10 * 1024 * 1024  // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MIN_DIMENSION = 200  // pixels
const MAX_DIMENSION = 4096 // pixels

export async function validateAndProcessImage(file: File): Promise<{
  buffer: Buffer
  contentType: string
  width: number
  height: number
}> {
  if (file.size > MAX_FILE_SIZE) throw new Error('File too large. Max 10MB.')
  if (!ALLOWED_TYPES.includes(file.type)) throw new Error('Invalid file type. JPG, PNG, or WEBP only.')

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const image = sharp(buffer)
  const metadata = await image.metadata()
  const { width = 0, height = 0 } = metadata

  if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
    throw new Error(`Image too small. Minimum ${MIN_DIMENSION}×${MIN_DIMENSION}px.`)
  }

  // Resize if too large (saves Grok API cost)
  const processedBuffer = await image
    .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer()

  return {
    buffer: processedBuffer,
    contentType: 'image/jpeg',
    width: Math.min(width, 1024),
    height: Math.min(height, 1024),
  }
}
```

### 6.3 Cleanup Cron Job (Vercel Cron)

```typescript
// app/api/cron/cleanup-photos/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { deleteFromR2 } from '@/lib/r2'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find analyses with photos older than 1 hour
  const { data: toDelete } = await supabaseAdmin
    .from('analyses')
    .select('id, r2_key')
    .not('r2_key', 'is', null)
    .lt('created_at', new Date(Date.now() - 3600000).toISOString())

  if (!toDelete?.length) return NextResponse.json({ deleted: 0 })

  let deleted = 0
  for (const row of toDelete) {
    try {
      await deleteFromR2(row.r2_key)
      await supabaseAdmin
        .from('analyses')
        .update({ r2_key: null, photo_deleted_at: new Date().toISOString() })
        .eq('id', row.id)
      deleted++
    } catch (e) {
      console.error(`Failed to delete ${row.r2_key}:`, e)
    }
  }

  return NextResponse.json({ deleted })
}
```

```json
// vercel.json — cron config
{
  "crons": [
    {
      "path": "/api/cron/cleanup-photos",
      "schedule": "0 * * * *"
    }
  ]
}
```

---

## 7. Grok API Integration — Scoring Engine

### 7.1 Grok Client

```typescript
// lib/grok.ts
import { GrokAnalysisResult, GrokTier } from '@/types/grok'
import { FREE_PROMPT, PREMIUM_PROMPT } from './prompts'

const GROK_API_URL = 'https://api.x.ai/v1/chat/completions'

export async function analyseWithGrok(
  imageBase64: string,
  mimeType: string,
  tier: GrokTier = 'free'
): Promise<GrokAnalysisResult> {
  const prompt = tier === 'free' ? FREE_PROMPT : PREMIUM_PROMPT
  const maxTokens = tier === 'free'
    ? Number(process.env.GROK_FREE_MAX_TOKENS) || 600
    : Number(process.env.GROK_PREMIUM_MAX_TOKENS) || 1500

  const response = await fetch(GROK_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROK_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.GROK_MODEL || 'grok-2-vision-1212',
      max_tokens: maxTokens,
      temperature: 0.3,        // low temp = consistent scores
      response_format: { type: 'json_object' }, // forces valid JSON
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${imageBase64}` },
            },
            { type: 'text', text: prompt },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Grok API error ${response.status}: ${error}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content

  if (!content) throw new Error('Empty response from Grok')

  let parsed: GrokAnalysisResult
  try {
    parsed = JSON.parse(content)
  } catch {
    throw new Error(`Grok returned invalid JSON: ${content}`)
  }

  // Validate required fields
  if (typeof parsed.overallScore !== 'number') {
    throw new Error('Grok response missing overallScore')
  }

  // Clamp scores to valid ranges
  parsed.overallScore = Math.max(1, Math.min(10, parsed.overallScore))
  parsed.symmetryScore = Math.max(1, Math.min(100, parsed.symmetryScore || 50))
  parsed.goldenRatioScore = Math.max(1, Math.min(100, parsed.goldenRatioScore || 50))
  parsed.boneStructureScore = Math.max(1, Math.min(100, parsed.boneStructureScore || 50))
  parsed.harmonyScore = Math.max(1, Math.min(100, parsed.harmonyScore || 50))
  parsed.percentile = Math.max(1, Math.min(99, parsed.percentile || 50))

  return parsed
}
```

### 7.2 Type Definitions

```typescript
// types/grok.ts
export type GrokTier = 'free' | 'premium'

export type ScoreCategory =
  | 'Exceptional'
  | 'Very Attractive'
  | 'Above Average'
  | 'Average'
  | 'Below Average'

export interface GrokAnalysisResult {
  overallScore: number           // 1.0–10.0
  symmetryScore: number          // 1–100
  goldenRatioScore: number       // 1–100
  boneStructureScore: number     // 1–100
  harmonyScore: number           // 1–100
  skinScore: number              // 1–100
  dimorphismScore: number        // 1–100
  percentile: number             // 1–99 (top X%)
  category: ScoreCategory
  summary: string
  strengths: string[]
  weakestDimension: string
  freeTip: string
  premiumHook: string
  premiumTips?: string[]         // only present in premium tier
}
```

---

## 8. Scoring Prompt Architecture

### 8.1 Free Tier Prompt

```typescript
// lib/prompts.ts

export const FREE_PROMPT = `You are Soundarya, an elite AI facial aesthetics analyst trained on classical beauty theory, evolutionary psychology research, and modern attractiveness science.

Analyse the face in this image across 7 scientific dimensions. Respond ONLY with a valid JSON object. No preamble, no explanation, no markdown backticks.

Required JSON structure:
{
  "overallScore": <number 1.0-10.0, one decimal place>,
  "symmetryScore": <integer 1-100>,
  "goldenRatioScore": <integer 1-100>,
  "boneStructureScore": <integer 1-100>,
  "harmonyScore": <integer 1-100>,
  "skinScore": <integer 1-100>,
  "dimorphismScore": <integer 1-100>,
  "percentile": <integer 1-99, representing "top X%" — LOWER means rarer and better>,
  "category": <exactly one of: "Exceptional" | "Very Attractive" | "Above Average" | "Average" | "Below Average">,
  "summary": "<2-3 sentences: honest, specific, kind — reference actual features visible in this image>",
  "strengths": ["<specific visible strength 1>", "<specific visible strength 2>", "<specific visible strength 3>"],
  "weakestDimension": "<the single dimension with most improvement potential>",
  "freeTip": "<one concrete, actionable improvement tip specific to this person's face>",
  "premiumHook": "<one intriguing sentence hinting at the 20 detailed tips in the paid report — be specific to their face>"
}

CALIBRATION RULES (strictly follow these distributions):
- overallScore 9.0-10.0 → "Exceptional" → top 1-3% → percentile 1-3
- overallScore 8.0-8.9 → "Very Attractive" → top 5-15% → percentile 5-15
- overallScore 7.0-7.9 → "Above Average" → top 20-35% → percentile 20-35
- overallScore 5.5-6.9 → "Average" → top 40-70% → percentile 40-70
- overallScore 4.0-5.4 → "Below Average" → top 70-90% → percentile 70-90
- overallScore 1.0-3.9 → "Below Average" → percentile 90+

IMPORTANT: Most people score between 5.0 and 7.0. Score inflation destroys user trust. An honest 6.2 with clear improvement tips is more valuable than a flattering 8.0.

If no face is clearly visible: return overallScore 0.0, category "Below Average", summary "No face detected. Please upload a clear, front-facing photo with good lighting.", and empty arrays for strengths.`

export const PREMIUM_PROMPT = `${FREE_PROMPT}

ADDITIONALLY, include in your JSON response:
"premiumTips": [
  "<tip 1: specific, actionable, references their actual facial features>",
  "<tip 2>",
  ...
  "<tip 20>"
]

The 20 premium tips must cover: skincare routine (3 tips), grooming/hairline (3 tips), lighting and photography optimisation (2 tips), style and wardrobe for their face shape (2 tips), fitness/facial structure exercises (2 tips), makeup/beard styling (2 tips), sleep and lifestyle factors affecting facial appearance (2 tips), dental and smile optimisation (2 tips), and posture/presentation (2 tips). Every tip must be specific to the actual features visible in this image, not generic advice.`
```

---

## 9. API Routes — Full Reference

### 9.1 `POST /api/analyse` — Main Analysis Endpoint

```typescript
// app/api/analyse/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { analyseWithGrok } from '@/lib/grok'
import { validateAndProcessImage } from '@/lib/image-validation'
import { uploadToR2 } from '@/lib/r2'
import { checkRateLimit } from '@/lib/rate-limit'
import { getCountryFromIP } from '@/lib/ip-geolocation'

export const runtime = 'nodejs'  // sharp requires Node runtime
export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const ipHash = await hashIP(ip)
    const rateLimitResult = await checkRateLimit(ipHash)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many analyses. Try again in 24 hours.', retryAfter: rateLimitResult.retryAfter },
        { status: 429 }
      )
    }

    // 2. Parse form data
    const formData = await request.formData()
    const file = formData.get('photo') as File
    const sessionId = formData.get('sessionId') as string

    if (!file) return NextResponse.json({ error: 'No photo provided' }, { status: 400 })
    if (!sessionId) return NextResponse.json({ error: 'No session ID' }, { status: 400 })

    // 3. Validate and process image
    const { buffer, contentType } = await validateAndProcessImage(file)

    // 4. Upload to R2
    const r2Key = `uploads/${Date.now()}-${crypto.randomUUID()}.jpg`
    await uploadToR2(buffer, r2Key, contentType)

    // 5. Convert to base64 for Grok
    const base64 = buffer.toString('base64')

    // 6. Call Grok API
    const grokResult = await analyseWithGrok(base64, contentType, 'free')

    // 7. Get country from IP
    const { countryCode, countryName } = await getCountryFromIP(ip)

    // 8. Store in Supabase
    const { data: analysis, error: dbError } = await supabaseAdmin
      .from('analyses')
      .insert({
        session_id: sessionId,
        ip_hash: ipHash,
        overall_score: grokResult.overallScore,
        symmetry_score: grokResult.symmetryScore,
        golden_ratio_score: grokResult.goldenRatioScore,
        bone_structure_score: grokResult.boneStructureScore,
        harmony_score: grokResult.harmonyScore,
        skin_score: grokResult.skinScore,
        dimorphism_score: grokResult.dimorphismScore,
        percentile: grokResult.percentile,
        category: grokResult.category,
        summary: grokResult.summary,
        strengths: grokResult.strengths,
        weakest_dimension: grokResult.weakestDimension,
        free_tip: grokResult.freeTip,
        premium_hook: grokResult.premiumHook, // store for later
        country_code: countryCode,
        country_name: countryName,
        r2_key: r2Key,
      })
      .select()
      .single()

    if (dbError) throw new Error(`DB insert failed: ${dbError.message}`)

    // 9. Return free fields only
    return NextResponse.json({
      id: analysis.id,
      overallScore: grokResult.overallScore,
      symmetryScore: grokResult.symmetryScore,
      goldenRatioScore: grokResult.goldenRatioScore,
      boneStructureScore: grokResult.boneStructureScore,
      harmonyScore: grokResult.harmonyScore,
      percentile: grokResult.percentile,
      category: grokResult.category,
      summary: grokResult.summary,
      strengths: grokResult.strengths,
      freeTip: grokResult.freeTip,
      premiumHook: grokResult.premiumHook,
      countryCode,
    })
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: 'Analysis failed. Please try again.' },
      { status: 500 }
    )
  }
}

async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(ip + process.env.CRON_SECRET) // salt
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Buffer.from(hash).toString('hex').slice(0, 16)
}
```

### 9.2 `POST /api/payment/create-session`

```typescript
// app/api/payment/create-session/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase/admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  const { analysisId, tier, email } = await request.json()

  // Verify analysis exists and isn't already unlocked
  const { data: analysis } = await supabaseAdmin
    .from('analyses')
    .select('id, overall_score, premium_unlocked')
    .eq('id', analysisId)
    .single()

  if (!analysis) return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })
  if (analysis.premium_unlocked) return NextResponse.json({ error: 'Already unlocked' }, { status: 400 })

  const priceIds: Record<string, string> = {
    premium: process.env.STRIPE_PREMIUM_PRICE_ID!,
    elite: process.env.STRIPE_ELITE_PRICE_ID!,
    subscription: process.env.STRIPE_SUB_PRICE_ID!,
  }

  const priceId = priceIds[tier]
  if (!priceId) return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })

  const session = await stripe.checkout.sessions.create({
    mode: tier === 'subscription' ? 'subscription' : 'payment',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: email || undefined,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/analyse/${analysisId}?payment=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/analyse/${analysisId}?payment=cancelled`,
    metadata: {
      analysis_id: analysisId,
      tier,
    },
    allow_promotion_codes: true,
  })

  return NextResponse.json({ url: session.url })
}
```

### 9.3 `POST /api/webhooks/stripe`

```typescript
// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { analyseWithGrok } from '@/lib/grok'
import { sendPremiumReadyEmail } from '@/lib/resend'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Idempotency check
  const { data: existing } = await supabaseAdmin
    .from('stripe_events')
    .select('id')
    .eq('id', event.id)
    .single()

  if (existing) return NextResponse.json({ received: true }) // already processed

  await supabaseAdmin.from('stripe_events').insert({ id: event.id, type: event.type })

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.CheckoutSession
    const analysisId = session.metadata?.analysis_id
    const tier = session.metadata?.tier || 'premium'

    if (!analysisId) return NextResponse.json({ received: true })

    // Get the analysis to retrieve the r2_key for re-analysis
    const { data: analysis } = await supabaseAdmin
      .from('analyses')
      .select('*')
      .eq('id', analysisId)
      .single()

    if (!analysis) return NextResponse.json({ received: true })

    try {
      // Fetch image from R2 if still available
      let premiumTips: string[] = []

      if (analysis.r2_key) {
        const imageResp = await fetch(
          `${process.env.R2_PUBLIC_URL}/${analysis.r2_key}`
        )
        if (imageResp.ok) {
          const imageBuffer = Buffer.from(await imageResp.arrayBuffer())
          const base64 = imageBuffer.toString('base64')
          const premiumResult = await analyseWithGrok(base64, 'image/jpeg', 'premium')
          premiumTips = premiumResult.premiumTips || []
        }
      }

      // Update analysis with premium data
      await supabaseAdmin
        .from('analyses')
        .update({
          premium_unlocked: true,
          premium_tier: tier,
          premium_tips: premiumTips,
          stripe_payment_id: session.payment_intent as string,
        })
        .eq('id', analysisId)

      // Send confirmation email if we have one
      if (session.customer_email) {
        await sendPremiumReadyEmail(session.customer_email, analysisId, analysis.overall_score)
      }
    } catch (err) {
      console.error('Premium generation error:', err)
      // Still mark as unlocked — manual review can regenerate
      await supabaseAdmin
        .from('analyses')
        .update({ premium_unlocked: true, premium_tier: tier })
        .eq('id', analysisId)
    }
  }

  await supabaseAdmin
    .from('stripe_events')
    .update({ processed: true })
    .eq('id', event.id)

  return NextResponse.json({ received: true })
}
```

---

## 10. Payment System (Stripe)

### 10.1 Products to Create in Stripe Dashboard

```
Product 1: Soundarya Premium Report
  - Type: One-time payment
  - Price: $19.00 USD
  - Price ID: store in STRIPE_PREMIUM_PRICE_ID

Product 2: Soundarya Elite Package
  - Type: One-time payment
  - Price: $49.00 USD
  - Price ID: store in STRIPE_ELITE_PRICE_ID

Product 3: Soundarya Monthly
  - Type: Recurring subscription
  - Price: $9.99 USD / month
  - Price ID: store in STRIPE_SUB_PRICE_ID
```

### 10.2 Stripe Webhook Events to Listen For

```
checkout.session.completed      → Unlock premium content
customer.subscription.created   → Activate subscription tier
customer.subscription.deleted   → Downgrade to free
payment_intent.payment_failed   → Log, notify user
```

### 10.3 Frontend Payment Flow

```typescript
// components/results/LockedPaywall.tsx
async function handleUnlock(tier: 'premium' | 'elite' | 'subscription') {
  setLoading(true)
  try {
    const res = await fetch('/api/payment/create-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analysisId, tier, email: userEmail }),
    })
    const { url } = await res.json()
    window.location.href = url  // redirect to Stripe Checkout
  } catch {
    setError('Payment failed. Please try again.')
  } finally {
    setLoading(false)
  }
}
```

---

## 11. Score Card Image Generation

### 11.1 Satori OG Image Route

```typescript
// app/api/scorecard/[id]/route.ts
import { ImageResponse } from 'next/og'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'edge'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { data: analysis } = await supabaseAdmin
    .from('analyses')
    .select('overall_score, percentile, category, country_name, symmetry_score')
    .eq('id', params.id)
    .single()

  if (!analysis) return new Response('Not found', { status: 404 })

  const scoreColor =
    analysis.overall_score >= 8 ? '#FF3CAC' :
    analysis.overall_score >= 6.5 ? '#FFD700' : '#2B86C5'

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: 'linear-gradient(135deg, #080608 0%, #1a0a20 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Brand */}
        <div style={{ fontSize: 24, color: '#FF3CAC', letterSpacing: '0.3em', marginBottom: 20 }}>
          SOUNDARYA ✦
        </div>
        {/* Score */}
        <div style={{ fontSize: 180, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>
          {analysis.overall_score}
        </div>
        <div style={{ fontSize: 28, color: 'rgba(255,255,255,0.7)', marginTop: 8 }}>
          {analysis.category} · Top {analysis.percentile}% Globally
        </div>
        {/* Sub scores */}
        <div style={{ display: 'flex', gap: 32, marginTop: 40 }}>
          {[
            ['Symmetry', analysis.symmetry_score],
          ].map(([label, val]) => (
            <div key={String(label)} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, fontWeight: 700, color: '#FF3CAC' }}>{val}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
        {/* CTA */}
        <div style={{ marginTop: 40, fontSize: 18, color: 'rgba(255,255,255,0.4)' }}>
          soundarya.ai · Get your score
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
```

---

## 12. Leaderboard & Real-Time System

### 12.1 Leaderboard API Route

```typescript
// app/api/leaderboard/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'global'   // global | country | improved
  const countryCode = searchParams.get('country')
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)

  let query = supabaseAdmin
    .from('leaderboard_daily')
    .select('id, overall_score, percentile, category, country_code, country_name, username, global_rank, country_rank, created_at')
    .limit(limit)

  if (type === 'country' && countryCode) {
    query = query.eq('country_code', countryCode).order('country_rank')
  } else {
    query = query.order('global_rank')
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(
    { leaderboard: data, type, generatedAt: new Date().toISOString() },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60', // 5min cache
      }
    }
  )
}
```

### 12.2 Real-Time Subscription (Client)

```typescript
// hooks/useLeaderboard.ts
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useLeaderboard(type: 'global' | 'country' = 'global') {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const supabase = createClient()

  useEffect(() => {
    // Initial fetch
    fetch(`/api/leaderboard?type=${type}&limit=10`)
      .then(r => r.json())
      .then(d => setEntries(d.leaderboard))

    // Real-time updates via Supabase
    const channel = supabase
      .channel('leaderboard-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'analyses' },
        (payload) => {
          const newScore = payload.new.overall_score
          // Animate ticker if score is notable
          if (newScore >= 8.0) {
            addToTicker(payload.new)
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [type])

  return entries
}
```

---

## 13. Challenge Link System

### 13.1 Generate Challenge Token

```typescript
// app/api/challenge/create/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const { analysisId } = await request.json()

  // Generate unique challenge token
  const token = crypto.randomUUID().replace(/-/g, '').slice(0, 12)

  const { error } = await supabaseAdmin
    .from('analyses')
    .update({ challenge_token: token })
    .eq('id', analysisId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const challengeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/challenge/${token}`
  return NextResponse.json({ url: challengeUrl, token })
}
```

### 13.2 Challenge Landing Page

```typescript
// app/challenge/[token]/page.tsx
import { supabaseAdmin } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'

export async function generateMetadata({ params }: { params: { token: string } }) {
  const { data: analysis } = await supabaseAdmin
    .from('analyses')
    .select('overall_score, percentile, category')
    .eq('challenge_token', params.token)
    .single()

  if (!analysis) return {}

  return {
    title: `Someone scored ${analysis.overall_score}/10 — Can you beat them?`,
    description: `They ranked in the top ${analysis.percentile}% globally. Upload your photo to find out if you score higher.`,
    openGraph: {
      images: [`/api/scorecard/challenge/${params.token}`],
    },
  }
}

export default async function ChallengePage({ params }: { params: { token: string } }) {
  const { data: analysis } = await supabaseAdmin
    .from('analyses')
    .select('overall_score, percentile, category, country_name')
    .eq('challenge_token', params.token)
    .single()

  if (!analysis) notFound()

  return (
    <div>
      {/* Challenge banner showing opponent's score */}
      {/* Upload zone below — drives new user to get their own score */}
    </div>
  )
}
```

---

## 14. Email System (Resend)

### 14.1 Email Client

```typescript
// lib/resend.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendPremiumReadyEmail(
  email: string,
  analysisId: string,
  score: number
) {
  await resend.emails.send({
    from: `Soundarya <${process.env.RESEND_FROM_EMAIL}>`,
    to: email,
    subject: `Your full Soundarya report is ready ✦`,
    html: `
      <div style="background:#080608;color:#F0EBF8;font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 24px;">
        <h1 style="font-size:28px;color:#FF3CAC;margin-bottom:8px;">Your report is ready</h1>
        <p style="color:rgba(240,235,248,0.7);font-size:16px;line-height:1.6;">
          You scored <strong style="color:#FF3CAC">${score}/10</strong>.
          Your full 20-point personalised improvement guide is now available.
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/report/${analysisId}"
           style="display:inline-block;background:linear-gradient(135deg,#FF3CAC,#784BA0);color:#fff;padding:14px 32px;border-radius:100px;text-decoration:none;font-weight:700;margin-top:24px;">
          View Full Report →
        </a>
        <p style="color:rgba(240,235,248,0.4);font-size:12px;margin-top:40px;">
          Soundarya · सौन्दर्य · Your photo has been permanently deleted.
        </p>
      </div>
    `,
  })
}

export async function sendWelcomeEmail(email: string, score: number, analysisId: string) {
  await resend.emails.send({
    from: `Soundarya <${process.env.RESEND_FROM_EMAIL}>`,
    to: email,
    subject: `Your Soundarya score: ${score}/10 ✦`,
    html: `<!-- Welcome email template -->`,
  })
}
```

### 14.2 Email Sequence Schedule

| Day | Subject | Trigger |
|-----|---------|---------|
| 0 | "Your score is ready — you ranked top X%" | Analysis complete + email captured |
| 1 | "3 things you can do this week to improve" | Via Resend scheduled send |
| 3 | "Someone just beat your score in [country]" | Automated — check leaderboard |
| 7 | "Free re-analysis: has your score changed?" | Re-engagement with link |
| 14 | "The #1 factor holding your score back" | Personalised to weakestDimension |
| 30 | "Your monthly glow-up update" | Subscriber-only |

---

## 15. Analytics & Funnel Tracking (PostHog)

### 15.1 PostHog Initialisation

```typescript
// lib/posthog.ts
import PostHog from 'posthog-js'

export const initPostHog = () => {
  if (typeof window !== 'undefined') {
    PostHog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      capture_pageview: false, // manual
      capture_pageleave: true,
      session_recording: { maskAllInputs: true }, // privacy
    })
  }
}
```

### 15.2 Critical Events to Track

```typescript
// Track these events throughout the funnel:

posthog.capture('page_view', { page: 'landing' })
posthog.capture('photo_upload_started')
posthog.capture('photo_upload_completed', { fileType, fileSizeMB })
posthog.capture('analysis_completed', {
  overallScore,
  category,
  percentile,
  countryCode,
  analysisId,
})
posthog.capture('paywall_viewed', { analysisId, score: overallScore })
posthog.capture('payment_initiated', { tier, analysisId })
posthog.capture('payment_completed', { tier, analysisId, amount })
posthog.capture('share_clicked', { platform: 'instagram' | 'tiktok' | 'copy' })
posthog.capture('challenge_created', { analysisId })
posthog.capture('challenge_accepted', { fromToken })
posthog.capture('leaderboard_viewed', { type: 'global' | 'country' })
posthog.capture('email_captured', { source: 'analysis' | 'waitlist' })
```

### 15.3 Key Metrics Dashboard (PostHog)

Build these funnels in PostHog:

```
Funnel 1: Conversion
  Landing → Upload Started → Analysis Complete → Paywall Viewed → Payment Complete
  Target: 10%+ conversion from analysis complete to payment

Funnel 2: Viral Loop
  Analysis Complete → Share Clicked → Challenge Created → Challenge Accepted
  Target: K-factor > 0.3 (i.e. each user brings 0.3 more users)

Funnel 3: Retention
  Analysis Complete → Email Captured → Day 3 Return → Day 7 Return
  Target: 20%+ Day 7 retention
```

---

## 16. Security & Rate Limiting

### 16.1 Rate Limiting Implementation

```typescript
// lib/rate-limit.ts
import { supabaseAdmin } from './supabase/admin'

const FREE_ANALYSES_PER_DAY = 3
const WINDOW_MS = 24 * 60 * 60 * 1000 // 24 hours

export async function checkRateLimit(ipHash: string): Promise<{
  allowed: boolean
  remaining: number
  retryAfter?: number
}> {
  const windowStart = new Date(Date.now() - WINDOW_MS).toISOString()

  const { count } = await supabaseAdmin
    .from('analyses')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .gt('created_at', windowStart)

  const used = count || 0
  const remaining = Math.max(0, FREE_ANALYSES_PER_DAY - used)

  if (remaining === 0) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: WINDOW_MS,
    }
  }

  return { allowed: true, remaining: remaining - 1 }
}
```

### 16.2 Input Sanitisation

```typescript
// All user-facing text from Grok is sanitised before DB storage and rendering
import DOMPurify from 'isomorphic-dompurify'

export function sanitiseGrokText(text: string): string {
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] }) // strip all HTML
    .trim()
    .slice(0, 2000) // max length
}
```

### 16.3 Security Headers (middleware.ts)

```typescript
const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://js.stripe.com",
    "img-src 'self' data: https://uploads.soundarya.ai",
    "connect-src 'self' https://api.x.ai https://*.supabase.co",
  ].join('; '),
}
```

---

## 17. Frontend Architecture

### 17.1 Upload Flow Component

```typescript
// components/upload/DropZone.tsx
'use client'
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { getOrCreateSessionId } from '@/lib/session'
import { trackEvent } from '@/lib/posthog'

export function DropZone({ onResult }: { onResult: (data: AnalysisResult) => void }) {
  const [state, setState] = useState<'idle' | 'uploading' | 'analysing' | 'error'>('idle')
  const [progress, setProgress] = useState<LoadingStage>('detecting')

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    trackEvent('photo_upload_started')
    setState('analysing')

    const formData = new FormData()
    formData.append('photo', file)
    formData.append('sessionId', getOrCreateSessionId())

    // Animate loading stages
    const stages: LoadingStage[] = ['detecting', 'symmetry', 'ratio', 'structure', 'writing']
    let stageIndex = 0
    const interval = setInterval(() => {
      if (stageIndex < stages.length) {
        setProgress(stages[stageIndex++])
      } else {
        clearInterval(interval)
      }
    }, 800)

    try {
      const res = await fetch('/api/analyse', { method: 'POST', body: formData })

      if (res.status === 429) {
        const data = await res.json()
        setState('error')
        // Show rate limit message
        return
      }

      if (!res.ok) throw new Error('Analysis failed')

      const data = await res.json()
      trackEvent('analysis_completed', { overallScore: data.overallScore })
      onResult(data)
    } catch (err) {
      setState('error')
      trackEvent('analysis_failed')
    } finally {
      clearInterval(interval)
    }
  }, [onResult])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  })

  return (
    <div {...getRootProps()} className={`drop-zone ${isDragActive ? 'drag-active' : ''}`}>
      <input {...getInputProps()} />
      {state === 'idle' && <IdleState />}
      {state === 'analysing' && <LoadingStages currentStage={progress} />}
      {state === 'error' && <ErrorState onRetry={() => setState('idle')} />}
    </div>
  )
}
```

### 17.2 Key Page — Result Page

```typescript
// app/(app)/analyse/[id]/page.tsx
import { supabaseAdmin } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { ScoreHero } from '@/components/results/ScoreHero'
import { DimensionBars } from '@/components/results/DimensionBars'
import { LockedPaywall } from '@/components/results/LockedPaywall'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const { data } = await supabaseAdmin
    .from('analyses').select('overall_score,percentile').eq('id', params.id).single()
  return {
    title: `Your Soundarya Score: ${data?.overall_score}/10`,
    openGraph: { images: [`/api/scorecard/${params.id}`] },
  }
}

export default async function AnalysePage({ params }: { params: { id: string } }) {
  const { data: analysis } = await supabaseAdmin
    .from('analyses')
    .select(`
      id, overall_score, symmetry_score, golden_ratio_score,
      bone_structure_score, harmony_score, skin_score,
      percentile, category, summary, strengths, free_tip,
      premium_unlocked, country_name, created_at
    `)
    .eq('id', params.id)
    .single()

  if (!analysis) notFound()

  return (
    <main>
      <ScoreHero score={analysis.overall_score} category={analysis.category} percentile={analysis.percentile} />
      <DimensionBars analysis={analysis} />
      {analysis.premium_unlocked
        ? <PremiumContent analysisId={params.id} />
        : <LockedPaywall analysisId={params.id} score={analysis.overall_score} />
      }
    </main>
  )
}
```

---

## 18. Performance Optimisation

### 18.1 Caching Strategy

| Resource | Cache Strategy | TTL |
|----------|---------------|-----|
| Leaderboard API | `s-maxage=300, stale-while-revalidate=60` | 5 min |
| Country stats API | `s-maxage=3600` | 1 hour |
| Score card images | `s-maxage=86400, immutable` | 24 hours |
| Analysis result page | ISR, `revalidate=0` (dynamic) | No cache |
| Landing page | Static | Build time |

### 18.2 Image Optimisation Pipeline

```
Client → API Route → Sharp (resize to 1024px max, compress to JPEG 85%) → Grok API
```

Resizing before Grok reduces:
- API response time (~30% faster on large images)
- Token usage (Grok vision pricing is partially based on image size)
- R2 storage cost

### 18.3 Database Query Optimisation

```sql
-- Use EXPLAIN ANALYSE on slow queries
EXPLAIN ANALYSE SELECT * FROM leaderboard_daily ORDER BY global_rank LIMIT 10;

-- Partial index for active analyses (not yet deleted)
CREATE INDEX idx_analyses_active ON public.analyses(overall_score DESC)
  WHERE r2_key IS NOT NULL;

-- Covering index for rate limit checks
CREATE INDEX idx_rate_limit ON public.analyses(ip_hash, created_at)
  INCLUDE (id);
```

---

## 19. Deployment Pipeline

### 19.1 Vercel Configuration

```json
// vercel.json
{
  "framework": "nextjs",
  "regions": ["iad1", "lhr1", "sin1"],
  "crons": [
    { "path": "/api/cron/cleanup-photos", "schedule": "0 * * * *" },
    { "path": "/api/cron/refresh-leaderboard", "schedule": "*/5 * * * *" }
  ],
  "env": {
    "NEXT_PUBLIC_APP_URL": "https://soundarya.ai"
  }
}
```

### 19.2 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### 19.3 Database Migrations

```bash
# Use Supabase CLI for migrations
npx supabase init
npx supabase migration new create_analyses_table
npx supabase db push  # apply to remote
npx supabase db pull  # pull remote schema changes
```

---

## 20. Monitoring & Error Handling

### 20.1 Sentry Integration

```typescript
// lib/sentry.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
  beforeSend(event) {
    // Scrub PII
    if (event.request?.data) delete event.request.data
    return event
  },
})
```

### 20.2 Critical Alerts to Configure

```
Alert 1: Grok API error rate > 5% in 5 minutes → Slack notification
Alert 2: Stripe webhook failures > 0 → Immediate PagerDuty
Alert 3: Database connection errors → Slack + PagerDuty
Alert 4: Rate limit bypass attempts (>50 from one IP in 10 min) → Security alert
Alert 5: R2 storage exceeding 1GB → Cost alert
```

### 20.3 Health Check Endpoint

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  const checks = {
    database: false,
    grok: false,
    timestamp: new Date().toISOString(),
  }

  try {
    await supabaseAdmin.from('analyses').select('id').limit(1)
    checks.database = true
  } catch {}

  try {
    const res = await fetch('https://api.x.ai/v1/models', {
      headers: { Authorization: `Bearer ${process.env.GROK_API_KEY}` }
    })
    checks.grok = res.ok
  } catch {}

  const allOk = checks.database && checks.grok
  return NextResponse.json(checks, { status: allOk ? 200 : 503 })
}
```

---

## 21. Cost Breakdown & Scaling

### 21.1 Per-Analysis Cost Model

| Component | Free Analysis | Premium Analysis |
|-----------|--------------|-----------------|
| Grok API (vision + JSON) | ~$0.003 | ~$0.009 |
| R2 Storage (temp, 1hr) | ~$0.0001 | ~$0.0001 |
| Supabase DB write | ~$0.00001 | ~$0.00001 |
| Vercel compute | ~$0.0001 | ~$0.0001 |
| **Total per analysis** | **~$0.003** | **~$0.009** |
| Revenue per analysis | $0 | $19.00 |
| **Gross margin** | — | **99.95%** |

### 21.2 Monthly Infrastructure Costs

| Monthly Users | Analyses | Grok Cost | Infra | Total |
|--------------|----------|-----------|-------|-------|
| 1,000 | 1,500 | $4 | $20 | $24 |
| 10,000 | 15,000 | $45 | $30 | $75 |
| 50,000 | 75,000 | $225 | $80 | $305 |
| 100,000 | 150,000 | $450 | $150 | $600 |
| 500,000 | 750,000 | $2,250 | $500 | $2,750 |

### 21.3 Revenue vs. Cost at Scale

At 100,000 monthly users with 10% premium conversion:
- **Revenue:** 10,000 × $19 = $190,000/month
- **Cost:** $600/month
- **Gross Profit:** $189,400/month
- **Gross Margin:** 99.7%

---

## 22. Launch Checklist

### Pre-Launch
- [ ] All environment variables set in Vercel production
- [ ] Supabase RLS policies tested — anonymous users cannot access others' analyses
- [ ] Stripe webhook endpoint verified in Stripe dashboard
- [ ] R2 CORS settings configured for your domain
- [ ] Rate limiting tested — 3 per IP per 24h enforced
- [ ] Premium content NOT returned to client before payment verified
- [ ] Grok API key has sufficient credits
- [ ] Error monitoring (Sentry) connected
- [ ] Health check endpoint returning 200
- [ ] GDPR/privacy policy published — mention photo deletion
- [ ] Email unsubscribe links working in all emails
- [ ] Mobile responsive tested on iPhone SE, iPhone 15, Samsung S24
- [ ] Lighthouse score > 90 on mobile

### Day of Launch
- [ ] PostHog funnels configured and verified
- [ ] Stripe test mode → live mode switched
- [ ] Leaderboard materialised view populated
- [ ] Country stats materialised view populated
- [ ] Soft launch URL shared with 20 testers
- [ ] Monitor: PostHog → Grok error rate → Stripe → Supabase dashboard

### Post-Launch (Week 1)
- [ ] Check Grok error rate daily — should be <2%
- [ ] Monitor conversion funnel in PostHog daily
- [ ] Review all Stripe webhook events — no failures
- [ ] Confirm R2 photos are being deleted within 1 hour
- [ ] Read every user support email personally
- [ ] A/B test paywall headline copy on Day 3

---

*Soundarya Technical Implementation Document · v2.0 · सौन्दर्य*  
*This document covers the complete technical specification for building and launching the Soundarya platform.*
