-- Fitness AI assessments + gamification foundation

CREATE TABLE IF NOT EXISTS fitness_assessments (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id               UUID NOT NULL REFERENCES athlete_profiles(id) ON DELETE CASCADE,
  exercise_type            VARCHAR(80) NOT NULL,
  rep_count                INTEGER DEFAULT 0,
  form_score               DECIMAL(6,2),
  key_metrics              JSONB DEFAULT '{}'::jsonb,
  video_processing_status  VARCHAR(20) NOT NULL DEFAULT 'uploaded'
                           CHECK (video_processing_status IN ('uploaded','queued','processing','completed','failed')),
  video_temp_path          TEXT,
  processor_job_id         VARCHAR(120),
  error                    TEXT,
  processed_at             TIMESTAMP,
  created_at               TIMESTAMP DEFAULT NOW(),
  updated_at               TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fitness_assessments_athlete_created
  ON fitness_assessments(athlete_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fitness_assessments_status
  ON fitness_assessments(video_processing_status, created_at DESC);

CREATE TABLE IF NOT EXISTS challenges (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title          VARCHAR(255) NOT NULL,
  description    TEXT,
  type           VARCHAR(20) NOT NULL CHECK (type IN ('daily','weekly','custom')),
  exercise_type  VARCHAR(80),
  target         JSONB DEFAULT '{}'::jsonb,
  start_date     TIMESTAMP,
  end_date       TIMESTAMP,
  created_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  is_active      BOOLEAN DEFAULT true,
  image_url      VARCHAR(500),
  rewards        JSONB DEFAULT '{}'::jsonb,
  created_at     TIMESTAMP DEFAULT NOW(),
  updated_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS challenge_progress (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id           UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id                UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_progress       JSONB DEFAULT '{}'::jsonb,
  completion_percentage  DECIMAL(5,2) DEFAULT 0,
  last_updated           TIMESTAMP DEFAULT NOW(),
  is_completed           BOOLEAN DEFAULT false,
  completed_at           TIMESTAMP,
  UNIQUE(challenge_id, user_id)
);

CREATE TABLE IF NOT EXISTS leaderboards (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type           VARCHAR(40) NOT NULL,
  exercise_type  VARCHAR(80),
  metric         VARCHAR(80) NOT NULL,
  period         VARCHAR(20) NOT NULL CHECK (period IN ('daily','weekly','monthly','all_time')),
  entries        JSONB DEFAULT '[]'::jsonb,
  rewards        JSONB DEFAULT '{}'::jsonb,
  updated_at     TIMESTAMP DEFAULT NOW(),
  created_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS achievements (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(120) NOT NULL,
  description    TEXT,
  type           VARCHAR(30) NOT NULL CHECK (type IN ('streak','total','personal_record','challenge')),
  criteria       JSONB DEFAULT '{}'::jsonb,
  icon_name      VARCHAR(120),
  points         INTEGER DEFAULT 0,
  rarity         VARCHAR(20) DEFAULT 'common',
  created_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id  UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at     TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_challenges_active ON challenges(is_active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_progress_user ON challenge_progress(user_id, last_updated DESC);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id, unlocked_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboards_unique_key
  ON leaderboards(type, COALESCE(exercise_type, ''), metric, period);
