-- Fix RLS policies for lesson_insights table

-- Drop all existing select policies
DROP POLICY IF EXISTS "Users can view their own insights" ON lesson_insights;
DROP POLICY IF EXISTS "Users can view insights for their lessons" ON lesson_insights;
DROP POLICY IF EXISTS "learners_view_own_insights" ON lesson_insights;
DROP POLICY IF EXISTS "teachers_view_their_insights" ON lesson_insights;
DROP POLICY IF EXISTS "Authenticated users can view insights" ON lesson_insights;
DROP POLICY IF EXISTS "Users can view their insights" ON lesson_insights;
DROP POLICY IF EXISTS "Users can view their lesson insights" ON lesson_insights;

-- Create a comprehensive policy that allows:
-- 1. Teachers to view insights for lessons they teach
-- 2. Parents to view insights for their children's lessons
CREATE POLICY "Users can view their insights"
ON lesson_insights
FOR SELECT
TO authenticated
USING (
  -- User is the teacher (teacher_id references teacher_profiles.id)
  teacher_id IN (SELECT id FROM teacher_profiles WHERE user_id = auth.uid())
  OR
  -- User is the parent of the learner
  learner_id IN (SELECT id FROM learners WHERE parent_id = auth.uid())
);

-- Also ensure insert/update policies exist for service role
DROP POLICY IF EXISTS "Service can insert insights" ON lesson_insights;
CREATE POLICY "Service can insert insights" ON lesson_insights
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Service can update insights" ON lesson_insights;
CREATE POLICY "Service can update insights" ON lesson_insights
  FOR UPDATE USING (true);
