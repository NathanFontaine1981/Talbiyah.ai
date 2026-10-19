-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- FIX TEACHER TIER STATS VIEW
-- Properly calculate next_auto_tier and hours_to_next_tier
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DROP VIEW IF EXISTS teacher_tier_stats CASCADE;

CREATE VIEW teacher_tier_stats AS
WITH teacher_data AS (
  SELECT
    tp.id as teacher_id,
    tp.user_id,
    tp.current_tier,
    tp.tier_assigned_at,
    COALESCE(tp.hours_taught, 0) as hours_taught,
    COALESCE(tp.completed_lessons, 0) as completed_lessons,
    COALESCE(
      (SELECT AVG(rating)::DECIMAL(3,2)
       FROM reviews
       WHERE teacher_id = tp.id),
      0
    ) as average_rating,
    COALESCE(
      (SELECT COUNT(DISTINCT learner_id)
       FROM lessons
       WHERE teacher_id = tp.id AND status = 'completed'),
      0
    ) as total_students
  FROM teacher_profiles tp
  WHERE tp.approval_status = 'approved'
),
next_tier_calc AS (
  SELECT
    td.teacher_id,
    (
      SELECT tt.tier
      FROM teacher_tiers tt
      WHERE tt.requires_manual_approval = false
        AND tt.min_hours_taught > td.hours_taught
      ORDER BY tt.min_hours_taught ASC
      LIMIT 1
    ) as next_auto_tier,
    (
      SELECT tt.min_hours_taught - td.hours_taught
      FROM teacher_tiers tt
      WHERE tt.requires_manual_approval = false
        AND tt.min_hours_taught > td.hours_taught
      ORDER BY tt.min_hours_taught ASC
      LIMIT 1
    ) as hours_to_next_tier
  FROM teacher_data td
)
SELECT
  td.teacher_id,
  p.full_name as teacher_name,
  p.email as teacher_email,
  COALESCE(td.current_tier, 'newcomer') as tier,
  COALESCE(tt.tier_name, 'Newcomer') as tier_name,
  COALESCE(tt.tier_icon, '🌱') as tier_icon,
  COALESCE(tt.teacher_hourly_rate, 4.00) as teacher_hourly_rate,
  COALESCE(tt.student_hourly_price, 15.00) as student_hourly_price,
  COALESCE(tt.platform_margin, 11.00) as platform_margin,
  td.hours_taught,
  td.average_rating,
  td.completed_lessons as total_lessons,
  td.completed_lessons,
  td.tier_assigned_at,
  ntc.next_auto_tier,
  ROUND(ntc.hours_to_next_tier::numeric, 1) as hours_to_next_tier,
  td.total_students,
  0 as grandfathered_students
FROM teacher_data td
JOIN profiles p ON td.user_id = p.id
LEFT JOIN teacher_tiers tt ON td.current_tier = tt.tier
LEFT JOIN next_tier_calc ntc ON td.teacher_id = ntc.teacher_id;

-- Grant access to the view
GRANT SELECT ON teacher_tier_stats TO authenticated, anon;

COMMENT ON VIEW teacher_tier_stats IS 'Teacher statistics including tier progress. hours_to_next_tier shows how many more hours needed for auto-promotion.';
