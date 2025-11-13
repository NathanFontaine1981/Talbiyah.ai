-- Allow teachers to view learner data for students who have booked lessons with them
-- This is needed for the teacher dashboard to display student information

CREATE POLICY "Teachers can view learners who have booked with them"
ON learners
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM lessons l
    JOIN teacher_profiles tp ON l.teacher_id = tp.id
    WHERE l.learner_id = learners.id
    AND tp.user_id = auth.uid()
  )
);
