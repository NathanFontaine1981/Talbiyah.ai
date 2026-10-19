-- Add verification status to lesson_insights table
-- Tracks whether quiz content has been verified against authoritative Quran sources

-- Add verification_status column
ALTER TABLE lesson_insights
ADD COLUMN IF NOT EXISTS verification_status TEXT
  DEFAULT 'pending'
  CHECK (verification_status IN (
    'pending',        -- Not yet verified
    'auto_verified',  -- Verified programmatically, all answers correct
    'auto_corrected', -- Verified and corrections were applied
    'needs_review',   -- Flagged for manual review
    'human_verified', -- Manually verified by admin
    'human_corrected' -- Manually corrected by admin
  ));

-- Add index for filtering by verification status
CREATE INDEX IF NOT EXISTS idx_lesson_insights_verification_status
  ON lesson_insights(verification_status);

-- Comment for documentation
COMMENT ON COLUMN lesson_insights.verification_status IS 'Quiz verification status: pending, auto_verified, auto_corrected, needs_review, human_verified, human_corrected';
