-- Allow teachers to view learners they have relationships with
DROP POLICY IF EXISTS "Teachers can view their students" ON learners;

CREATE POLICY "Teachers can view their students" ON learners
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM student_teacher_relationships str
      JOIN teacher_profiles tp ON str.teacher_id = tp.id
      WHERE str.student_id = learners.id
      AND tp.user_id = auth.uid()
    )
  );
