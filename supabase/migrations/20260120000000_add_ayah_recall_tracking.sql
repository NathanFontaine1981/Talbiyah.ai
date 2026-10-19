-- Add recall tracking columns to ayah_progress table
-- These columns track student performance on English-to-Arabic recall exercises

-- Add recall_score column (0-100 based on recall accuracy)
ALTER TABLE ayah_progress
ADD COLUMN IF NOT EXISTS recall_score INTEGER DEFAULT 0
CHECK (recall_score >= 0 AND recall_score <= 100);

-- Add recall_attempts column (total number of recall attempts)
ALTER TABLE ayah_progress
ADD COLUMN IF NOT EXISTS recall_attempts INTEGER DEFAULT 0;

-- Add last_recall_at column (timestamp of last recall attempt)
ALTER TABLE ayah_progress
ADD COLUMN IF NOT EXISTS last_recall_at TIMESTAMPTZ;

-- Add recall_correct_count column (number of correct recalls)
ALTER TABLE ayah_progress
ADD COLUMN IF NOT EXISTS recall_correct_count INTEGER DEFAULT 0;

-- Add recall_streak column (current streak of correct recalls)
ALTER TABLE ayah_progress
ADD COLUMN IF NOT EXISTS recall_streak INTEGER DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN ayah_progress.recall_score IS 'Score from 0-100 based on recall accuracy in English-to-Arabic exercises';
COMMENT ON COLUMN ayah_progress.recall_attempts IS 'Total number of recall attempts for this ayah';
COMMENT ON COLUMN ayah_progress.last_recall_at IS 'Timestamp of the most recent recall attempt';
COMMENT ON COLUMN ayah_progress.recall_correct_count IS 'Number of times the ayah was correctly recalled';
COMMENT ON COLUMN ayah_progress.recall_streak IS 'Current streak of consecutive correct recalls';

-- Create index for efficient querying of recall data
CREATE INDEX IF NOT EXISTS idx_ayah_progress_recall
ON ayah_progress(learner_id, last_recall_at DESC)
WHERE recall_attempts > 0;
