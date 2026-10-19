-- Secure lesson_recordings table with proper RLS policies
-- Only allow access to recordings for users involved in the lesson

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view recordings" ON lesson_recordings;

-- Create a secure policy that checks user involvement in the lesson
CREATE POLICY "Users can view their own lesson recordings"
  ON lesson_recordings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lessons l
      LEFT JOIN learners lr ON l.learner_id = lr.id
      LEFT JOIN teacher_profiles tp ON l.teacher_id = tp.id
      WHERE l.id = lesson_recordings.lesson_id
      AND (
        -- User is the teacher
        tp.user_id = auth.uid()
        -- User is the parent of the learner
        OR lr.parent_id = auth.uid()
        -- User is an admin
        OR EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid()
          AND 'admin' = ANY(p.roles)
        )
      )
    )
  );

-- Add comment explaining the security model
COMMENT ON TABLE lesson_recordings IS 'Stores video recordings of lessons. Access is restricted to lesson participants (teacher, parent of student, or admin).';
