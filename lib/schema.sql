-- Soundarya Database Schema
-- Execute this in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE public.profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username          TEXT UNIQUE,
  wallet_address    TEXT,
  email             TEXT,
  country_code      CHAR(2),
  avatar_url        TEXT,
  subscription_tier TEXT DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'premium', 'elite')),
  total_analyses    INTEGER DEFAULT 0,
  best_score        NUMERIC(3,1),
  rescan_credits    INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_profiles_username
  ON public.profiles(username) WHERE username IS NOT NULL;

CREATE UNIQUE INDEX idx_profiles_wallet
  ON public.profiles(wallet_address) WHERE wallet_address IS NOT NULL;

CREATE TABLE public.analyses (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_id              TEXT NOT NULL,
  ip_hash                 TEXT NOT NULL,
  overall_score           NUMERIC(3,1) NOT NULL CHECK (overall_score BETWEEN 1 AND 10),
  symmetry_score          INTEGER CHECK (symmetry_score BETWEEN 1 AND 100),
  harmony_score           INTEGER CHECK (harmony_score BETWEEN 1 AND 100),
  proportionality_score   INTEGER CHECK (proportionality_score BETWEEN 1 AND 100),
  averageness_score       INTEGER CHECK (averageness_score BETWEEN 1 AND 100),
  bone_structure_score    INTEGER CHECK (bone_structure_score BETWEEN 1 AND 100),
  skin_score              INTEGER CHECK (skin_score BETWEEN 1 AND 100),
  dimorphism_score        INTEGER CHECK (dimorphism_score BETWEEN 1 AND 100),
  neoteny_score           INTEGER CHECK (neoteny_score BETWEEN 1 AND 100),
  adiposity_score         INTEGER CHECK (adiposity_score BETWEEN 1 AND 100),
  percentile              INTEGER CHECK (percentile BETWEEN 1 AND 99),
  category                TEXT NOT NULL
    CHECK (category IN ('Exceptional','Very Attractive','Above Average','Average','Below Average')),
  face_archetype          TEXT,
  confidence_score        NUMERIC(3,2),
  summary                 TEXT NOT NULL,
  strengths               JSONB NOT NULL DEFAULT '[]'::jsonb,
  weaknesses              JSONB DEFAULT '[]'::jsonb,
  tradeoffs               JSONB DEFAULT '[]'::jsonb,
  weakest_dimension       TEXT,
  free_tip                TEXT,
  premium_tips            JSONB DEFAULT '[]'::jsonb,
  citations               JSONB DEFAULT '[]'::jsonb,
  improvement_predictions JSONB DEFAULT '[]'::jsonb,
  premium_unlocked        BOOLEAN DEFAULT FALSE,
  premium_tier            TEXT DEFAULT 'free'
    CHECK (premium_tier IN ('free', 'premium', 'elite')),
  unlock_tier             INTEGER DEFAULT 0,
  country_code            CHAR(2),
  country_name            TEXT,
  user_email              TEXT,
  email_sent_at           TIMESTAMPTZ,
  relayer_tx_hash         TEXT,
  scan_hash               TEXT,
  wallet_address          TEXT,
  photo_deleted_at        TIMESTAMPTZ,
  shared_count            INTEGER DEFAULT 0,
  challenge_token         TEXT UNIQUE,
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_analyses_overall_score ON public.analyses(overall_score DESC);
CREATE INDEX idx_analyses_country ON public.analyses(country_code);
CREATE INDEX idx_analyses_created_at ON public.analyses(created_at DESC);
CREATE INDEX idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX idx_analyses_session ON public.analyses(session_id);
CREATE INDEX idx_analyses_ip_hash ON public.analyses(ip_hash, created_at DESC);
CREATE INDEX idx_analyses_wallet ON public.analyses(wallet_address);
CREATE INDEX idx_analyses_scan_hash ON public.analyses(scan_hash);
CREATE UNIQUE INDEX idx_analyses_challenge_token ON public.analyses(challenge_token)
  WHERE challenge_token IS NOT NULL;

CREATE MATERIALIZED VIEW public.leaderboard_daily AS
SELECT
  a.id,
  a.overall_score,
  a.percentile,
  a.country_code,
  a.country_name,
  a.category,
  a.face_archetype,
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

CREATE TABLE public.email_subscriptions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email           TEXT UNIQUE NOT NULL,
  analysis_id     UUID REFERENCES public.analyses(id),
  country_code    CHAR(2),
  score_at_signup NUMERIC(3,1),
  subscribed      BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.assistant_messages (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID REFERENCES auth.users(id),
  session_id          TEXT,
  role                TEXT NOT NULL,
  content             TEXT NOT NULL,
  analysis_context_id UUID REFERENCES public.analyses(id),
  created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.nft_mints (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_id     UUID REFERENCES public.analyses(id),
  wallet_address  TEXT NOT NULL,
  token_id        INTEGER,
  tx_hash         TEXT,
  minted_at       TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistant_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_mints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "analyses_select_own" ON public.analyses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "assistant_messages_select_own" ON public.assistant_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "assistant_messages_insert_own" ON public.assistant_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER analyses_updated_at
  BEFORE UPDATE ON public.analyses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION update_profile_best_score()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    UPDATE public.profiles
    SET
      best_score = GREATEST(COALESCE(best_score, NEW.overall_score), NEW.overall_score),
      total_analyses = total_analyses + 1
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER analyses_update_profile
  AFTER INSERT ON public.analyses
  FOR EACH ROW EXECUTE FUNCTION update_profile_best_score();
