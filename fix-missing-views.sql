-- Fix missing views and tables causing 400 errors in TeacherHub
-- This creates or replaces critical views needed by the application

-- Recreate teacher_tier_stats view
CREATE OR REPLACE VIEW teacher_tier_stats AS
SELECT
  tp.id AS teacher_id,
  tp.current_tier AS tier,
  tt.name AS tier_name,
  tt.icon AS tier_icon,
  tt.hourly_rate AS teacher_hourly_rate,
  COALESCE(SUM(l.duration_minutes) / 60.0, 0) AS hours_taught,
  COALESCE(AVG(tr.overall_rating), 0) AS average_rating,
  COUNT(DISTINCT l.learner_id) AS total_students,
  (
    SELECT tt2.name
    FROM teacher_tiers tt2
    WHERE tt2.hours_required > COALESCE(SUM(l.duration_minutes) / 60.0, 0)
    AND tt2.is_auto_tier = true
    ORDER BY tt2.hours_required ASC
    LIMIT 1
  ) AS next_auto_tier
FROM teacher_profiles tp
LEFT JOIN teacher_tiers tt ON tp.current_tier = tt.id
LEFT JOIN lessons l ON tp.id = l.teacher_id AND l.status = 'completed'
LEFT JOIN teacher_ratings tr ON tp.id = tr.teacher_id
GROUP BY tp.id, tp.current_tier, tt.name, tt.icon, tt.hourly_rate;

-- Grant permissions
GRANT SELECT ON teacher_tier_stats TO authenticated, anon;
