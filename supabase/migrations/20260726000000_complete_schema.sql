-- ============================================================================
-- ScoutX Complete Schema Reconciliation
-- Run this entire file in the Supabase SQL Editor.
-- Safe to run on existing data (uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- 2. TRIGGER FUNCTION: auto-create public user + profile on auth signup
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role VARCHAR(20);
  full_name_val VARCHAR(255);
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'athlete');
  full_name_val := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));

  INSERT INTO public.users (id, email, role, onboarding_completed)
  VALUES (NEW.id, NEW.email, user_role, false)
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        role = COALESCE(EXCLUDED.role, public.users.role);

  IF user_role = 'athlete' THEN
    INSERT INTO public.athlete_profiles (user_id, full_name)
    VALUES (NEW.id, full_name_val)
    ON CONFLICT (user_id) DO NOTHING;
  ELSIF user_role = 'club' THEN
    INSERT INTO public.club_profiles (user_id, club_name)
    VALUES (NEW.id, full_name_val)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 3. CORE TABLES
-- ============================================================================

-- 3a. users (mirrors auth.users with extras)
CREATE TABLE IF NOT EXISTS public.users (
  id                   UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email                VARCHAR(255) UNIQUE NOT NULL,
  password_hash        VARCHAR(255),                            -- nullable: used by legacy Express JWT auth
  role                 VARCHAR(20) NOT NULL CHECK (role IN ('athlete','club','scout','admin')),
  is_verified          BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at           TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at           TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3b. athlete_profiles
CREATE TABLE IF NOT EXISTS public.athlete_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  full_name       VARCHAR(255) NOT NULL,
  sport           VARCHAR(50) DEFAULT 'football',
  position        VARCHAR(100),
  city            VARCHAR(100),
  state           VARCHAR(100),
  date_of_birth   DATE,
  age_verified    BOOLEAN DEFAULT false,
  gender          VARCHAR(20) CHECK (gender IN ('male','female','other')),
  preferred_foot  VARCHAR(10) CHECK (preferred_foot IN ('left','right','both')),
  height_cm       INTEGER,
  weight_kg       INTEGER,
  bio             TEXT,
  headline        VARCHAR(255),
  strengths       TEXT,
  avatar_url      VARCHAR(500),
  is_open         BOOLEAN DEFAULT false,
  fitness_score   INTEGER DEFAULT 0,
  total_matches   INTEGER DEFAULT 0,
  total_goals     INTEGER DEFAULT 0,
  total_assists   INTEGER DEFAULT 0,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.athlete_profiles ENABLE ROW LEVEL SECURITY;

-- 3c. club_profiles
CREATE TABLE IF NOT EXISTS public.club_profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  club_name     VARCHAR(255) NOT NULL,
  league        VARCHAR(255),
  city          VARCHAR(100),
  state         VARCHAR(100),
  founded_year  INTEGER,
  logo_url      VARCHAR(500),
  bio           TEXT,
  is_verified   BOOLEAN DEFAULT false,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.club_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. CAREER & FITNESS
-- ============================================================================

-- 4a. career_entries
CREATE TABLE IF NOT EXISTS public.career_entries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id    UUID REFERENCES public.athlete_profiles(id) ON DELETE CASCADE,
  club_name     VARCHAR(255) NOT NULL,
  role          VARCHAR(100),
  competition   VARCHAR(255),
  start_date    DATE NOT NULL,
  end_date      DATE,
  matches       INTEGER DEFAULT 0,
  goals         INTEGER DEFAULT 0,
  assists       INTEGER DEFAULT 0,
  clean_sheets  INTEGER DEFAULT 0,
  pass_accuracy DECIMAL(5,2),
  avg_rating    DECIMAL(3,2),
  is_verified   BOOLEAN DEFAULT false,
  is_current    BOOLEAN DEFAULT false,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.career_entries ENABLE ROW LEVEL SECURITY;

-- 4b. fitness_tests
CREATE TABLE IF NOT EXISTS public.fitness_tests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id    UUID REFERENCES public.athlete_profiles(id) ON DELETE CASCADE,
  test_type     VARCHAR(50) NOT NULL,
  score         DECIMAL(10,3) NOT NULL,
  unit          VARCHAR(30),
  tested_at     TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  location      VARCHAR(255),
  certified_by  UUID REFERENCES public.users(id),
  notes         TEXT
);

ALTER TABLE public.fitness_tests ENABLE ROW LEVEL SECURITY;

