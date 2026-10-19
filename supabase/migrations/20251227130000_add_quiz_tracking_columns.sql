-- Add quiz tracking columns to homework_submissions table
-- This enables tracking first attempt scores (locked) and retry attempts with cooldown

ALTER TABLE homework_submissions
ADD COLUMN IF NOT EXISTS first_attempt_score INTEGER,
ADD COLUMN IF NOT EXISTS first_attempt_total INTEGER,
ADD COLUMN IF NOT EXISTS first_attempt_answers JSONB,
ADD COLUMN IF NOT EXISTS first_attempt_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS total_quiz_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_quiz_attempt_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS best_quiz_score INTEGER;

-- Add unique constraint for upsert on lesson_id + learner_id if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'homework_submissions_lesson_learner_unique'
  ) THEN
    ALTER TABLE homework_submissions
    ADD CONSTRAINT homework_submissions_lesson_learner_unique
    UNIQUE (lesson_id, learner_id);
  END IF;
EXCEPTION WHEN duplicate_table THEN
  -- Constraint already exists
  NULL;
END $$;
