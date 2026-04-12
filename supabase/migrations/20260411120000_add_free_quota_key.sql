-- Free-tier monthly quota (3 analyses per calendar month per wallet, session, or auth user)
ALTER TABLE public.analyses
  ADD COLUMN IF NOT EXISTS free_quota_key TEXT;

CREATE INDEX IF NOT EXISTS idx_analyses_free_quota_created
  ON public.analyses (free_quota_key, created_at DESC);