-- 4c. fitness_assessments (AI video assessment pipeline)
CREATE TABLE IF NOT EXISTS public.fitness_assessments (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id               UUID NOT NULL REFERENCES public.athlete_profiles(id) ON DELETE CASCADE,
  exercise_type            VARCHAR(80) NOT NULL,
  rep_count                INTEGER DEFAULT 0,
  form_score               DECIMAL(6,2),
  key_metrics              JSONB DEFAULT '{}'::jsonb,
  video_processing_status  VARCHAR(20) NOT NULL DEFAULT 'uploaded'
                           CHECK (video_processing_status IN ('uploaded','queued','processing','completed','failed')),
  video_temp_path          TEXT,
  processor_job_id         VARCHAR(120),
  error                    TEXT,
  analysis_results         JSONB DEFAULT '[]'::jsonb,
  rep_detection_events     JSONB DEFAULT '[]'::jsonb,
  video_duration_seconds   INTEGER,
  remote_video_url         TEXT,
  remote_video_public_id   TEXT,
  processed_at             TIMESTAMP WITH TIME ZONE,
  created_at               TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at               TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.fitness_assessments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. SKILLS, RECOMMENDATIONS, CONNECTIONS
-- ============================================================================

-- 5a. skills_endorsements
CREATE TABLE IF NOT EXISTS public.skills_endorsements (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id    UUID REFERENCES public.athlete_profiles(id) ON DELETE CASCADE,
  skill_name    VARCHAR(100) NOT NULL,
  endorsed_by   UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(athlete_id, skill_name, endorsed_by)
);

ALTER TABLE public.skills_endorsements ENABLE ROW LEVEL SECURITY;

-- 5b. recommendations
CREATE TABLE IF NOT EXISTS public.recommendations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id    UUID REFERENCES public.athlete_profiles(id) ON DELETE CASCADE,
  author_id     UUID REFERENCES public.users(id) ON DELETE CASCADE,
  body          TEXT NOT NULL,
  is_visible    BOOLEAN DEFAULT true,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

-- 5c. connections (friend/follow connections)
CREATE TABLE IF NOT EXISTS public.connections (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id  UUID REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id   UUID REFERENCES public.users(id) ON DELETE CASCADE,
  status        VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(requester_id, receiver_id)
);

ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- 5d. follows (simple follow relationship, used by frontend)
CREATE TABLE IF NOT EXISTS public.follows (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id   UUID REFERENCES public.users(id) ON DELETE CASCADE,
  following_id  UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(follower_id, following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. OPPORTUNITIES & APPLICATIONS
-- ============================================================================

-- 6a. opportunities
CREATE TABLE IF NOT EXISTS public.opportunities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id         UUID REFERENCES public.club_profiles(id) ON DELETE CASCADE,
  title           VARCHAR(255) NOT NULL,
  position        VARCHAR(100),
  contract_type   VARCHAR(50),
  trial_date      DATE,
  venue           VARCHAR(255),
  description     TEXT,
  min_fitness     INTEGER,
  max_age         INTEGER,
  min_height_cm   INTEGER,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  expires_at      DATE
);

ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

-- 6b. applications
CREATE TABLE IF NOT EXISTS public.applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id  UUID REFERENCES public.opportunities(id) ON DELETE CASCADE,
  athlete_id      UUID REFERENCES public.athlete_profiles(id) ON DELETE CASCADE,
  status          VARCHAR(30) DEFAULT 'applied' CHECK (status IN ('applied','reviewing','invited','rejected','signed')),
  applied_at      TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(opportunity_id, athlete_id)
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- 6c. shortlists
CREATE TABLE IF NOT EXISTS public.shortlists (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id       UUID REFERENCES public.club_profiles(id) ON DELETE CASCADE,
  athlete_id    UUID REFERENCES public.athlete_profiles(id) ON DELETE CASCADE,
  stage         VARCHAR(30) DEFAULT 'applied' CHECK (stage IN ('applied','reviewing','invited','signed')),
  notes         TEXT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(club_id, athlete_id)
);

ALTER TABLE public.shortlists ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 7. FEED (POSTS, LIKES, COMMENTS)
-- ============================================================================

-- 7a. posts (NOTE: uses 'content' column, not 'body' — matches frontend Supabase queries)
CREATE TABLE IF NOT EXISTS public.posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES public.users(id) ON DELETE CASCADE,
  content       TEXT NOT NULL,
  media_url     VARCHAR(500),
  media_type    VARCHAR(50) CHECK (media_type IN ('image','video','carousel')),
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- 7b. post_likes
CREATE TABLE IF NOT EXISTS public.post_likes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id       UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- 7c. post_comments
CREATE TABLE IF NOT EXISTS public.post_comments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id       UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES public.users(id) ON DELETE CASCADE,
  comment       TEXT NOT NULL,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 8. MESSAGES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id     UUID REFERENCES public.users(id) ON DELETE SET NULL,
  receiver_id   UUID REFERENCES public.users(id) ON DELETE SET NULL,
  body          TEXT NOT NULL,
  is_read       BOOLEAN DEFAULT false,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 9. PROFILE ANALYTICS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profile_views (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id     UUID REFERENCES public.users(id) ON DELETE SET NULL,
  athlete_id    UUID REFERENCES public.athlete_profiles(id) ON DELETE CASCADE,
  viewer_role   VARCHAR(20) NOT NULL,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 10. GAMIFICATION
-- ============================================================================

-- 10a. challenges
CREATE TABLE IF NOT EXISTS public.challenges (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title          VARCHAR(255) NOT NULL,
  description    TEXT,
  type           VARCHAR(20) NOT NULL CHECK (type IN ('daily','weekly','custom')),
  exercise_type  VARCHAR(80),
  target         JSONB DEFAULT '{}'::jsonb,
  start_date     TIMESTAMP WITH TIME ZONE,
  end_date       TIMESTAMP WITH TIME ZONE,
  created_by     UUID REFERENCES public.users(id) ON DELETE SET NULL,
  is_active      BOOLEAN DEFAULT true,
  image_url      VARCHAR(500),
  rewards        JSONB DEFAULT '{}'::jsonb,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at     TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- 10b. challenge_progress
CREATE TABLE IF NOT EXISTS public.challenge_progress (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id           UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id                UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  current_progress       JSONB DEFAULT '{}'::jsonb,
  completion_percentage  DECIMAL(5,2) DEFAULT 0,
  last_updated           TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  is_completed           BOOLEAN DEFAULT false,
  completed_at           TIMESTAMP WITH TIME ZONE,
  UNIQUE(challenge_id, user_id)
);

ALTER TABLE public.challenge_progress ENABLE ROW LEVEL SECURITY;

-- 10c. leaderboards
CREATE TABLE IF NOT EXISTS public.leaderboards (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type           VARCHAR(40) NOT NULL,
  exercise_type  VARCHAR(80),
  metric         VARCHAR(80) NOT NULL,
  period         VARCHAR(20) NOT NULL CHECK (period IN ('daily','weekly','monthly','all_time')),
  entries        JSONB DEFAULT '[]'::jsonb,
  rewards        JSONB DEFAULT '{}'::jsonb,
  updated_at     TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.leaderboards ENABLE ROW LEVEL SECURITY;

-- 10d. achievements
CREATE TABLE IF NOT EXISTS public.achievements (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(120) NOT NULL,
  description    TEXT,
  type           VARCHAR(30) NOT NULL CHECK (type IN ('streak','total','personal_record','challenge')),
  criteria       JSONB DEFAULT '{}'::jsonb,
  icon_name      VARCHAR(120),
  points         INTEGER DEFAULT 0,
  rarity         VARCHAR(20) DEFAULT 'common',
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- 10e. user_achievements
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  achievement_id  UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at     TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 11. ADMIN & AUDIT
-- ============================================================================

-- 11a. audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id  UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action         VARCHAR(120) NOT NULL,
  table_name     VARCHAR(120) NOT NULL,
  row_pk         VARCHAR(120),
  before_json    JSONB,
  after_json     JSONB,
  ip             VARCHAR(120),
  user_agent     TEXT,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 12. SOCIAL INTEGRATIONS (scaffolded)
-- ============================================================================

-- 12a. social_integrations
CREATE TABLE IF NOT EXISTS public.social_integrations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES public.users(id) ON DELETE CASCADE,
  provider       VARCHAR(30) NOT NULL CHECK (provider IN ('instagram_business', 'x')),
  status         VARCHAR(20) NOT NULL DEFAULT 'disconnected' CHECK (status IN ('disconnected','connected','error')),
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at     TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, provider)
);

ALTER TABLE public.social_integrations ENABLE ROW LEVEL SECURITY;

-- 12b. social_accounts
CREATE TABLE IF NOT EXISTS public.social_accounts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id      UUID REFERENCES public.social_integrations(id) ON DELETE CASCADE,
  provider_account_id VARCHAR(255) NOT NULL,
  display_name        VARCHAR(255),
  profile_url         VARCHAR(500),
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(integration_id, provider_account_id)
);

ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;

-- 12c. social_tokens
CREATE TABLE IF NOT EXISTS public.social_tokens (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id     UUID UNIQUE REFERENCES public.social_integrations(id) ON DELETE CASCADE,
  access_token       TEXT,
  refresh_token      TEXT,
  expires_at         TIMESTAMP WITH TIME ZONE,
  scopes             TEXT,
  updated_at         TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.social_tokens ENABLE ROW LEVEL SECURITY;

-- 12d. social_posts
CREATE TABLE IF NOT EXISTS public.social_posts (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_user_id     UUID REFERENCES public.users(id) ON DELETE SET NULL,
  body               TEXT NOT NULL,
  media_url          VARCHAR(500),
  status             VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','queued','published','failed')),
  created_at         TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  scheduled_at       TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

-- 12e. social_post_deliveries
CREATE TABLE IF NOT EXISTS public.social_post_deliveries (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  social_post_id     UUID REFERENCES public.social_posts(id) ON DELETE CASCADE,
  integration_id     UUID REFERENCES public.social_integrations(id) ON DELETE CASCADE,
  provider_post_id   VARCHAR(255),
  destination_name   VARCHAR(255),
  status             VARCHAR(20) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','failed')),
  error              TEXT,
  sent_at            TIMESTAMP WITH TIME ZONE,
  created_at         TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.social_post_deliveries ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 13. INDEXES
-- ============================================================================

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver_created_at
  ON public.messages (sender_id, receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_is_read
  ON public.messages (receiver_id, is_read, created_at DESC);

-- Fitness assessments
CREATE INDEX IF NOT EXISTS idx_fitness_assessments_athlete_created
  ON public.fitness_assessments(athlete_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fitness_assessments_status
  ON public.fitness_assessments(video_processing_status, created_at DESC);

-- Challenges & progress
CREATE INDEX IF NOT EXISTS idx_challenges_active
  ON public.challenges(is_active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_progress_user
  ON public.challenge_progress(user_id, last_updated DESC);

-- Achievements
CREATE INDEX IF NOT EXISTS idx_user_achievements_user
  ON public.user_achievements(user_id, unlocked_at DESC);

-- Leaderboards unique
CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboards_unique_key
  ON public.leaderboards(type, COALESCE(exercise_type, ''), metric, period);

-- Post likes & comments
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id
  ON public.post_likes(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id
  ON public.post_likes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id
  ON public.post_comments(post_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id
  ON public.post_comments(user_id, created_at DESC);

-- Audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
  ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor
  ON public.audit_logs(actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_row
  ON public.audit_logs(table_name, row_pk, created_at DESC);

-- ============================================================================
-- 14. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Helper: drop existing policy then recreate
DO $$ BEGIN
  -- Users
  DROP POLICY IF EXISTS "Allow public read access to users table" ON public.users;
  CREATE POLICY "Allow public read access to users table" ON public.users
    FOR SELECT USING (true);

  DROP POLICY IF EXISTS "Allow users to update their own record" ON public.users;
  CREATE POLICY "Allow users to update their own record" ON public.users
    FOR UPDATE USING (auth.uid() = id);

  -- Athlete profiles
  DROP POLICY IF EXISTS "Allow public read access to athlete profiles" ON public.athlete_profiles;
  CREATE POLICY "Allow public read access to athlete profiles" ON public.athlete_profiles
    FOR SELECT USING (true);

  DROP POLICY IF EXISTS "Allow athletes to create their own profile" ON public.athlete_profiles;
  CREATE POLICY "Allow athletes to create their own profile" ON public.athlete_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Allow athletes to update their own profile" ON public.athlete_profiles;
  CREATE POLICY "Allow athletes to update their own profile" ON public.athlete_profiles
    FOR UPDATE USING (auth.uid() = user_id);

  -- Club profiles
  DROP POLICY IF EXISTS "Allow public read access to club profiles" ON public.club_profiles;
  CREATE POLICY "Allow public read access to club profiles" ON public.club_profiles
    FOR SELECT USING (true);

  DROP POLICY IF EXISTS "Allow clubs to create their own profile" ON public.club_profiles;
  CREATE POLICY "Allow clubs to create their own profile" ON public.club_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Allow clubs to update their own profile" ON public.club_profiles;
  CREATE POLICY "Allow clubs to update their own profile" ON public.club_profiles
    FOR UPDATE USING (auth.uid() = user_id);

  -- Career entries
  DROP POLICY IF EXISTS "Allow public read access to career entries" ON public.career_entries;
  CREATE POLICY "Allow public read access to career entries" ON public.career_entries
    FOR SELECT USING (true);

  DROP POLICY IF EXISTS "Allow athletes to modify their own career entries" ON public.career_entries;
  CREATE POLICY "Allow athletes to modify their own career entries" ON public.career_entries
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.athlete_profiles
        WHERE id = career_entries.athlete_id AND user_id = auth.uid()
      )
    );

  -- Opportunities
  DROP POLICY IF EXISTS "Allow public read access to opportunities" ON public.opportunities;
  CREATE POLICY "Allow public read access to opportunities" ON public.opportunities
    FOR SELECT USING (true);

  DROP POLICY IF EXISTS "Allow clubs to manage their own opportunities" ON public.opportunities;
  CREATE POLICY "Allow clubs to manage their own opportunities" ON public.opportunities
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.club_profiles
        WHERE id = opportunities.club_id AND user_id = auth.uid()
      )
    );

  -- Applications
  DROP POLICY IF EXISTS "Allow clubs and applicants to view applications" ON public.applications;
  CREATE POLICY "Allow clubs and applicants to view applications" ON public.applications
    FOR SELECT USING (
      auth.uid() IN (
        SELECT user_id FROM public.athlete_profiles WHERE id = applications.athlete_id
        UNION
        SELECT cp.user_id FROM public.opportunities o
        JOIN public.club_profiles cp ON cp.id = o.club_id
        WHERE o.id = applications.opportunity_id
      )
    );

  DROP POLICY IF EXISTS "Allow athletes to apply" ON public.applications;
  CREATE POLICY "Allow athletes to apply" ON public.applications
    FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.athlete_profiles
        WHERE id = athlete_id AND user_id = auth.uid()
      )
    );

  -- Messages
  DROP POLICY IF EXISTS "Allow users to view their own messages" ON public.messages;
  CREATE POLICY "Allow users to view their own messages" ON public.messages
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

  DROP POLICY IF EXISTS "Allow users to send messages" ON public.messages;
  CREATE POLICY "Allow users to send messages" ON public.messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

  DROP POLICY IF EXISTS "Allow users to mark messages as read" ON public.messages;
  CREATE POLICY "Allow users to mark messages as read" ON public.messages
    FOR UPDATE USING (auth.uid() = receiver_id);

  -- Posts
  DROP POLICY IF EXISTS "Allow public read access to posts" ON public.posts;
  CREATE POLICY "Allow public read access to posts" ON public.posts
    FOR SELECT USING (true);

  DROP POLICY IF EXISTS "Allow users to manage their own posts" ON public.posts;
  CREATE POLICY "Allow users to manage their own posts" ON public.posts
    FOR ALL USING (auth.uid() = user_id);

  -- Post likes
  DROP POLICY IF EXISTS "Allow public read access to post likes" ON public.post_likes;
  CREATE POLICY "Allow public read access to post likes" ON public.post_likes
    FOR SELECT USING (true);

  DROP POLICY IF EXISTS "Allow users to like posts" ON public.post_likes;
  CREATE POLICY "Allow users to like posts" ON public.post_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Allow users to remove their own likes" ON public.post_likes;
  CREATE POLICY "Allow users to remove their own likes" ON public.post_likes
    FOR DELETE USING (auth.uid() = user_id);

  -- Post comments
  DROP POLICY IF EXISTS "Allow public read access to post comments" ON public.post_comments;
  CREATE POLICY "Allow public read access to post comments" ON public.post_comments
    FOR SELECT USING (true);

  DROP POLICY IF EXISTS "Allow users to add comments" ON public.post_comments;
  CREATE POLICY "Allow users to add comments" ON public.post_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Allow users to remove their own comments" ON public.post_comments;
  CREATE POLICY "Allow users to remove their own comments" ON public.post_comments
    FOR DELETE USING (auth.uid() = user_id);

  -- Follows
  DROP POLICY IF EXISTS "Allow public read access to follows" ON public.follows;
  CREATE POLICY "Allow public read access to follows" ON public.follows
    FOR SELECT USING (true);

  DROP POLICY IF EXISTS "Allow users to follow others" ON public.follows;
  CREATE POLICY "Allow users to follow others" ON public.follows
    FOR INSERT WITH CHECK (auth.uid() = follower_id);

  DROP POLICY IF EXISTS "Allow users to unfollow others" ON public.follows;
  CREATE POLICY "Allow users to unfollow others" ON public.follows
    FOR DELETE USING (auth.uid() = follower_id);

  -- Profile views (insert only, no public read)
  DROP POLICY IF EXISTS "Allow users to insert profile views" ON public.profile_views;
  CREATE POLICY "Allow users to insert profile views" ON public.profile_views
    FOR INSERT WITH CHECK (true);

  -- Shortlists
  DROP POLICY IF EXISTS "Allow clubs to manage their own shortlists" ON public.shortlists;
  CREATE POLICY "Allow clubs to manage their own shortlists" ON public.shortlists
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.club_profiles
        WHERE id = shortlists.club_id AND user_id = auth.uid()
      )
    );

  -- Challenges
  DROP POLICY IF EXISTS "Allow all authenticated users to view challenges" ON public.challenges;
  CREATE POLICY "Allow all authenticated users to view challenges" ON public.challenges
    FOR SELECT USING (true);

  DROP POLICY IF EXISTS "Allow admins to manage challenges" ON public.challenges;
  CREATE POLICY "Allow admins to manage challenges" ON public.challenges
    FOR ALL USING (
      EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

  -- Challenge progress
  DROP POLICY IF EXISTS "Allow users to view their own challenge progress" ON public.challenge_progress;
  CREATE POLICY "Allow users to view their own challenge progress" ON public.challenge_progress
    FOR SELECT USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Allow users to join challenges" ON public.challenge_progress;
  CREATE POLICY "Allow users to join challenges" ON public.challenge_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

  -- Achievements
  DROP POLICY IF EXISTS "Allow public read access to achievements" ON public.achievements;
  CREATE POLICY "Allow public read access to achievements" ON public.achievements
    FOR SELECT USING (true);

  DROP POLICY IF EXISTS "Allow users to view their own unlocked achievements" ON public.user_achievements;
  CREATE POLICY "Allow users to view their own unlocked achievements" ON public.user_achievements
    FOR SELECT USING (auth.uid() = user_id);

  -- Audit logs (admin-only access is enforced via Express API; keep fully restricted via RLS)
  DROP POLICY IF EXISTS "Allow service role full access to audit logs" ON public.audit_logs;
  CREATE POLICY "Allow service role full access to audit logs" ON public.audit_logs
    FOR ALL USING (true);
END $$;

-- ============================================================================
-- 15. ADD MISSING COLUMNS TO EXISTING TABLES (safe for re-runs)
-- ============================================================================

-- Add password_hash to users if missing (nullable, for backend legacy JWT compat)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Add onboarding_completed if missing
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Ensure athlete_profiles has gender and strengths
ALTER TABLE public.athlete_profiles
  ADD COLUMN IF NOT EXISTS gender VARCHAR(20) CHECK (gender IN ('male','female','other')),
  ADD COLUMN IF NOT EXISTS strengths TEXT;

-- Ensure posts has content column (may exist already)
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS content TEXT,
  ADD COLUMN IF NOT EXISTS media_type VARCHAR(50) CHECK (media_type IN ('image','video','carousel'));

-- Ensure fitness_assessments has rich payload columns
ALTER TABLE public.fitness_assessments
  ADD COLUMN IF NOT EXISTS analysis_results JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS rep_detection_events JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS video_duration_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS remote_video_url TEXT,
  ADD COLUMN IF NOT EXISTS remote_video_public_id TEXT;

-- ============================================================================
-- 16. DATA MIGRATION: if posts.body exists but content is empty, copy data over
-- ============================================================================
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'body'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'content'
  ) THEN
    UPDATE public.posts SET content = body WHERE content IS NULL AND body IS NOT NULL;
  END IF;
END $$;

-- Add updated_at trigger support
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables that have updated_at column
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_users_updated_at') THEN
    CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON public.users
      FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_fitness_assessments_updated_at') THEN
    CREATE TRIGGER set_fitness_assessments_updated_at BEFORE UPDATE ON public.fitness_assessments
      FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_challenges_updated_at') THEN
    CREATE TRIGGER set_challenges_updated_at BEFORE UPDATE ON public.challenges
      FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_social_integrations_updated_at') THEN
    CREATE TRIGGER set_social_integrations_updated_at BEFORE UPDATE ON public.social_integrations
      FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
  END IF;
END $$;
