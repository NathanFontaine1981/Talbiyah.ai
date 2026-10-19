-- Fix RLS policies for lesson_insights table
-- This allows users to see insights where they are the learner, teacher, or parent

-- Drop any existing policies
DROP POLICY IF EXISTS "lesson_insights_select_policy" ON lesson_insights;
DROP POLICY IF EXISTS "lesson_insights_insert_policy" ON lesson_insights;
DROP POLICY IF EXISTS "lesson_insights_update_policy" ON lesson_insights;
DROP POLICY IF EXISTS "Users can view their own insights" ON lesson_insights;
DROP POLICY IF EXISTS "Service role can insert insights" ON lesson_insights;
DROP POLICY IF EXISTS "Teachers can update insights" ON lesson_insights;

-- Enable RLS if not already enabled
ALTER TABLE lesson_insights ENABLE ROW LEVEL SECURITY;

-- Create SELECT policy: Users can see insights where they are the learner, teacher, or parent
CREATE POLICY "Users can view their own insights" ON lesson_insights
  FOR SELECT
  USING (
    -- User is the learner (student account)
    auth.uid() = learner_id
    OR
    -- User is the teacher
    auth.uid() = teacher_id
    OR
    -- User is a parent of the learner (check learners table)
    auth.uid() IN (
      SELECT parent_id FROM learners WHERE id = learner_id AND parent_id IS NOT NULL
    )
    OR
    -- User owns the learner profile
    auth.uid() IN (
      SELECT user_id FROM learners WHERE id = learner_id AND user_id IS NOT NULL
    )
  );

-- Create INSERT policy: Service role can insert (from edge functions)
CREATE POLICY "Service role can insert insights" ON lesson_insights
  FOR INSERT
  WITH CHECK (true);

-- Create UPDATE policy: Teachers and learners can update (for ratings)
CREATE POLICY "Users can update their insights" ON lesson_insights
  FOR UPDATE
  USING (
    auth.uid() = teacher_id
    OR auth.uid() = learner_id
    OR auth.uid() IN (SELECT parent_id FROM learners WHERE id = learner_id AND parent_id IS NOT NULL)
    OR auth.uid() IN (SELECT user_id FROM learners WHERE id = learner_id AND user_id IS NOT NULL)
  );
