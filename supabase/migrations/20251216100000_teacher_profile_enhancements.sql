-- Teacher Profile Enhancements Migration
-- Adds columns for enhanced teacher profiles, testimonials, and video intros

-- =============================================
-- PART 1: Add missing columns to teacher_profiles
-- =============================================

-- Add columns for enhanced profile display (if they don't exist)
DO $$
BEGIN
  -- Specializations array
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teacher_profiles' AND column_name = 'specializations') THEN
    ALTER TABLE teacher_profiles ADD COLUMN specializations text[] DEFAULT '{}';
  END IF;

  -- Vetting badges array
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teacher_profiles' AND column_name = 'vetting_badges') THEN
    ALTER TABLE teacher_profiles ADD COLUMN vetting_badges text[] DEFAULT '{}';
  END IF;

  -- Extended bio for profile modal
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teacher_profiles' AND column_name = 'bio_extended') THEN
    ALTER TABLE teacher_profiles ADD COLUMN bio_extended text;
  END IF;

  -- Short bio for cards (max 150 chars)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teacher_profiles' AND column_name = 'bio_short') THEN
    ALTER TABLE teacher_profiles ADD COLUMN bio_short text;
  END IF;

  -- Teaching philosophy
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teacher_profiles' AND column_name = 'teaching_philosophy') THEN
    ALTER TABLE teacher_profiles ADD COLUMN teaching_philosophy text;
  END IF;

  -- Qualifications array
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teacher_profiles' AND column_name = 'qualifications') THEN
    ALTER TABLE teacher_profiles ADD COLUMN qualifications text[] DEFAULT '{}';
  END IF;

  -- Years of experience
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teacher_profiles' AND column_name = 'years_experience') THEN
    ALTER TABLE teacher_profiles ADD COLUMN years_experience integer;
  END IF;

  -- Languages spoken
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teacher_profiles' AND column_name = 'languages_spoken') THEN
    ALTER TABLE teacher_profiles ADD COLUMN languages_spoken text[] DEFAULT '{English}';
  END IF;

  -- Subjects taught
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teacher_profiles' AND column_name = 'subjects_taught') THEN
    ALTER TABLE teacher_profiles ADD COLUMN subjects_taught text[] DEFAULT '{}';
  END IF;

  -- Age groups they work with
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teacher_profiles' AND column_name = 'age_groups') THEN
    ALTER TABLE teacher_profiles ADD COLUMN age_groups text[] DEFAULT '{}';
  END IF;

  -- Gender
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teacher_profiles' AND column_name = 'gender') THEN
    ALTER TABLE teacher_profiles ADD COLUMN gender text;
  END IF;

  -- Featured teacher flag
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teacher_profiles' AND column_name = 'is_featured') THEN
    ALTER TABLE teacher_profiles ADD COLUMN is_featured boolean DEFAULT false;
  END IF;

  -- Gentleness certified (all teachers get this by default)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teacher_profiles' AND column_name = 'gentleness_certified') THEN
    ALTER TABLE teacher_profiles ADD COLUMN gentleness_certified boolean DEFAULT true;
  END IF;

  -- Can conduct diagnostic assessments
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teacher_profiles' AND column_name = 'diagnostic_enabled') THEN
    ALTER TABLE teacher_profiles ADD COLUMN diagnostic_enabled boolean DEFAULT true;
  END IF;

  -- Currently accepting students
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teacher_profiles' AND column_name = 'accepting_students') THEN
    ALTER TABLE teacher_profiles ADD COLUMN accepting_students boolean DEFAULT true;
  END IF;

  -- Profile completion status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teacher_profiles' AND column_name = 'profile_completed') THEN
    ALTER TABLE teacher_profiles ADD COLUMN profile_completed boolean DEFAULT false;
  END IF;

  -- When they joined Talbiyah
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teacher_profiles' AND column_name = 'joined_at') THEN
    ALTER TABLE teacher_profiles ADD COLUMN joined_at timestamptz DEFAULT now();
  END IF;

  -- Video intro thumbnail
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teacher_profiles' AND column_name = 'video_intro_thumbnail') THEN
    ALTER TABLE teacher_profiles ADD COLUMN video_intro_thumbnail text;
  END IF;

  -- Video intro duration in seconds
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teacher_profiles' AND column_name = 'video_intro_duration') THEN
    ALTER TABLE teacher_profiles ADD COLUMN video_intro_duration integer;
  END IF;
END $$;

-- =============================================
-- PART 2: Create teacher_testimonials table
-- =============================================

CREATE TABLE IF NOT EXISTS teacher_testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  student_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  student_name text NOT NULL,
  student_type text NOT NULL CHECK (student_type IN ('parent', 'adult_student', 'teenage_student')),
  testimonial_text text NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  lesson_count integer,
  subject text,
  verified boolean DEFAULT false,
  approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for testimonials
CREATE INDEX IF NOT EXISTS idx_teacher_testimonials_teacher ON teacher_testimonials(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_testimonials_approved ON teacher_testimonials(approved) WHERE approved = true;

-- =============================================
-- PART 3: Create teacher_video_intros table
-- =============================================

CREATE TABLE IF NOT EXISTS teacher_video_intros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  video_url text NOT NULL,
  thumbnail_url text,
  duration_seconds integer,
  transcript text,
  status text DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz DEFAULT now()
);

-- Index for video intros
CREATE INDEX IF NOT EXISTS idx_teacher_video_intros_teacher ON teacher_video_intros(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_video_intros_status ON teacher_video_intros(status);

-- =============================================
-- PART 4: RLS Policies for new tables
-- =============================================

-- Enable RLS
ALTER TABLE teacher_testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_video_intros ENABLE ROW LEVEL SECURITY;

-- Testimonials policies
DROP POLICY IF EXISTS "Anyone can view approved testimonials" ON teacher_testimonials;
CREATE POLICY "Anyone can view approved testimonials"
  ON teacher_testimonials FOR SELECT
  USING (approved = true);

DROP POLICY IF EXISTS "Teachers can view their own testimonials" ON teacher_testimonials;
CREATE POLICY "Teachers can view their own testimonials"
  ON teacher_testimonials FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teacher_profiles tp
      WHERE tp.id = teacher_testimonials.teacher_id
      AND tp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage testimonials" ON teacher_testimonials;
CREATE POLICY "Admins can manage testimonials"
  ON teacher_testimonials FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  );

DROP POLICY IF EXISTS "Students can create testimonials for their teachers" ON teacher_testimonials;
CREATE POLICY "Students can create testimonials for their teachers"
  ON teacher_testimonials FOR INSERT
  WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM lessons l
      WHERE l.teacher_id = teacher_testimonials.teacher_id
      AND l.learner_id = auth.uid()
      AND l.status = 'completed'
    )
  );

