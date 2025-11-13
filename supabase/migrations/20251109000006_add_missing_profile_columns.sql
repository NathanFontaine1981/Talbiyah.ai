-- Add missing columns to profiles table

-- Add phone_number if missing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number text;

-- Add gender if missing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender text;

-- Add timezone if missing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone text;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_timezone ON profiles(timezone);

-- Add comments
COMMENT ON COLUMN profiles.phone_number IS 'User phone number for contact';
COMMENT ON COLUMN profiles.gender IS 'User gender (male/female)';
COMMENT ON COLUMN profiles.timezone IS 'User timezone for scheduling';
