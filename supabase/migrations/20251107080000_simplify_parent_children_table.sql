-- Simplify parent_children table to link parent profiles to child profiles
-- Children are now full independent student accounts

-- Remove child_name and child_age columns (no longer needed)
ALTER TABLE parent_children
  DROP COLUMN IF EXISTS child_name,
  DROP COLUMN IF EXISTS child_age;

-- Ensure foreign key constraint exists
-- (This may already exist, so we use IF NOT EXISTS logic via DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'parent_children_child_id_fkey'
  ) THEN
    ALTER TABLE parent_children
      ADD CONSTRAINT parent_children_child_id_fkey
      FOREIGN KEY (child_id)
      REFERENCES profiles(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- Add comment to clarify the table structure
COMMENT ON TABLE parent_children IS 'Links parent accounts to child accounts. Both parent and child are full profiles with independent logins.';
COMMENT ON COLUMN parent_children.parent_id IS 'Parent user profile ID (references profiles)';
COMMENT ON COLUMN parent_children.child_id IS 'Child user profile ID (references profiles)';
