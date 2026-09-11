ALTER TABLE public.watch_parties
  ADD COLUMN IF NOT EXISTS playback_updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE public.watch_parties SET playback_updated_at = updated_at
WHERE playback_updated_at IS NULL;
