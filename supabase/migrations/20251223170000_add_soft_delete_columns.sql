-- Add soft delete columns to profiles table
-- Enables two-tier deletion: soft delete (1 year grace) -> hard delete

-- Add deletion tracking columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hard_delete_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- Create index for efficient cleanup job queries
CREATE INDEX IF NOT EXISTS idx_profiles_hard_delete
  ON profiles(hard_delete_at)
  WHERE hard_delete_at IS NOT NULL AND deleted_at IS NOT NULL;

-- Create index for finding deleted users
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at
  ON profiles(deleted_at)
  WHERE deleted_at IS NOT NULL;

-- Add comment explaining the columns
COMMENT ON COLUMN profiles.deleted_at IS 'When the user was soft-deleted. NULL means active.';
COMMENT ON COLUMN profiles.hard_delete_at IS 'When the user will be permanently deleted. Set to deleted_at + 1 year.';
COMMENT ON COLUMN profiles.deleted_by IS 'Admin who performed the deletion.';
COMMENT ON COLUMN profiles.deletion_reason IS 'Optional reason for the deletion.';
