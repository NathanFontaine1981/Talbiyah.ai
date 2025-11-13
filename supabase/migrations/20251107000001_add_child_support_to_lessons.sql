-- Add group lesson support to lessons table
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS is_group_lesson boolean DEFAULT false;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS group_learner_ids uuid[] DEFAULT ARRAY[]::uuid[];

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lessons_parent_id ON lessons(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lessons_group_lesson ON lessons(is_group_lesson) WHERE is_group_lesson = true;

-- Add comments for clarity
COMMENT ON COLUMN lessons.is_group_lesson IS 'True if this lesson is for multiple learners together';
COMMENT ON COLUMN lessons.group_learner_ids IS 'Array of learner IDs for group lessons (when is_group_lesson = true)';
