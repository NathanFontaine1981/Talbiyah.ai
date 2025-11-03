/*
  # Create Talbiyah Insights Table

  1. New Tables
    - `talbiyah_insights`
      - `id` (uuid, primary key) - Unique identifier for each insight record
      - `lesson_id` (uuid, foreign key, unique) - Links to lessons.id (one-to-one relationship)
      - `full_transcript` (text) - Complete audio transcript of the lesson
      - `summary` (text) - AI-generated summary of the lesson
      - `key_concepts` (text[]) - Array of key concepts covered (bullet points)
      - `homework_tasks` (text[]) - Array of homework tasks assigned (bullet points)
      - `reflection_questions` (text[]) - Array of reflection questions (bullet points)
      - `created_at` (timestamptz) - Timestamp of insight generation
      - `updated_at` (timestamptz) - Timestamp of last update

  2. Security
    - Enable RLS on `talbiyah_insights` table
    - Parents can read insights for their learners' lessons
    - Teachers can read insights for their lessons
    - Admin users can read all insights
    - Only system/admin can insert or update insights

  3. Notes
    - One lesson can only have one set of insights (enforced by unique constraint)
    - AI-generated content is stored for each completed lesson
    - Text arrays allow flexible storage of multiple bullet points
    - Insights are generated after lesson completion and recording processing
*/

-- Create the talbiyah_insights table
CREATE TABLE IF NOT EXISTS talbiyah_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL UNIQUE REFERENCES lessons(id) ON DELETE CASCADE,
  full_transcript text,
  summary text,
  key_concepts text[],
  homework_tasks text[],
  reflection_questions text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE talbiyah_insights ENABLE ROW LEVEL SECURITY;

-- Policy: Parents can read insights for their learners' lessons
CREATE POLICY "Parents can read own learners lesson insights"
  ON talbiyah_insights
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN learners ON learners.id = lessons.learner_id
      WHERE lessons.id = talbiyah_insights.lesson_id
      AND learners.parent_id = auth.uid()
    )
  );

-- Policy: Teachers can read insights for their lessons
CREATE POLICY "Teachers can read their lesson insights"
  ON talbiyah_insights
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN teacher_profiles ON teacher_profiles.id = lessons.teacher_id
      WHERE lessons.id = talbiyah_insights.lesson_id
      AND teacher_profiles.user_id = auth.uid()
    )
  );

-- Policy: Admin users can read all insights
CREATE POLICY "Admin users can read all insights"
  ON talbiyah_insights
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- Policy: Admin users can insert insights
CREATE POLICY "Admin users can insert insights"
  ON talbiyah_insights
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- Policy: Admin users can update insights
CREATE POLICY "Admin users can update insights"
  ON talbiyah_insights
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

-- Policy: Admin users can delete insights
CREATE POLICY "Admin users can delete insights"
  ON talbiyah_insights
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- Create index for fast lesson_id lookups
CREATE INDEX IF NOT EXISTS idx_talbiyah_insights_lesson_id ON talbiyah_insights(lesson_id);

-- Create trigger to automatically update updated_at timestamp
DROP TRIGGER IF EXISTS update_talbiyah_insights_updated_at ON talbiyah_insights;
CREATE TRIGGER update_talbiyah_insights_updated_at
  BEFORE UPDATE ON talbiyah_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
