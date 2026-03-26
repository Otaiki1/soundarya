CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

ALTER TABLE public.analyses
  ADD COLUMN IF NOT EXISTS proportionality_score INTEGER CHECK (proportionality_score BETWEEN 1 AND 100),
  ADD COLUMN IF NOT EXISTS averageness_score INTEGER CHECK (averageness_score BETWEEN 1 AND 100),
  ADD COLUMN IF NOT EXISTS neoteny_score INTEGER CHECK (neoteny_score BETWEEN 1 AND 100),
  ADD COLUMN IF NOT EXISTS adiposity_score INTEGER CHECK (adiposity_score BETWEEN 1 AND 100),
  ADD COLUMN IF NOT EXISTS face_archetype TEXT,
  ADD COLUMN IF NOT EXISTS confidence_score NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS weaknesses JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS tradeoffs JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS citations JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS improvement_predictions JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS user_email TEXT,
  ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS relayer_tx_hash TEXT,
  ADD COLUMN IF NOT EXISTS scan_hash TEXT,
  ADD COLUMN IF NOT EXISTS wallet_address TEXT,
  ADD COLUMN IF NOT EXISTS unlock_tier INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_analyses_wallet
  ON public.analyses(wallet_address);

CREATE INDEX IF NOT EXISTS idx_analyses_scan_hash
  ON public.analyses(scan_hash);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS wallet_address TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS rescan_credits INTEGER DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username
  ON public.profiles(username) WHERE username IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_wallet
  ON public.profiles(wallet_address) WHERE wallet_address IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.assistant_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  analysis_context_id UUID REFERENCES public.analyses(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.nft_mints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_id UUID REFERENCES public.analyses(id),
  wallet_address TEXT NOT NULL,
  token_id INTEGER,
  tx_hash TEXT,
  minted_at TIMESTAMPTZ DEFAULT now()
);
