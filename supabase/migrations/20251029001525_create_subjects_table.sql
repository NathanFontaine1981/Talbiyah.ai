/*
  # Create Subjects Table

  1. New Tables
    - `subjects`
      - `id` (uuid, primary key) - Unique identifier for each subject
      - `name` (text) - Subject name (e.g., 'Quran with Understanding', 'Arabic Language')
      - `ai_prompt_template` (text) - Large text field for unique AI prompt for Talbiyah Insights
      - `syllabus_url` (text) - Link to PDF syllabus for teachers to download
      - `created_at` (timestamptz) - Timestamp of subject creation
      - `updated_at` (timestamptz) - Timestamp of last update

  2. Security
    - Enable RLS on `subjects` table
    - Add policy for authenticated users to read all subjects
    - Add policy for admin users to insert new subjects
    - Add policy for admin users to update subjects
    - Add policy for admin users to delete subjects

  3. Notes
    - This is the master list of all courses and subjects offered
    - ai_prompt_template is critical for Talbiyah Insights functionality
    - syllabus_url provides downloadable resources for teachers
*/

-- Create the subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  ai_prompt_template text,
  syllabus_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read subjects
CREATE POLICY "Authenticated users can read subjects"
  ON subjects
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Admin users can insert subjects
CREATE POLICY "Admin users can insert subjects"
  ON subjects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- Policy: Admin users can update subjects
CREATE POLICY "Admin users can update subjects"
  ON subjects
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

-- Policy: Admin users can delete subjects
CREATE POLICY "Admin users can delete subjects"
  ON subjects
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- Create index for name lookups
CREATE INDEX IF NOT EXISTS idx_subjects_name ON subjects(name);

-- Create trigger to automatically update updated_at timestamp
DROP TRIGGER IF EXISTS update_subjects_updated_at ON subjects;
CREATE TRIGGER update_subjects_updated_at
  BEFORE UPDATE ON subjects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
