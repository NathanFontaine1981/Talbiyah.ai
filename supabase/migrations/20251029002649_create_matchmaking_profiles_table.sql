/*
  # Create Matchmaking Profiles Table

  1. New Tables
    - `matchmaking_profiles`
      - `id` (uuid, primary key) - Unique identifier for each profile
      - `user_id` (uuid, foreign key, unique) - Links to profiles.id (one user = one profile)
      - `profile_data` (jsonb) - Flexible JSON storage for complete application form
        (age, location, background, preferences, 'what I am looking for', etc.)
      - `character_references` (text[]) - Array of reference names/contacts
      - `status` (text, default: 'pending_review') - Workflow tracking
        (e.g., 'pending_review', 'approved', 'matched', 'rejected')
      - `admin_notes` (text) - Private admin notes on the applicant
      - `created_at` (timestamptz) - Timestamp of profile creation
      - `updated_at` (timestamptz) - Timestamp of last update

  2. Security
    - Enable RLS on `matchmaking_profiles` table
    - Users can read and update their own profile
    - Users can insert their own profile
    - Only admin users can read all profiles (for matchmaking)
    - Only admin users can update status and admin_notes

  3. Notes
    - JSONB allows flexible storage of application form data
    - Status field enables workflow management
    - Admin-only access protects privacy of sensitive matchmaking data
    - Character references stored as array for easy management
*/

-- Create the matchmaking_profiles table
CREATE TABLE IF NOT EXISTS matchmaking_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  profile_data jsonb NOT NULL,
  character_references text[],
  status text DEFAULT 'pending_review',
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE matchmaking_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own matchmaking profile"
  ON matchmaking_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own matchmaking profile"
  ON matchmaking_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own profile data (but not status or admin_notes)
CREATE POLICY "Users can update own profile data"
  ON matchmaking_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid() AND
    status = (SELECT status FROM matchmaking_profiles WHERE user_id = auth.uid()) AND
    admin_notes = (SELECT admin_notes FROM matchmaking_profiles WHERE user_id = auth.uid())
  );

-- Policy: Admin users can read all profiles
CREATE POLICY "Admin users can read all matchmaking profiles"
  ON matchmaking_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- Policy: Admin users can insert profiles
CREATE POLICY "Admin users can insert matchmaking profiles"
  ON matchmaking_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- Policy: Admin users can update all profiles (including status and admin_notes)
CREATE POLICY "Admin users can update all matchmaking profiles"
  ON matchmaking_profiles
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

-- Policy: Admin users can delete profiles
CREATE POLICY "Admin users can delete matchmaking profiles"
  ON matchmaking_profiles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- Create index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_matchmaking_profiles_user_id ON matchmaking_profiles(user_id);

-- Create index for status-based queries (workflow management)
CREATE INDEX IF NOT EXISTS idx_matchmaking_profiles_status ON matchmaking_profiles(status);

-- Create GIN index for JSONB profile_data to enable fast queries on JSON fields
CREATE INDEX IF NOT EXISTS idx_matchmaking_profiles_profile_data ON matchmaking_profiles USING GIN (profile_data);

-- Create trigger to automatically update updated_at timestamp
DROP TRIGGER IF EXISTS update_matchmaking_profiles_updated_at ON matchmaking_profiles;
CREATE TRIGGER update_matchmaking_profiles_updated_at
  BEFORE UPDATE ON matchmaking_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