-- Video intros policies
DROP POLICY IF EXISTS "Anyone can view approved video intros" ON teacher_video_intros;
CREATE POLICY "Anyone can view approved video intros"
  ON teacher_video_intros FOR SELECT
  USING (status = 'approved');

DROP POLICY IF EXISTS "Teachers can view and manage their own video intros" ON teacher_video_intros;
CREATE POLICY "Teachers can view and manage their own video intros"
  ON teacher_video_intros FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM teacher_profiles tp
      WHERE tp.id = teacher_video_intros.teacher_id
      AND tp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage all video intros" ON teacher_video_intros;
CREATE POLICY "Admins can manage all video intros"
  ON teacher_video_intros FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- =============================================
-- PART 5: Update teacher_tier_stats view
-- =============================================

-- Drop and recreate view with additional fields
DROP VIEW IF EXISTS teacher_tier_stats;

CREATE OR REPLACE VIEW teacher_tier_stats AS
SELECT
  tp.id as teacher_id,
  tp.user_id,
  p.full_name,
  p.avatar_url,
  tp.bio,
  tp.bio_short,
  tp.bio_extended,
  tp.specializations,
  tp.vetting_badges,
  tp.teaching_philosophy,
  tp.qualifications,
  tp.years_experience,
  tp.is_featured,
  tp.gentleness_certified,
  tp.video_intro_url,
  tp.video_intro_thumbnail,
  tp.video_intro_duration,
  COALESCE(tt.tier, 'newcomer') as tier,
  COALESCE(tt.tier_name, 'Newcomer') as tier_name,
  COALESCE(tt.tier_icon, '🌱') as tier_icon,
  COALESCE(tt.teacher_hourly_rate, 5.00) as teacher_hourly_rate,
  COALESCE(tt.student_hourly_price, 15.00) as student_hourly_price,
  COALESCE(ls.completed_lessons, 0) as completed_lessons,
  COALESCE(ls.total_hours, 0) as hours_taught,
  COALESCE(ls.unique_students, 0) as students_taught,
  COALESCE(rs.retention_rate, 0) as retention_rate,
  COALESCE(r.average_rating, 0) as average_rating,
  COALESCE(r.rating_count, 0) as rating_count
