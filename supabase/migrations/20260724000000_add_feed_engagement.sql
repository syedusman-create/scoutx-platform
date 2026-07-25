-- Feed engagement tables for cheers and comments

CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to post likes" ON public.post_likes;
CREATE POLICY "Allow public read access to post likes" ON public.post_likes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow users to like posts" ON public.post_likes;
CREATE POLICY "Allow users to like posts" ON public.post_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to remove their own likes" ON public.post_likes;
CREATE POLICY "Allow users to remove their own likes" ON public.post_likes
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow public read access to post comments" ON public.post_comments;
CREATE POLICY "Allow public read access to post comments" ON public.post_comments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow users to add comments" ON public.post_comments;
CREATE POLICY "Allow users to add comments" ON public.post_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to remove their own comments" ON public.post_comments;
CREATE POLICY "Allow users to remove their own comments" ON public.post_comments
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON public.post_likes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON public.post_comments(user_id, created_at DESC);