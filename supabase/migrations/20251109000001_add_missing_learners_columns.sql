/*
  # Add Missing Columns to Learners Table

  1. Changes
    - Add `total_xp` column (integer) - Total experience points earned (used by frontend)
    - Add `current_level` column (integer) - Current level of the learner
    - Add `current_streak` column (integer) - Current learning streak in days

  2. Notes
    - These columns are expected by Dashboard.tsx, LearningStatsWidget.tsx, and StudentDashboardContent.tsx
    - `total_xp` is separate from `total_points` (both exist for different purposes)
    - `current_streak` is separate from `login_streak` (learning streak vs login streak)
*/

-- Add missing columns to learners table
ALTER TABLE learners
ADD COLUMN IF NOT EXISTS total_xp integer DEFAULT 0;

ALTER TABLE learners
ADD COLUMN IF NOT EXISTS current_level integer DEFAULT 1;

ALTER TABLE learners
ADD COLUMN IF NOT EXISTS current_streak integer DEFAULT 0;

-- Add constraints
ALTER TABLE learners
ADD CONSTRAINT check_total_xp_non_negative
CHECK (total_xp >= 0);

ALTER TABLE learners
ADD CONSTRAINT check_current_level_positive
CHECK (current_level >= 1);

ALTER TABLE learners
ADD CONSTRAINT check_current_streak_non_negative
CHECK (current_streak >= 0);

-- Add comments
COMMENT ON COLUMN learners.total_xp IS 'Total experience points earned through learning activities';
COMMENT ON COLUMN learners.current_level IS 'Current level of the learner (starts at 1)';
COMMENT ON COLUMN learners.current_streak IS 'Current learning streak in consecutive days';
