-- Add raw_transcript column to lesson_insights to preserve transcripts even when videos expire
-- This allows insights and areas of focus to be regenerated at any time

ALTER TABLE lesson_insights ADD COLUMN IF NOT EXISTS raw_transcript TEXT;

-- Add index for faster lookups on lessons with transcripts
CREATE INDEX IF NOT EXISTS idx_lesson_insights_has_transcript
ON lesson_insights(lesson_id)
WHERE raw_transcript IS NOT NULL;

COMMENT ON COLUMN lesson_insights.raw_transcript IS 'Raw transcript text from the lesson recording. Preserved to allow insight regeneration even after video expiration.';
