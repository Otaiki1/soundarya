-- Soundarya Database Schema
-- Execute this in Supabase SQL Editor
-- This creates all required tables, indexes, triggers, and row-level security policies

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
  premium_hook      TEXT,
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

-- Indexes for performance
CREATE INDEX idx_analyses_overall_score ON public.analyses(overall_score DESC);
CREATE INDEX idx_analyses_country ON public.analyses(country_code);
CREATE INDEX idx_analyses_created_at ON public.analyses(created_at DESC);
CREATE INDEX idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX idx_analyses_session ON public.analyses(session_id);
CREATE INDEX idx_analyses_ip_hash ON public.analyses(ip_hash, created_at DESC);
CREATE UNIQUE INDEX idx_analyses_challenge_token ON public.analyses(challenge_token)
  WHERE challenge_token IS NOT NULL;

-- ── LEADERBOARD (materialized view, refreshed every 5 min) ───────────────────
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

-- Analyses: users can read their own; anonymous can read by session via service role
CREATE POLICY "analyses_select_own" ON public.analyses
  FOR SELECT USING (auth.uid() = user_id);

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
