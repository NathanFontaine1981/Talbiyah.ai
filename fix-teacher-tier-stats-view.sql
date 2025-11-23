-- Fix teacher_tier_stats view to include student_hourly_price column

DROP VIEW IF EXISTS teacher_tier_stats CASCADE;

CREATE VIEW teacher_tier_stats AS
SELECT
  tp.id AS teacher_id,
  COALESCE(tp.current_tier, 'bronze') AS tier,
  COALESCE(tt.tier_name, 'Bronze') AS tier_name,
  COALESCE(tt.tier_icon, '🥉') AS tier_icon,
  COALESCE(tt.teacher_hourly_rate, 15.00) AS teacher_hourly_rate,
  COALESCE(tt.student_hourly_price, 15.00) AS student_hourly_price,
  COALESCE(SUM(l.duration_minutes) / 60.0, 0) AS hours_taught,
  COALESCE(AVG(tr.overall_rating), 0) AS average_rating,
  COUNT(DISTINCT l.learner_id) AS total_students,
  COUNT(CASE WHEN l.status = 'completed' THEN 1 END) AS completed_lessons,
  (
    SELECT tt2.tier_name
    FROM teacher_tiers tt2
    WHERE tt2.min_hours_taught > COALESCE(SUM(l.duration_minutes) / 60.0, 0)
    AND tt2.requires_manual_approval = false
    ORDER BY tt2.min_hours_taught ASC
    LIMIT 1
  ) AS next_auto_tier
FROM teacher_profiles tp
LEFT JOIN teacher_tiers tt ON tp.current_tier = tt.tier
LEFT JOIN lessons l ON tp.id = l.teacher_id AND l.status = 'completed'
LEFT JOIN teacher_ratings tr ON tp.id = tr.teacher_id
GROUP BY tp.id, tp.current_tier, tt.tier_name, tt.tier_icon, tt.teacher_hourly_rate, tt.student_hourly_price;

-- Grant permissions
GRANT SELECT ON teacher_tier_stats TO authenticated, anon;
