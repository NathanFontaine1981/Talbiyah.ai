-- Fix RLS policies for homework_sessions to support student accounts
-- Students may use their user.id directly as learner_id when not in parent/child setup

-- Drop existing policies
DROP POLICY IF EXISTS "Learners can view own homework" ON homework_sessions;
DROP POLICY IF EXISTS "Learners can insert own homework" ON homework_sessions;
DROP POLICY IF EXISTS "Learners can update own homework" ON homework_sessions;

-- Recreate with support for both parent-child and direct student access
CREATE POLICY "Users can view own homework" ON homework_sessions
  FOR SELECT
  USING (
    -- Parent viewing child's homework
    learner_id IN (
      SELECT id FROM learners WHERE parent_id = auth.uid()
    )
    OR
    -- Student using their user.id directly as learner_id
    learner_id = auth.uid()
  );

CREATE POLICY "Users can insert own homework" ON homework_sessions
  FOR INSERT
  WITH CHECK (
    -- Parent creating homework for child
    learner_id IN (
      SELECT id FROM learners WHERE parent_id = auth.uid()
    )
    OR
    -- Student using their user.id directly as learner_id
    learner_id = auth.uid()
  );

CREATE POLICY "Users can update own homework" ON homework_sessions
  FOR UPDATE
  USING (
    -- Parent updating child's homework
    learner_id IN (
      SELECT id FROM learners WHERE parent_id = auth.uid()
    )
    OR
    -- Student using their user.id directly as learner_id
    learner_id = auth.uid()
  );
