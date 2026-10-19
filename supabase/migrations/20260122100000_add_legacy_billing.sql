-- Legacy Billing System Migration
-- Implements tiered lesson pricing: Legacy (monthly invoice) vs Premium (current system)

-- Mark teachers as legacy (assigned to legacy students)
ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS is_legacy_teacher BOOLEAN DEFAULT FALSE;

-- Mark students/learners as legacy (monthly invoice billing)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_legacy_student BOOLEAN DEFAULT FALSE;

-- Legacy teacher-student assignments
CREATE TABLE IF NOT EXISTS legacy_teacher_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(teacher_id, student_id)
);

-- Add lesson_tier to lessons table (standard = no insights/recording, premium = full features)
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS lesson_tier TEXT DEFAULT 'premium'
  CHECK (lesson_tier IN ('standard', 'premium'));

-- Track first-lesson free insights trial (for FOMO hook)
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS free_insights_trial BOOLEAN DEFAULT FALSE;

-- Add tier to cart_items
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS lesson_tier TEXT DEFAULT 'premium'
  CHECK (lesson_tier IN ('standard', 'premium'));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_lessons_tier ON lessons(lesson_tier);
CREATE INDEX IF NOT EXISTS idx_lessons_free_insights_trial ON lessons(free_insights_trial) WHERE free_insights_trial = TRUE;
CREATE INDEX IF NOT EXISTS idx_legacy_teacher_students_teacher ON legacy_teacher_students(teacher_id);
CREATE INDEX IF NOT EXISTS idx_legacy_teacher_students_student ON legacy_teacher_students(student_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_legacy_student ON profiles(is_legacy_student) WHERE is_legacy_student = TRUE;
CREATE INDEX IF NOT EXISTS idx_teacher_profiles_is_legacy_teacher ON teacher_profiles(is_legacy_teacher) WHERE is_legacy_teacher = TRUE;

-- Helper function to check if learner used free trial
CREATE OR REPLACE FUNCTION has_used_free_insights_trial(p_learner_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM lessons
    WHERE learner_id = p_learner_id
      AND free_insights_trial = TRUE
      AND status NOT IN ('cancelled_by_teacher', 'cancelled_by_student')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if student is a legacy student
CREATE OR REPLACE FUNCTION is_legacy_student(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_user_id
      AND is_legacy_student = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get assigned legacy teachers for a student
CREATE OR REPLACE FUNCTION get_legacy_teachers_for_student(p_student_id UUID)
RETURNS TABLE (
  teacher_id UUID,
  teacher_profile_id UUID,
  teacher_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tp.user_id as teacher_id,
    tp.id as teacher_profile_id,
    p.full_name as teacher_name
  FROM legacy_teacher_students lts
  JOIN teacher_profiles tp ON tp.id = lts.teacher_id
  JOIN profiles p ON p.id = tp.user_id
  WHERE lts.student_id = p_student_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View for monthly legacy billing summary
CREATE OR REPLACE VIEW legacy_monthly_billing AS
SELECT
  l.learner_id,
  p.full_name as student_name,
  pr.email as student_email,
  DATE_TRUNC('month', l.scheduled_time) as billing_month,
  COUNT(*) as lesson_count,
  SUM(l.duration_minutes) as total_minutes,
  -- £12/hour = £6/30min
  SUM(CASE WHEN l.duration_minutes = 60 THEN 12.00 ELSE 6.00 END) as amount_owed,
  array_agg(DISTINCT tp.user_id) as teacher_ids
FROM lessons l
JOIN learners lr ON lr.id = l.learner_id
JOIN profiles p ON p.id = lr.parent_id
JOIN profiles pr ON pr.id = lr.parent_id
JOIN teacher_profiles tp ON tp.user_id = l.teacher_id
WHERE l.lesson_tier = 'standard'
  AND l.status = 'completed'
GROUP BY l.learner_id, p.full_name, pr.email, DATE_TRUNC('month', l.scheduled_time)
ORDER BY billing_month DESC, student_name;

-- RLS Policies for legacy_teacher_students
ALTER TABLE legacy_teacher_students ENABLE ROW LEVEL SECURITY;

-- Admins can manage all assignments
CREATE POLICY "Admins can manage legacy teacher assignments"
  ON legacy_teacher_students FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND 'admin' = ANY(roles)
    )
  );

-- Teachers can view their own assignments
CREATE POLICY "Teachers can view their assignments"
  ON legacy_teacher_students FOR SELECT
  TO authenticated
  USING (
    teacher_id IN (
      SELECT id FROM teacher_profiles WHERE user_id = auth.uid()
    )
  );

-- Students can view their own assignments
CREATE POLICY "Students can view their assignments"
  ON legacy_teacher_students FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- Grant access to the view for authenticated users (admins will filter in the app)
GRANT SELECT ON legacy_monthly_billing TO authenticated;

COMMENT ON TABLE legacy_teacher_students IS 'Maps legacy teachers to their assigned legacy students for monthly invoice billing';
COMMENT ON COLUMN lessons.lesson_tier IS 'premium = includes AI insights and recording; standard = no insights or recording (legacy billing)';
COMMENT ON COLUMN lessons.free_insights_trial IS 'First legacy lesson gets free insights as FOMO hook';
COMMENT ON COLUMN profiles.is_legacy_student IS 'Legacy students pay via monthly invoice instead of upfront payment';
COMMENT ON COLUMN teacher_profiles.is_legacy_teacher IS 'Legacy teachers can be assigned to legacy students';
