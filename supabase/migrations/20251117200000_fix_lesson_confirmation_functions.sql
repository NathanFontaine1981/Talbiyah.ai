-- Fix lesson confirmation functions to use correct learners table column
-- The learners table has 'parent_id' not 'user_id'

-- Function: Auto-acknowledge lessons after 24 hours (FIXED)
CREATE OR REPLACE FUNCTION auto_acknowledge_pending_lessons()
RETURNS TABLE(
  lesson_id UUID,
  student_id UUID,
  student_name TEXT,
  teacher_id UUID,
  teacher_name TEXT,
  scheduled_time TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  UPDATE lessons l
  SET
    confirmation_status = 'auto_acknowledged',
    acknowledged_at = NOW(),
    auto_acknowledged = TRUE
  FROM learners lr, profiles sp, teacher_profiles tp, profiles t_prof
  WHERE
    l.confirmation_status = 'pending'
    AND l.confirmation_requested_at < NOW() - INTERVAL '24 hours'
    AND l.status = 'booked'
    AND l.learner_id = lr.id
    AND lr.parent_id = sp.id  -- FIXED: Changed from lr.user_id to lr.parent_id
    AND l.teacher_id = tp.id
    AND tp.user_id = t_prof.id
  RETURNING
    l.id,
    lr.id,
    sp.full_name,
    tp.id,
    t_prof.full_name,
    l.scheduled_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get pending lessons for teacher (FIXED)
CREATE OR REPLACE FUNCTION get_teacher_pending_lessons(p_teacher_id UUID)
RETURNS TABLE(
  lesson_id UUID,
  student_name TEXT,
  student_id UUID,
  scheduled_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  subject_name TEXT,
  hours_until_lesson NUMERIC,
  requested_hours_ago NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    p.full_name,
    lr.id,
    l.scheduled_time,
    l.duration_minutes,
    s.name,
    EXTRACT(EPOCH FROM (l.scheduled_time - NOW())) / 3600,
    EXTRACT(EPOCH FROM (NOW() - l.confirmation_requested_at)) / 3600
  FROM lessons l
  JOIN learners lr ON l.learner_id = lr.id
  JOIN profiles p ON lr.parent_id = p.id  -- FIXED: Changed from lr.user_id to lr.parent_id
  LEFT JOIN subjects s ON l.subject_id = s.id
  WHERE l.teacher_id = p_teacher_id
  AND l.confirmation_status = 'pending'
  AND l.status = 'booked'
  ORDER BY l.scheduled_time ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
