-- Add quiz attempt tracking columns to homework_submissions
-- This tracks first attempt scores (immutable for teachers) and enables quiz retries with cooldown

-- Add columns for tracking quiz attempts
ALTER TABLE homework_submissions
ADD COLUMN IF NOT EXISTS first_attempt_score INTEGER,
ADD COLUMN IF NOT EXISTS first_attempt_total INTEGER,
ADD COLUMN IF NOT EXISTS first_attempt_answers JSONB,
ADD COLUMN IF NOT EXISTS first_attempt_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS total_quiz_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_quiz_attempt_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS best_quiz_score INTEGER;

-- Add comment explaining the fields
COMMENT ON COLUMN homework_submissions.first_attempt_score IS 'Score from the first complete quiz attempt - immutable';
COMMENT ON COLUMN homework_submissions.first_attempt_total IS 'Total questions in first attempt';
COMMENT ON COLUMN homework_submissions.first_attempt_answers IS 'JSON array of answers from first attempt';
COMMENT ON COLUMN homework_submissions.first_attempt_at IS 'When the first attempt was completed';
COMMENT ON COLUMN homework_submissions.total_quiz_attempts IS 'Total number of complete quiz attempts';
COMMENT ON COLUMN homework_submissions.last_quiz_attempt_at IS 'When the last quiz attempt was completed - used for cooldown';
COMMENT ON COLUMN homework_submissions.best_quiz_score IS 'Best score achieved across all attempts';
