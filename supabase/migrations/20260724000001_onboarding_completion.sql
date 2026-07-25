-- Explicit onboarding completion flag for ScoutX profiles

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

UPDATE public.users
SET onboarding_completed = COALESCE(onboarding_completed, false);
