-- Add co_teacher_ids array column to group_sessions for multi-teacher support
ALTER TABLE group_sessions ADD COLUMN IF NOT EXISTS co_teacher_ids uuid[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN group_sessions.co_teacher_ids IS 'Array of additional teacher user IDs who co-teach this course';
