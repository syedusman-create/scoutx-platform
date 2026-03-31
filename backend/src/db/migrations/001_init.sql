-- Initial schema for ScoutX (MVP)
-- TODO: Add v2 analytics tables and additional indexing.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. users
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20) NOT NULL CHECK (role IN ('athlete','club','scout','admin')),
  is_verified   BOOLEAN DEFAULT false,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- 2. athlete_profiles
CREATE TABLE athlete_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  full_name       VARCHAR(255) NOT NULL,
  sport           VARCHAR(50) DEFAULT 'football',
  position        VARCHAR(100),
  city            VARCHAR(100),
  state           VARCHAR(100),
  date_of_birth   DATE,
  age_verified    BOOLEAN DEFAULT false,
  preferred_foot  VARCHAR(10) CHECK (preferred_foot IN ('left','right','both')),
  height_cm       INTEGER,
  weight_kg       INTEGER,
  bio             TEXT,
  headline        VARCHAR(255),
  avatar_url      VARCHAR(500),
  is_open         BOOLEAN DEFAULT false,
  fitness_score   INTEGER DEFAULT 0,
  total_matches   INTEGER DEFAULT 0,
  total_goals     INTEGER DEFAULT 0,
  total_assists   INTEGER DEFAULT 0,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- 3. club_profiles
CREATE TABLE club_profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  club_name     VARCHAR(255) NOT NULL,
  league        VARCHAR(255),
  city          VARCHAR(100),
  state         VARCHAR(100),
  founded_year  INTEGER,
  logo_url      VARCHAR(500),
  bio           TEXT,
  is_verified   BOOLEAN DEFAULT false,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- 4. career_entries
CREATE TABLE career_entries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id    UUID REFERENCES athlete_profiles(id) ON DELETE CASCADE,
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
  created_at    TIMESTAMP DEFAULT NOW()
);

-- 5. fitness_tests
CREATE TABLE fitness_tests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id    UUID REFERENCES athlete_profiles(id) ON DELETE CASCADE,
  test_type     VARCHAR(50) NOT NULL,
  score         DECIMAL(10,3) NOT NULL,
  unit          VARCHAR(30),
  tested_at     TIMESTAMP DEFAULT NOW(),
  location      VARCHAR(255),
  certified_by  UUID REFERENCES users(id),
  notes         TEXT
);

-- 6. skills_endorsements
CREATE TABLE skills_endorsements (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id    UUID REFERENCES athlete_profiles(id) ON DELETE CASCADE,
  skill_name    VARCHAR(100) NOT NULL,
  endorsed_by   UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE(athlete_id, skill_name, endorsed_by)
);

-- 7. recommendations
CREATE TABLE recommendations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id    UUID REFERENCES athlete_profiles(id) ON DELETE CASCADE,
  author_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  body          TEXT NOT NULL,
  is_visible    BOOLEAN DEFAULT true,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- 8. opportunities
CREATE TABLE opportunities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id         UUID REFERENCES club_profiles(id) ON DELETE CASCADE,
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
  created_at      TIMESTAMP DEFAULT NOW(),
  expires_at      DATE
);

-- 9. applications
CREATE TABLE applications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  athlete_id    UUID REFERENCES athlete_profiles(id) ON DELETE CASCADE,
  status        VARCHAR(30) DEFAULT 'applied' CHECK (status IN ('applied','reviewing','invited','rejected','signed')),
  applied_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE(opportunity_id, athlete_id)
);

-- 10. connections
CREATE TABLE connections (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  receiver_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  status        VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  created_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE(requester_id, receiver_id)
);

-- 11. posts
CREATE TABLE posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  body          TEXT,
  media_url     VARCHAR(500),
  media_type    VARCHAR(20),
  created_at    TIMESTAMP DEFAULT NOW()
);

-- 12. messages
CREATE TABLE messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  receiver_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  body          TEXT NOT NULL,
  is_read       BOOLEAN DEFAULT false,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- 13. profile_views
CREATE TABLE profile_views (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  athlete_id    UUID REFERENCES athlete_profiles(id) ON DELETE CASCADE,
  viewer_role   VARCHAR(20) NOT NULL,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- 14. shortlists
CREATE TABLE shortlists (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id       UUID REFERENCES club_profiles(id) ON DELETE CASCADE,
  athlete_id    UUID REFERENCES athlete_profiles(id) ON DELETE CASCADE,
  stage         VARCHAR(30) DEFAULT 'applied' CHECK (stage IN ('applied','reviewing','invited','signed')),
  notes         TEXT,
  created_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE(club_id, athlete_id)
);

