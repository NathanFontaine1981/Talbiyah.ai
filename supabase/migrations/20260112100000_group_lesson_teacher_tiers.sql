-- Migration: Add group lesson tier system for UK teachers
-- This enables teachers to conduct group lessons with admin-controlled rates

-- 1. Add group lesson columns to teacher_profiles
ALTER TABLE teacher_profiles
  ADD COLUMN IF NOT EXISTS group_lesson_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS group_lesson_tier TEXT CHECK (group_lesson_tier IN ('standard', 'senior', 'master')),
  ADD COLUMN IF NOT EXISTS group_lesson_hourly_rate DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS group_lesson_tier_assigned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS group_lesson_tier_assigned_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS group_lesson_notes TEXT;

-- 2. Create group_lesson_tiers reference table
CREATE TABLE IF NOT EXISTS group_lesson_tiers (
  tier TEXT PRIMARY KEY,
  tier_level INTEGER NOT NULL,
  tier_name TEXT NOT NULL,
  tier_icon TEXT NOT NULL,
  teacher_hourly_rate DECIMAL(5,2) NOT NULL,
  description TEXT,
  requirements TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Seed the group lesson tiers
INSERT INTO group_lesson_tiers (tier, tier_level, tier_name, tier_icon, teacher_hourly_rate, description, requirements) VALUES
  ('standard', 1, 'Standard', '📚', 16.00, 'UK-based teacher approved for group lessons', ARRAY['UK location', 'Approved for 1-to-1 teaching', 'Admin approval for groups']),
  ('senior', 2, 'Senior', '🎓', 18.00, 'Experienced group lesson teacher with proven track record', ARRAY['50+ group lesson hours', 'Good student ratings', 'Admin approval']),
  ('master', 3, 'Master', '👑', 20.00, 'Expert group lesson facilitator', ARRAY['150+ group lesson hours', 'Excellent ratings', 'Demonstrated expertise'])
ON CONFLICT (tier) DO NOTHING;

-- 4. Create index for faster queries on group-enabled teachers
CREATE INDEX IF NOT EXISTS idx_teacher_profiles_group_lesson_enabled
  ON teacher_profiles(group_lesson_enabled)
  WHERE group_lesson_enabled = true;

-- 5. Add group lesson tracking to group_sessions if not exists
ALTER TABLE group_sessions
  ADD COLUMN IF NOT EXISTS teacher_hourly_rate DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS platform_fee_per_student DECIMAL(5,2) DEFAULT 3.00,
  ADD COLUMN IF NOT EXISTS session_category TEXT CHECK (session_category IN ('islamic_studies', 'quran_tadabbur', 'seerah', 'other'));

-- 6. Create view for group-enabled teachers with their tier info
CREATE OR REPLACE VIEW group_lesson_teachers AS
SELECT
  tp.id as teacher_profile_id,
  tp.user_id,
  p.full_name,
  p.country,
  p.city,
  p.languages,
  tp.group_lesson_enabled,
  tp.group_lesson_tier,
  tp.group_lesson_hourly_rate,
  tp.group_lesson_tier_assigned_at,
  tp.status as teacher_status,
  glt.tier_name,
  glt.tier_icon,
  glt.description as tier_description
FROM teacher_profiles tp
JOIN profiles p ON p.id = tp.user_id
LEFT JOIN group_lesson_tiers glt ON glt.tier = tp.group_lesson_tier
WHERE tp.status = 'approved';

-- 7. RLS policies for group_lesson_tiers (read-only for all authenticated)
ALTER TABLE group_lesson_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view group lesson tiers"
  ON group_lesson_tiers FOR SELECT
  TO authenticated
  USING (true);

-- 8. Function to assign group lesson tier (admin only)
CREATE OR REPLACE FUNCTION assign_group_lesson_tier(
  p_teacher_user_id UUID,
  p_tier TEXT,
  p_admin_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_rate DECIMAL(5,2);
BEGIN
  -- Get the hourly rate for this tier
  SELECT teacher_hourly_rate INTO v_rate
  FROM group_lesson_tiers
  WHERE tier = p_tier;

  IF v_rate IS NULL THEN
    RAISE EXCEPTION 'Invalid tier: %', p_tier;
  END IF;

  -- Update the teacher profile
  UPDATE teacher_profiles
  SET
    group_lesson_enabled = true,
    group_lesson_tier = p_tier,
    group_lesson_hourly_rate = v_rate,
    group_lesson_tier_assigned_at = now(),
    group_lesson_tier_assigned_by = p_admin_user_id
  WHERE user_id = p_teacher_user_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Function to disable group lessons for a teacher
CREATE OR REPLACE FUNCTION disable_group_lessons(
  p_teacher_user_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE teacher_profiles
  SET
    group_lesson_enabled = false
  WHERE user_id = p_teacher_user_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE group_lesson_tiers IS 'Reference table for group lesson tier definitions with rates';
COMMENT ON COLUMN teacher_profiles.group_lesson_enabled IS 'Whether teacher is approved for group lessons';
COMMENT ON COLUMN teacher_profiles.group_lesson_tier IS 'Current group lesson tier (standard/senior/master)';
COMMENT ON COLUMN teacher_profiles.group_lesson_hourly_rate IS 'Teacher earnings per hour for group lessons';
