-- Fix: Allow teachers to update confirmation fields on their lessons
-- This enables the "Dismiss" functionality for past sessions

-- Add policy for teachers to update lesson confirmation status
DROP POLICY IF EXISTS "Teachers can update lesson confirmation" ON lessons;
CREATE POLICY "Teachers can update lesson confirmation"
  ON lessons FOR UPDATE
  TO authenticated
  USING (
    teacher_id IN (SELECT id FROM teacher_profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    teacher_id IN (SELECT id FROM teacher_profiles WHERE user_id = auth.uid())
  );

COMMIT;
