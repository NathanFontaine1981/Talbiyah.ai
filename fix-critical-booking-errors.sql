-- FIX 1: Add missing booked_at column to lessons table
-- This is CRITICAL - the booking is failing because this column is missing

ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS booked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing lessons to have booked_at = created_at
UPDATE lessons
SET booked_at = created_at
WHERE booked_at IS NULL;

-- Verify it worked
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'lessons'
AND column_name = 'booked_at';

-- FIX 2: Create missing get_student_teachers function
-- This is needed for "My Teachers" section

-- Drop if exists (in case partial creation)
DROP FUNCTION IF EXISTS get_student_teachers(UUID);

-- Create the function
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
    tp.user_id as teacher_id,
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
      SELECT MIN(scheduled_date::timestamp + scheduled_time::time)
      FROM lessons
      WHERE learner_id = p_student_id
      AND teacher_id = tp.user_id
      AND status = 'booked'
      AND scheduled_date::timestamp + scheduled_time::time > NOW()
    ) as next_lesson_time
  FROM student_teacher_relationships str
  JOIN teacher_profiles tp ON str.teacher_id = tp.user_id
  JOIN profiles p ON tp.user_id = p.id
  LEFT JOIN subjects s ON str.subject_id = s.id
  WHERE str.student_id = p_student_id
  AND str.status = 'active'
  ORDER BY str.last_lesson_date DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_student_teachers(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_student_teachers(UUID) TO anon;

-- FIX 3: Verify student_teacher_relationships table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_name = 'student_teacher_relationships'
) as table_exists;

-- FIX 4: Check for duplicate learners (for debugging)
SELECT parent_id, COUNT(*) as learner_count, array_agg(id) as learner_ids
FROM learners
GROUP BY parent_id
HAVING COUNT(*) > 1
ORDER BY learner_count DESC
LIMIT 10;
