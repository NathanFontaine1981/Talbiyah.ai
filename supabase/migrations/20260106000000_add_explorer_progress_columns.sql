-- Add progress columns for explorer accounts
-- These store JSON progress data for Exploring Islam and New to Islam sections

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS explore_progress jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS new_muslim_progress jsonb DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN profiles.explore_progress IS 'JSON progress data for Exploring Islam journey (stages, axioms, etc.)';
COMMENT ON COLUMN profiles.new_muslim_progress IS 'JSON progress data for New to Islam curriculum (steps, verified facts, completed modules)';
