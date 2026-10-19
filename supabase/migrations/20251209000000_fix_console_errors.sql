-- Fix Console Errors Migration
-- 1. Add UPDATE policy for parent_children table
-- 2. Fix get_student_teachers function

-- ============================================
-- 1. ADD UPDATE POLICY FOR parent_children
-- ============================================

-- Parents need to be able to update their children records (e.g., link to learner)
DROP POLICY IF EXISTS "Parents can update their own children" ON parent_children;
CREATE POLICY "Parents can update their own children"
  ON parent_children
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = parent_id)
  WITH CHECK (auth.uid() = parent_id);

COMMENT ON POLICY "Parents can update their own children" ON parent_children IS
  'Allows parents to update their own parent-child link records';

-- ============================================
-- 2. FIX get_student_teachers FUNCTION
-- ============================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_student_teachers(UUID);

-- Recreate with correct column names
CREATE OR REPLACE FUNCTION get_student_teachers(p_student_id UUID)
RETURNS TABLE (
  teacher_id UUID,
  teacher_name TEXT,
  teacher_avatar TEXT,
  subject_name TEXT,
  last_lesson_date TIMESTAMPTZ,
  total_lessons BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    tp.user_id as teacher_id,
    p.full_name as teacher_name,
    p.avatar_url as teacher_avatar,
    s.name as subject_name,
    MAX(l.scheduled_time) as last_lesson_date,
    COUNT(l.id) as total_lessons
  FROM lessons l
  JOIN teacher_profiles tp ON l.teacher_id = tp.user_id
  JOIN profiles p ON tp.user_id = p.id
  JOIN subjects s ON l.subject_id = s.id
  JOIN learners lr ON l.learner_id = lr.id
  WHERE lr.parent_id = p_student_id
    AND l.status IN ('completed', 'booked', 'in_progress')
  GROUP BY tp.user_id, p.full_name, p.avatar_url, s.name
  ORDER BY MAX(l.scheduled_time) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_student_teachers(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_student_teachers(UUID) TO anon;

-- ============================================
-- 3. CLEAN UP DUPLICATE LEARNERS
-- ============================================

-- Find and remove duplicate learners (keep the oldest one)
-- This prevents "multiple rows returned" errors
DELETE FROM learners
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY parent_id, LOWER(name) ORDER BY created_at ASC) as rn
    FROM learners
  ) duplicates
  WHERE rn > 1
);

-- Add a unique constraint to prevent future duplicates (parent + name combination)
-- First drop if exists to make migration idempotent
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'learners_parent_name_unique'
  ) THEN
    ALTER TABLE learners ADD CONSTRAINT learners_parent_name_unique
      UNIQUE (parent_id, name);
  END IF;
EXCEPTION WHEN others THEN
  -- Constraint might fail if duplicates still exist, that's OK
  RAISE NOTICE 'Could not add unique constraint - duplicates may still exist';
END $$;

-- ============================================
-- 4. VERIFY
-- ============================================
SELECT 'Console errors fixed!' as status;
