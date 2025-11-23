-- Add current_tier column to teacher_profiles if it doesn't exist
-- This is required for the teacher tier system to work

-- Add the column
ALTER TABLE teacher_profiles
ADD COLUMN IF NOT EXISTS current_tier text DEFAULT 'newcomer' REFERENCES teacher_tiers(tier);

-- Add tier tracking columns
ALTER TABLE teacher_profiles
ADD COLUMN IF NOT EXISTS tier_assigned_at timestamptz DEFAULT now();

-- Update existing teachers to have the newcomer tier if they don't have one
UPDATE teacher_profiles
SET current_tier = 'newcomer',
    tier_assigned_at = COALESCE(tier_assigned_at, now())
WHERE current_tier IS NULL;

-- Recreate the teacher_tier_stats view to ensure it uses the correct column
DROP VIEW IF EXISTS teacher_tier_stats;

CREATE OR REPLACE VIEW teacher_tier_stats AS
SELECT
  tp.id as teacher_profile_id,
  tp.user_id as teacher_user_id,
  p.full_name as teacher_name,
  p.email as teacher_email,
  COALESCE(tp.current_tier, 'newcomer') as tier,
  COALESCE(tt.tier_name, 'Newcomer') as tier_name,
  COALESCE(tt.tier_icon, '🌱') as tier_icon,
  COALESCE(tt.teacher_hourly_rate, 5.00) as teacher_hourly_rate,
  COALESCE(tt.student_hourly_price, 15.00) as student_hourly_price,
  COALESCE(tt.platform_margin, 10.00) as platform_margin,
  COALESCE(
    (SELECT SUM(duration_minutes) / 60.0
     FROM lessons
     WHERE teacher_id = tp.id AND status = 'completed'),
    0
  ) as hours_taught,
  0::DECIMAL(3,2) as average_rating,
  COALESCE(
    (SELECT COUNT(*)
     FROM lessons
     WHERE teacher_id = tp.id),
    0
  ) as total_lessons,
  COALESCE(
    (SELECT COUNT(*)
     FROM lessons
     WHERE teacher_id = tp.id AND status = 'completed'),
    0
  ) as completed_lessons,
  tp.tier_assigned_at,
  NULL::text as next_auto_tier,
  NULL::integer as hours_to_next_tier,
  COALESCE(
    (SELECT COUNT(DISTINCT student_id)
     FROM lessons
     WHERE teacher_id = tp.id AND status = 'completed'),
    0
  ) as total_students,
  0 as grandfathered_students
FROM teacher_profiles tp
LEFT JOIN profiles p ON tp.user_id = p.id
LEFT JOIN teacher_tiers tt ON tp.current_tier = tt.tier
WHERE tp.status = 'approved';

-- Grant permissions
GRANT SELECT ON teacher_tier_stats TO authenticated, anon;

-- Add helpful comment
COMMENT ON VIEW teacher_tier_stats IS 'Consolidated view of teacher profiles with tier information - updated to use current_tier column';
