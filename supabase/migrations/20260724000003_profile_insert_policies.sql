-- Allow client-side onboarding to create the user's own profile rows

DROP POLICY IF EXISTS "Allow athletes to create their own profile" ON public.athlete_profiles;
CREATE POLICY "Allow athletes to create their own profile"
  ON public.athlete_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow clubs to create their own profile" ON public.club_profiles;
CREATE POLICY "Allow clubs to create their own profile"
  ON public.club_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
