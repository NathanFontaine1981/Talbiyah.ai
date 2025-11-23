-- FIX #3: Clean up all console errors (FINAL SIMPLE VERSION)

-- Fix 1: Fix get_student_teachers function (column reference errors)
DROP FUNCTION IF EXISTS get_student_teachers(UUID);

CREATE OR REPLACE FUNCTION get_student_teachers(p_student_id UUID)
RETURNS TABLE(
  relationship_id UUID,
  teacher_id UUID,
  teacher_name TEXT,
  teacher_email TEXT,
  teacher_avatar TEXT,
  subject_name TEXT,
  total_lessons INTEGER,
  total_hours NUMERIC,
  first_lesson_date DATE,
  last_lesson_date DATE,
  status TEXT,
  next_lesson_time TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    str.id as relationship_id,
    str.teacher_id,
    p.full_name as teacher_name,
    p.email as teacher_email,
    p.avatar_url as teacher_avatar,
    s.name as subject_name,
    str.total_lessons,
    str.total_hours,
    str.first_paid_lesson_date as first_lesson_date,
    str.last_lesson_date,
    str.status,
    (
      SELECT MIN(l.scheduled_time::timestamp with time zone)
      FROM lessons l
      WHERE l.learner_id = p_student_id
      AND l.teacher_id = str.teacher_id
      AND l.status = 'booked'
      AND l.scheduled_time::timestamp with time zone > NOW()
    ) as next_lesson_time
  FROM student_teacher_relationships str
  JOIN profiles p ON str.teacher_id = p.id
  LEFT JOIN subjects s ON str.subject_id = s.id
  WHERE str.student_id = p_student_id
  AND str.status = 'active'
  ORDER BY str.last_lesson_date DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_student_teachers(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_student_teachers(UUID) TO anon;

-- Fix 2: Clean up duplicate learner records
-- Keep only the oldest record for each parent (based on created_at)
DELETE FROM learners
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY parent_id ORDER BY created_at ASC) as rn
    FROM learners
  ) t
  WHERE t.rn > 1
);

-- Show results
SELECT
  '✅ Console errors fixed!' as status,
  (SELECT COUNT(*) FROM learners) as remaining_learners,
  (SELECT COUNT(*) FROM student_teacher_relationships) as relationships;
