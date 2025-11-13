-- Fix missing columns across multiple tables

-- Add created_at to profiles if missing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Add email to profiles if missing (for easier querying)
-- Note: Email is in auth.users, but we can cache it here
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;

-- Add parent_id to lessons table for booking system
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES profiles(id);

-- Add student_id to lessons if missing
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS student_id uuid REFERENCES profiles(id);

-- Add created_at to lessons if missing
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Update existing profiles to have created_at from auth.users
UPDATE profiles
SET created_at = (
  SELECT created_at FROM auth.users WHERE auth.users.id = profiles.id
)
WHERE created_at IS NULL;

-- Create index on created_at for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_lessons_parent_id ON lessons(parent_id);
CREATE INDEX IF NOT EXISTS idx_lessons_student_id ON lessons(student_id);

-- Add comment
COMMENT ON COLUMN profiles.created_at IS 'When the profile was created';
COMMENT ON COLUMN profiles.email IS 'Cached email from auth.users for easier querying';
COMMENT ON COLUMN lessons.parent_id IS 'ID of the parent who booked the lesson (for child bookings)';
COMMENT ON COLUMN lessons.student_id IS 'ID of the student taking the lesson';
