-- Align athlete profile schema with the current web onboarding/profile UI

ALTER TABLE public.athlete_profiles
  ADD COLUMN IF NOT EXISTS gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other')),
  ADD COLUMN IF NOT EXISTS strengths TEXT;

