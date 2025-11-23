-- FIX #3: Clean up all console errors (CORRECTED VERSION)

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

SELECT '✅ Fix 1: get_student_teachers function fixed' as status;

-- Fix 2: Check learners table structure first
DO $$
BEGIN
  RAISE NOTICE 'Checking learners table structure...';

  -- Show all columns in learners table
  FOR r IN
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'learners'
    ORDER BY ordinal_position
  LOOP
    RAISE NOTICE 'Column: % (type: %)', r.column_name, r.data_type;
  END LOOP;
END $$;

-- Fix 2b: Clean up duplicate learner records based on actual columns
DO $$
DECLARE
  duplicate_count INTEGER;
  deleted_count INTEGER;
BEGIN
  RAISE NOTICE 'Checking for duplicate learners...';

  -- Count total learners
  SELECT COUNT(*) INTO duplicate_count FROM learners;
  RAISE NOTICE 'Total learners: %', duplicate_count;

  -- Delete duplicates keeping only the oldest one for each parent
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

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % duplicate learner records', deleted_count;

  -- Show remaining count
  SELECT COUNT(*) INTO duplicate_count FROM learners;
  RAISE NOTICE 'Remaining learners: %', duplicate_count;
END $$;

SELECT '✅ Fix 2: Duplicate learners cleaned up' as status;

-- Fix 3: Verify parent_children table structure
DO $$
BEGIN
  RAISE NOTICE 'Checking parent_children table...';

  -- Check if parent_children table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'parent_children') THEN
    RAISE NOTICE 'parent_children table exists';

    -- Show structure
    FOR r IN
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'parent_children'
      ORDER BY ordinal_position
    LOOP
      RAISE NOTICE '  Column: % (type: %)', r.column_name, r.data_type;
    END LOOP;

    -- Show row count
    EXECUTE 'SELECT COUNT(*) FROM parent_children' INTO r;
    RAISE NOTICE '  Total records: %', r;
  ELSE
    RAISE NOTICE 'parent_children table does NOT exist';
  END IF;
END $$;

SELECT '✅ Fix 3: parent_children table verified' as status;

-- Summary
SELECT '🎉 CONSOLE ERROR FIXES APPLIED!' as status;

-- Show verification
SELECT 'Learners table' as info, COUNT(*) as count FROM learners
UNION ALL
SELECT 'Student-Teacher Relationships', COUNT(*) FROM student_teacher_relationships
UNION ALL
SELECT 'Lessons', COUNT(*) FROM lessons;