FROM teacher_profiles tp
LEFT JOIN profiles p ON tp.user_id = p.id
LEFT JOIN teacher_tiers tt ON tp.tier = tt.tier
LEFT JOIN (
  SELECT
    teacher_id,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_lessons,
    COALESCE(SUM(duration_minutes) FILTER (WHERE status = 'completed') / 60.0, 0) as total_hours,
    COUNT(DISTINCT learner_id) FILTER (WHERE status = 'completed') as unique_students
  FROM lessons
  GROUP BY teacher_id
) ls ON tp.id = ls.teacher_id
LEFT JOIN (
  SELECT
    teacher_id,
    AVG(rating) as average_rating,
    COUNT(*) as rating_count
  FROM lesson_ratings
  GROUP BY teacher_id
) r ON tp.id = r.teacher_id
LEFT JOIN (
  SELECT
    teacher_id,
    retention_rate
  FROM student_retention_stats
) rs ON tp.id = rs.teacher_id
WHERE tp.status = 'approved';

-- Grant access to the view
GRANT SELECT ON teacher_tier_stats TO authenticated;
GRANT SELECT ON teacher_tier_stats TO anon;

-- =============================================
-- PART 6: Create teacher rating summary view
-- =============================================

CREATE OR REPLACE VIEW teacher_rating_summary AS
SELECT
  tp.id as teacher_id,
  COUNT(lr.id) as rating_count,
  COALESCE(AVG(lr.rating), 0) as rating_avg,
  COUNT(lf.id) as total_feedback,
  COALESCE(
    COUNT(lf.id) FILTER (WHERE lf.thumbs_up = true) * 100.0 / NULLIF(COUNT(lf.id), 0),
    0
  ) as thumbs_up_percentage
FROM teacher_profiles tp
LEFT JOIN lessons l ON tp.id = l.teacher_id AND l.status = 'completed'
LEFT JOIN lesson_ratings lr ON l.id = lr.lesson_id
LEFT JOIN lesson_feedback lf ON l.id = lf.lesson_id
GROUP BY tp.id;

GRANT SELECT ON teacher_rating_summary TO authenticated;
GRANT SELECT ON teacher_rating_summary TO anon;

-- =============================================
-- PART 7: Add helpful comments
-- =============================================

COMMENT ON COLUMN teacher_profiles.specializations IS 'Array of specialization IDs: tajweed, hifz, tafsir, arabic_beginners, etc.';
COMMENT ON COLUMN teacher_profiles.vetting_badges IS 'Array of vetting badge IDs: identity_verified, credentials_verified, ijazah_holder, etc.';
COMMENT ON COLUMN teacher_profiles.is_featured IS 'Admin-set flag to feature teacher prominently';
COMMENT ON TABLE teacher_testimonials IS 'Student testimonials for teachers, requires admin approval';
COMMENT ON TABLE teacher_video_intros IS 'Video introductions from teachers, requires admin approval';
