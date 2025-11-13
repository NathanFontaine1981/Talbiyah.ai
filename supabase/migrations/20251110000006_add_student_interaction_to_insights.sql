-- Add student interaction fields to lesson_insights table
ALTER TABLE lesson_insights
ADD COLUMN IF NOT EXISTS viewed_by_student BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS student_rating INTEGER CHECK (student_rating >= 1 AND student_rating <= 5),
ADD COLUMN IF NOT EXISTS student_viewed_at TIMESTAMPTZ;

-- Add index for student views
CREATE INDEX IF NOT EXISTS idx_lesson_insights_viewed ON lesson_insights(viewed_by_student);

-- Update RLS policy to allow students to update their rating
DROP POLICY IF EXISTS "Students can update their rating" ON lesson_insights;
CREATE POLICY "Students can update their rating"
ON lesson_insights
FOR UPDATE
TO authenticated
USING (
  learner_id IN (
    SELECT id FROM learners WHERE parent_id = auth.uid()
  )
)
WITH CHECK (
  learner_id IN (
    SELECT id FROM learners WHERE parent_id = auth.uid()
  )
);
