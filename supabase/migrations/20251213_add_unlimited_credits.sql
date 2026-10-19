-- Add unlimited_credits flag to profiles table for gold/admin accounts
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS unlimited_credits BOOLEAN DEFAULT FALSE;

-- Create index for quick lookup
CREATE INDEX IF NOT EXISTS idx_profiles_unlimited_credits ON profiles(unlimited_credits) WHERE unlimited_credits = TRUE;

-- Comment for documentation
COMMENT ON COLUMN profiles.unlimited_credits IS 'When true, user has unlimited lesson credits (bypasses credit checks)';
