/*
  # Add Parent ID to Lessons Table

  1. Changes
    - Add `parent_id` field to lessons table for direct parent access
    - This makes it easier to query all lessons for a parent's children
    - Add index for performance

  2. Notes
    - Parent ID is denormalized for query performance
    - Can still access through learners table if needed
*/

-- Add parent_id column
ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES profiles(id) ON DELETE CASCADE;

-- Create index for parent queries
CREATE INDEX IF NOT EXISTS idx_lessons_parent_id ON lessons(parent_id);

-- Backfill parent_id for existing lessons
UPDATE lessons
SET parent_id = learners.parent_id
FROM learners
WHERE lessons.learner_id = learners.id
AND lessons.parent_id IS NULL;
