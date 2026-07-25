-- Rich assessment payload fields for production pipeline

ALTER TABLE fitness_assessments
  ADD COLUMN IF NOT EXISTS analysis_results JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS rep_detection_events JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS video_duration_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS remote_video_url TEXT,
  ADD COLUMN IF NOT EXISTS remote_video_public_id TEXT;
