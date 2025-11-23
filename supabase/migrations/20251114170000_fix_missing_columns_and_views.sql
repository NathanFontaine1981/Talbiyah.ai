-- Add missing phone column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- Create teacher tier stats view (simplified version)
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
  COALESCE(
    (SELECT AVG(rating)::DECIMAL(3,2)
     FROM reviews
     WHERE teacher_id = tp.id),
    0
  ) as average_rating,
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
WHERE tp.approval_status = 'approved';

-- Grant access to the view
GRANT SELECT ON teacher_tier_stats TO authenticated, anon;
