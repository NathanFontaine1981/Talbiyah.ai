-- Fix RLS policies for parent_children table to allow parents to create child links

-- Drop and recreate INSERT policy with proper WITH CHECK clause
-- The WITH CHECK clause ensures that only authenticated users can insert rows
-- where they are the parent_id
DROP POLICY IF EXISTS "Parents can insert their own children" ON parent_children;
CREATE POLICY "Parents can insert their own children"
  ON parent_children
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = parent_id);

-- Add DELETE policy to allow parents to remove child links
DROP POLICY IF EXISTS "Parents can delete their own children" ON parent_children;
CREATE POLICY "Parents can delete their own children"
  ON parent_children
  FOR DELETE
  TO authenticated
  USING (auth.uid() = parent_id);

-- Comments for documentation
COMMENT ON POLICY "Parents can insert their own children" ON parent_children IS
  'Allows authenticated users to create parent-child links where they are the parent';
COMMENT ON POLICY "Parents can delete their own children" ON parent_children IS
  'Allows parents to remove their child links (unlink children from their account)';
