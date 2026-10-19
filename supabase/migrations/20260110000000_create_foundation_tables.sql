-- Unshakable Foundations: Free Islamic Learning Platform
-- Creates tables for categories, videos, exams, and progress tracking

-- ============================================
-- 1. Foundation Categories
-- ============================================
CREATE TABLE IF NOT EXISTS foundation_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  arabic_name TEXT,
  description TEXT,
  icon TEXT, -- Lucide icon name
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_coming_soon BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE foundation_categories ENABLE ROW LEVEL SECURITY;

-- Public read access for categories
CREATE POLICY "Anyone can view active categories"
  ON foundation_categories FOR SELECT
  USING (is_active = true);

-- Admin can manage categories
CREATE POLICY "Admins can manage categories"
  ON foundation_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- ============================================
-- 2. Foundation Videos
-- ============================================
CREATE TABLE IF NOT EXISTS foundation_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES foundation_categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  video_id TEXT, -- YouTube video ID for thumbnail
  thumbnail_url TEXT,
  duration_minutes INTEGER,
  transcript TEXT,
  transcript_source TEXT CHECK (transcript_source IN ('youtube_auto', 'manual')),
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE foundation_videos ENABLE ROW LEVEL SECURITY;

-- Public read access for videos
CREATE POLICY "Anyone can view active videos"
  ON foundation_videos FOR SELECT
  USING (is_active = true);

-- Admin can manage videos
CREATE POLICY "Admins can manage videos"
  ON foundation_videos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- Index for faster category lookups
CREATE INDEX idx_foundation_videos_category ON foundation_videos(category_id);

-- ============================================
-- 3. Foundation Exams
-- ============================================
CREATE TABLE IF NOT EXISTS foundation_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES foundation_videos(id) ON DELETE CASCADE,
  questions JSONB NOT NULL DEFAULT '[]',
  -- questions structure: [{question, options[], correct_answer, explanation}]
  passing_score INTEGER DEFAULT 70,
  generated_by TEXT CHECK (generated_by IN ('ai', 'manual')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(video_id)
);

-- Enable RLS
ALTER TABLE foundation_exams ENABLE ROW LEVEL SECURITY;

-- Public read access for exams (questions shown during quiz)
CREATE POLICY "Anyone can view exams"
  ON foundation_exams FOR SELECT
  USING (true);

-- Admin can manage exams
CREATE POLICY "Admins can manage exams"
  ON foundation_exams FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- Index for video lookup
CREATE INDEX idx_foundation_exams_video ON foundation_exams(video_id);

-- ============================================
-- 4. Foundation Progress (User Progress Tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS foundation_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES foundation_videos(id) ON DELETE CASCADE,
  watched BOOLEAN DEFAULT false,
  watched_at TIMESTAMPTZ,
  exam_score INTEGER,
  exam_passed BOOLEAN DEFAULT false,
  exam_passed_at TIMESTAMPTZ,
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, video_id)
);

-- Enable RLS
ALTER TABLE foundation_progress ENABLE ROW LEVEL SECURITY;

-- Users can view their own progress
CREATE POLICY "Users can view own progress"
  ON foundation_progress FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own progress
CREATE POLICY "Users can insert own progress"
  ON foundation_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Users can update own progress"
  ON foundation_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can view all progress
CREATE POLICY "Admins can view all progress"
  ON foundation_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- Indexes for faster queries
CREATE INDEX idx_foundation_progress_user ON foundation_progress(user_id);
CREATE INDEX idx_foundation_progress_video ON foundation_progress(video_id);

-- ============================================
-- 5. Seed Initial Categories
-- ============================================
INSERT INTO foundation_categories (slug, name, arabic_name, description, icon, order_index, is_active, is_coming_soon) VALUES
  ('tawheed', 'Tawheed', 'التوحيد', 'Understanding who Allah is - the foundation of everything. Know your Creator before anything else.', 'Sun', 1, true, false),
  ('how-to-pray', 'How to Pray', 'كيفية الصلاة', 'Learn the physical movements and words of the five daily prayers.', 'Moon', 2, true, false),
  ('comparative-religion', 'Comparative Religion', 'مقارنة الأديان', 'Understanding Islam in context - for those coming from other faiths or no faith.', 'BookOpen', 3, true, true),
  ('history-of-islam', 'History of Islam', 'تاريخ الإسلام', 'The prophets, companions, and the golden age of Islamic civilization.', 'History', 4, true, true),
  ('names-of-allah', '99 Names of Allah', 'أسماء الله الحسنى', 'Learn the beautiful names and attributes of your Creator.', 'Star', 5, true, true),
  ('fiqh-basics', 'Fiqh Basics', 'أساسيات الفقه', 'The five pillars, wudu, fasting, and essential rulings.', 'Scale', 6, true, true),
  ('arabic-foundations', 'Arabic Foundations', 'أساسيات العربية', 'Basic Arabic to help you connect with the Quran directly.', 'Languages', 7, true, true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 6. Helper function to get category progress
-- ============================================
CREATE OR REPLACE FUNCTION get_category_progress(p_user_id UUID, p_category_id UUID)
RETURNS TABLE (
  total_videos INTEGER,
  watched_videos INTEGER,
  passed_exams INTEGER,
  progress_percent INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(fv.id)::INTEGER as total_videos,
    COUNT(fp.id) FILTER (WHERE fp.watched = true)::INTEGER as watched_videos,
    COUNT(fp.id) FILTER (WHERE fp.exam_passed = true)::INTEGER as passed_exams,
    CASE
      WHEN COUNT(fv.id) = 0 THEN 0
      ELSE (COUNT(fp.id) FILTER (WHERE fp.exam_passed = true) * 100 / COUNT(fv.id))::INTEGER
    END as progress_percent
  FROM foundation_videos fv
  LEFT JOIN foundation_progress fp ON fp.video_id = fv.id AND fp.user_id = p_user_id
  WHERE fv.category_id = p_category_id AND fv.is_active = true;
END;
$$;
