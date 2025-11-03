/*
  # Create Teacher Profiles Table

  1. New Tables
    - `teacher_profiles`
      - `id` (uuid, primary key) - Unique identifier for each teacher profile
      - `user_id` (uuid, foreign key, unique) - Links to profiles.id of the account holder
      - `bio` (text) - Public-facing biography
      - `hourly_rate` (numeric) - Amount in GBP they want to be paid (e.g., 5.00)
      - `status` (text, default: 'pending_approval') - Approval workflow status
      - `is_talbiyah_certified` (boolean, default: false) - Certification status
      - `video_intro_url` (text) - Link to introductory video
      - `created_at` (timestamptz) - Timestamp of profile creation
      - `updated_at` (timestamptz) - Timestamp of last update

  2. Security
    - Enable RLS on `teacher_profiles` table
    - Add policy for users to read their own teacher profile
    - Add policy for users to insert their own teacher profile
    - Add policy for users to update their own teacher profile
    - Add policy for authenticated users to read approved teacher profiles
    - Add policy for admin users to update any teacher profile (for approval workflow)

  3. Notes
    - user_id is unique to ensure one user can only have one teacher profile
    - Status field supports approval workflow for teacher applications
    - Hourly rate stored as numeric for precise currency calculations
*/

-- Create the teacher_profiles table
CREATE TABLE IF NOT EXISTS teacher_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  bio text,
  hourly_rate numeric(10, 2),
  status text DEFAULT 'pending_approval' NOT NULL,
  is_talbiyah_certified boolean DEFAULT false,
  video_intro_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own teacher profile
CREATE POLICY "Users can read own teacher profile"
  ON teacher_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Users can insert their own teacher profile
CREATE POLICY "Users can insert own teacher profile"
  ON teacher_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own teacher profile
CREATE POLICY "Users can update own teacher profile"
  ON teacher_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Authenticated users can read approved teacher profiles
CREATE POLICY "Users can read approved teacher profiles"
  ON teacher_profiles
  FOR SELECT
  TO authenticated
  USING (status = 'approved');

-- Policy: Admin users can read all teacher profiles (for approval workflow)
CREATE POLICY "Admin users can read all teacher profiles"
  ON teacher_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- Policy: Admin users can update any teacher profile (for approval workflow)
CREATE POLICY "Admin users can update teacher profiles"
  ON teacher_profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- Policy: Admin users can delete teacher profiles
CREATE POLICY "Admin users can delete teacher profiles"
  ON teacher_profiles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- Create index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_teacher_profiles_user_id ON teacher_profiles(user_id);

-- Create index for status lookups (important for filtering by approval status)
CREATE INDEX IF NOT EXISTS idx_teacher_profiles_status ON teacher_profiles(status);

-- Create trigger to automatically update updated_at timestamp
DROP TRIGGER IF EXISTS update_teacher_profiles_updated_at ON teacher_profiles;
CREATE TRIGGER update_teacher_profiles_updated_at
  BEFORE UPDATE ON teacher_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
