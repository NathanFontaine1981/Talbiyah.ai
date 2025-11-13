-- Add age and gender fields to learners table for enhanced parent management
ALTER TABLE learners ADD COLUMN IF NOT EXISTS age integer;
ALTER TABLE learners ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('Male', 'Female', 'Other', NULL));

-- Add comments for clarity
COMMENT ON COLUMN learners.age IS 'Age of the learner/child';
COMMENT ON COLUMN learners.gender IS 'Gender of the learner/child';
