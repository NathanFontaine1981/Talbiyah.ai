-- Fix RLS policy to allow parents to view their own learners
-- This is required for the dashboard to display learner data

-- Drop existing policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Parents can view own learners" ON learners;

-- Create policy allowing parents to view their own learners
CREATE POLICY "Parents can view own learners"
ON learners
FOR SELECT
TO authenticated
USING (parent_id = auth.uid());

-- Also ensure parents can update their own learners
DROP POLICY IF EXISTS "Parents can update own learners" ON learners;

CREATE POLICY "Parents can update own learners"
ON learners
FOR UPDATE
TO authenticated
USING (parent_id = auth.uid())
WITH CHECK (parent_id = auth.uid());

-- Allow parents to insert learners for themselves
DROP POLICY IF EXISTS "Parents can insert own learners" ON learners;

CREATE POLICY "Parents can insert own learners"
ON learners
FOR INSERT
TO authenticated
WITH CHECK (parent_id = auth.uid());
