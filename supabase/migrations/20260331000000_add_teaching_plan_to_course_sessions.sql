-- Add teaching plan columns to course_sessions
ALTER TABLE course_sessions ADD COLUMN IF NOT EXISTS teaching_plan TEXT;
ALTER TABLE course_sessions ADD COLUMN IF NOT EXISTS teaching_plan_generated_at TIMESTAMPTZ;
