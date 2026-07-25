-- Supabase Production Schema & Row Level Security (RLS) policies for ScoutX

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.applications CASCADE;
DROP TABLE IF EXISTS public.opportunities CASCADE;
DROP TABLE IF EXISTS public.career_entries CASCADE;
DROP TABLE IF EXISTS public.club_profiles CASCADE;
DROP TABLE IF EXISTS public.athlete_profiles CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.follows CASCADE;

-- Enable uuid-ossp
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Public Users Table (mirrors auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('athlete','club','scout','admin')),
  is_verified BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Athlete Profiles
CREATE TABLE public.athlete_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  sport VARCHAR(50) DEFAULT 'football',
  position VARCHAR(100),
  city VARCHAR(100),
  state VARCHAR(100),
  date_of_birth DATE,
  age_verified BOOLEAN DEFAULT false,
  gender VARCHAR(20) CHECK (gender IN ('male','female','other')),
  preferred_foot VARCHAR(10) CHECK (preferred_foot IN ('left','right','both')),
  height_cm INTEGER,
  weight_kg INTEGER,
  bio TEXT,
  headline VARCHAR(255),
  strengths TEXT,
  avatar_url VARCHAR(500),
  is_open BOOLEAN DEFAULT false,
  fitness_score INTEGER DEFAULT 0,
  total_matches INTEGER DEFAULT 0,
  total_goals INTEGER DEFAULT 0,
  total_assists INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.athlete_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Club Profiles
CREATE TABLE public.club_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  club_name VARCHAR(255) NOT NULL,
  league VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  founded_year INTEGER,
  logo_url VARCHAR(500),
  bio TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.club_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Career Entries
CREATE TABLE public.career_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES public.athlete_profiles(id) ON DELETE CASCADE,
  club_name VARCHAR(255) NOT NULL,
  role VARCHAR(100),
  competition VARCHAR(255),
  start_date DATE NOT NULL,
  end_date DATE,
  matches INTEGER DEFAULT 0,
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  clean_sheets INTEGER DEFAULT 0,
  pass_accuracy DECIMAL(5,2),
  avg_rating DECIMAL(3,2),
  is_verified BOOLEAN DEFAULT false,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.career_entries ENABLE ROW LEVEL SECURITY;

-- 5. Opportunities
CREATE TABLE public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES public.club_profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  position VARCHAR(100),
  contract_type VARCHAR(50),
  trial_date DATE,
  venue VARCHAR(255),
  description TEXT,
  min_fitness INTEGER,
  max_age INTEGER,
  min_height_cm INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  expires_at DATE
);

ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

-- 6. Applications
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE,
  athlete_id UUID REFERENCES public.athlete_profiles(id) ON DELETE CASCADE,
  status VARCHAR(30) DEFAULT 'applied' CHECK (status IN ('applied','reviewing','invited','rejected','signed')),
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(opportunity_id, athlete_id)
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- 7. Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  receiver_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 8. Feed Posts
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_url VARCHAR(500),
  media_type VARCHAR(50) CHECK (media_type IN ('image','video','carousel')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- 9. Feed Reactions
CREATE TABLE public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- 10. Feed Comments
CREATE TABLE public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;


-- =========================================================================
-- AUTOMATIC PROFILE SETUP TRIGGER ON SIGNUP
-- =========================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role VARCHAR(20);
  full_name_val VARCHAR(255);
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'athlete');
  full_name_val := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);

  INSERT INTO public.users (id, email, role, onboarding_completed)
  VALUES (NEW.id, NEW.email, user_role, false);

  IF user_role = 'athlete' THEN
    INSERT INTO public.athlete_profiles (user_id, full_name)
    VALUES (NEW.id, full_name_val);
  ELSIF user_role = 'club' THEN
    INSERT INTO public.club_profiles (user_id, club_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'club_name', full_name_val));
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Public Users Policies
CREATE POLICY "Allow public read access to users table" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Allow users to update their own record" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Athlete Profiles Policies
CREATE POLICY "Allow public read access to athlete profiles" ON public.athlete_profiles
  FOR SELECT USING (true);

CREATE POLICY "Allow athletes to create their own profile" ON public.athlete_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow athletes to update their own profile" ON public.athlete_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Club Profiles Policies
CREATE POLICY "Allow public read access to club profiles" ON public.club_profiles
  FOR SELECT USING (true);

CREATE POLICY "Allow clubs to create their own profile" ON public.club_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow clubs to update their own profile" ON public.club_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Career Entries Policies
CREATE POLICY "Allow public read access to career entries" ON public.career_entries
  FOR SELECT USING (true);

CREATE POLICY "Allow athletes to modify their own career entries" ON public.career_entries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.athlete_profiles
      WHERE id = career_entries.athlete_id AND user_id = auth.uid()
    )
  );

-- Opportunities Policies
CREATE POLICY "Allow public read access to opportunities" ON public.opportunities
  FOR SELECT USING (true);

CREATE POLICY "Allow clubs to manage their own opportunities" ON public.opportunities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.club_profiles
      WHERE id = opportunities.club_id AND user_id = auth.uid()
    )
  );

-- Applications Policies
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

CREATE POLICY "Allow athletes to apply" ON public.applications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.athlete_profiles
      WHERE id = athlete_id AND user_id = auth.uid()
    )
  );

-- Messages Policies
CREATE POLICY "Allow users to view their own messages" ON public.messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Allow users to send messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Posts Policies
CREATE POLICY "Allow public read access to posts" ON public.posts
  FOR SELECT USING (true);

CREATE POLICY "Allow users to manage their own posts" ON public.posts
  FOR ALL USING (auth.uid() = user_id);

-- Feed Likes Policies
CREATE POLICY "Allow public read access to post likes" ON public.post_likes
  FOR SELECT USING (true);

CREATE POLICY "Allow users to like posts" ON public.post_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to remove their own likes" ON public.post_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Feed Comments Policies
CREATE POLICY "Allow public read access to post comments" ON public.post_comments
  FOR SELECT USING (true);

CREATE POLICY "Allow users to add comments" ON public.post_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to remove their own comments" ON public.post_comments
  FOR DELETE USING (auth.uid() = user_id);

-- 9. Follows Table
CREATE TABLE public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(follower_id, following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to follows" ON public.follows
  FOR SELECT USING (true);

CREATE POLICY "Allow users to follow others" ON public.follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Allow users to unfollow others" ON public.follows
  FOR DELETE USING (auth.uid() = follower_id);
