-- Add lesson_tier column to lessons table
-- 'premium' = gets AI insights and recordings saved
-- 'standard' = legacy billing, no insights or recordings

ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS lesson_tier TEXT DEFAULT 'premium'
CHECK (lesson_tier IN ('premium', 'standard'));

-- Add free_insights_trial column for trial users
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS free_insights_trial BOOLEAN DEFAULT false;

-- Update all existing lessons without a tier to be premium (so they get insights)
UPDATE lessons
SET lesson_tier = 'premium'
WHERE lesson_tier IS NULL;

-- Add comment explaining the columns
COMMENT ON COLUMN lessons.lesson_tier IS 'Lesson tier: premium (gets AI insights/recordings) or standard (legacy billing, no insights)';
COMMENT ON COLUMN lessons.free_insights_trial IS 'If true, this lesson gets premium features even without premium tier';
