-- Fix: allow clubs to update application status (pipeline stage changes)
-- Run this in your Supabase SQL Editor

DROP POLICY IF EXISTS "Allow clubs to update application status" ON public.applications;
CREATE POLICY "Allow clubs to update application status" ON public.applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.opportunities o
      JOIN public.club_profiles cp ON cp.id = o.club_id
      WHERE o.id = applications.opportunity_id
        AND cp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.opportunities o
      JOIN public.club_profiles cp ON cp.id = o.club_id
      WHERE o.id = applications.opportunity_id
        AND cp.user_id = auth.uid()
    )
  );
