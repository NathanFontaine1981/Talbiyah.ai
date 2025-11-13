-- Add teacher_confirmed field to lessons table
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS teacher_confirmed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS teacher_confirmed_at timestamptz;

-- Add comment to explain the field
COMMENT ON COLUMN lessons.teacher_confirmed IS 'Whether the teacher has confirmed they have seen this booking';
COMMENT ON COLUMN lessons.teacher_confirmed_at IS 'When the teacher confirmed the booking';

-- Create index for efficient querying of unconfirmed lessons
CREATE INDEX IF NOT EXISTS idx_lessons_teacher_confirmed ON lessons(teacher_confirmed, teacher_id) WHERE teacher_confirmed = false;
