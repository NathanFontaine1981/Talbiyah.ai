-- Verification script for teacher tier system
-- Run this to check if everything is set up correctly

-- 1. Check if teacher_tiers table exists and has data
SELECT 'teacher_tiers table check' as check_name;
SELECT COUNT(*) as tier_count,
       string_agg(tier_name, ', ' ORDER BY tier_level) as tiers
FROM teacher_tiers;

-- 2. Check if teacher_profiles has current_tier column
SELECT 'teacher_profiles columns check' as check_name;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'teacher_profiles'
  AND column_name IN ('current_tier', 'tier', 'tier_assigned_at', 'hours_taught', 'average_rating');

-- 3. Check if teacher_tier_stats view exists
SELECT 'teacher_tier_stats view check' as check_name;
SELECT COUNT(*) as exists_count
FROM information_schema.views
WHERE table_name = 'teacher_tier_stats';

-- 4. Check sample data from teacher_tier_stats
SELECT 'teacher_tier_stats data sample' as check_name;
SELECT
  teacher_profile_id,
  teacher_name,
  tier,
  tier_name,
  tier_icon,
  teacher_hourly_rate,
  hours_taught,
  average_rating,
  total_students
FROM teacher_tier_stats
LIMIT 3;

-- 5. Check if there are any teachers without tier data
SELECT 'teachers without tier data' as check_name;
SELECT COUNT(*) as count_without_tier
FROM teacher_profiles tp
WHERE tp.approval_status = 'approved'
  AND NOT EXISTS (
    SELECT 1 FROM teacher_tier_stats tts
    WHERE tts.teacher_profile_id = tp.id
  );

-- 6. Check permissions on the view
SELECT 'teacher_tier_stats permissions' as check_name;
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'teacher_tier_stats';
