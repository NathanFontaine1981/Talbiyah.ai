-- Add is_bookmarked column to student_teacher_relationships table
-- Allows students to mark favorite teachers

ALTER TABLE student_teacher_relationships
ADD COLUMN IF NOT EXISTS is_bookmarked BOOLEAN DEFAULT FALSE;

-- Index for faster lookups of bookmarked teachers
CREATE INDEX IF NOT EXISTS idx_student_teacher_relationships_bookmarked
ON student_teacher_relationships(student_id, is_bookmarked)
WHERE is_bookmarked = TRUE;
