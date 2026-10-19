-- Add email_notifications column to profiles table for user notification preferences
-- Default to true (opt-in by default for existing users)

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;

-- Add comment explaining the column
COMMENT ON COLUMN profiles.email_notifications IS 'Whether the user wants to receive email notifications for Khutbah Reflections and other updates';
