-- Add room code columns to lessons table
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS teacher_room_code TEXT,
ADD COLUMN IF NOT EXISTS student_room_code TEXT;

-- Add comments
COMMENT ON COLUMN lessons.teacher_room_code IS '100ms room code for teacher (host role)';
COMMENT ON COLUMN lessons.student_room_code IS '100ms room code for student (guest role)';
