/*
  # Create Ayah-Level Progress Tracking System

  1. New Tables
    - `ayah_progress`
      - `id` (uuid, primary key) - Unique identifier
      - `learner_id` (uuid, foreign key) - Links to learners table
      - `surah_number` (integer) - Surah number (1-114)
      - `ayah_number` (integer) - Ayah number within the Surah
      - `understanding_complete` (boolean, default: false) - Understanding stage complete
      - `fluency_complete` (boolean, default: false) - Fluency stage complete
      - `memorization_complete` (boolean, default: false) - Memorization stage complete
      - `teacher_notes` (text) - Optional notes from teacher
      - `created_at` (timestamptz) - Timestamp of creation
      - `updated_at` (timestamptz) - Timestamp of last update

  2. Security
    - Enable RLS on `ayah_progress` table
    - Add policy for learners to read their own progress
    - Add policy for learners to insert their own progress
    - Add policy for learners to update their own progress
    - Add policy for teachers to read their students' progress
    - Add policy for teachers to update their students' progress

  3. Indexes
    - Create composite index on (learner_id, surah_number, ayah_number) for fast lookups
    - Create index on learner_id for filtering by learner

  4. Notes
    - This replaces Surah-level tracking with precise Ayah-level tracking
    - The Quran has 6,236 total Ayahs across 114 Surahs
    - Progress is now tracked at the most granular level possible
    - Overall progress is calculated as (total memorized Ayahs / 6236) * 100
*/

-- Create the ayah_progress table
CREATE TABLE IF NOT EXISTS ayah_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id uuid NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  surah_number integer NOT NULL CHECK (surah_number >= 1 AND surah_number <= 114),
  ayah_number integer NOT NULL CHECK (ayah_number >= 1),
  understanding_complete boolean DEFAULT false NOT NULL,
  fluency_complete boolean DEFAULT false NOT NULL,
  memorization_complete boolean DEFAULT false NOT NULL,
  teacher_notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(learner_id, surah_number, ayah_number)
);

-- Enable Row Level Security
ALTER TABLE ayah_progress ENABLE ROW LEVEL SECURITY;

-- Policy: Learners can read their own progress
CREATE POLICY "Learners can read own ayah progress"
  ON ayah_progress
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM learners
      WHERE learners.id = ayah_progress.learner_id
      AND learners.parent_id = auth.uid()
    )
  );

-- Policy: Learners can insert their own progress
CREATE POLICY "Learners can insert own ayah progress"
  ON ayah_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM learners
      WHERE learners.id = ayah_progress.learner_id
      AND learners.parent_id = auth.uid()
    )
  );

-- Policy: Learners can update their own progress
CREATE POLICY "Learners can update own ayah progress"
  ON ayah_progress
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM learners
      WHERE learners.id = ayah_progress.learner_id
      AND learners.parent_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM learners
      WHERE learners.id = ayah_progress.learner_id
      AND learners.parent_id = auth.uid()
    )
  );

-- Policy: Teachers can read their students' progress
CREATE POLICY "Teachers can read student ayah progress"
  ON ayah_progress
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN teacher_profiles ON teacher_profiles.id = lessons.teacher_id
      WHERE lessons.learner_id = ayah_progress.learner_id
      AND teacher_profiles.user_id = auth.uid()
    )
  );

-- Policy: Teachers can update their students' progress
CREATE POLICY "Teachers can update student ayah progress"
  ON ayah_progress
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN teacher_profiles ON teacher_profiles.id = lessons.teacher_id
      WHERE lessons.learner_id = ayah_progress.learner_id
      AND teacher_profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN teacher_profiles ON teacher_profiles.id = lessons.teacher_id
      WHERE lessons.learner_id = ayah_progress.learner_id
      AND teacher_profiles.user_id = auth.uid()
    )
  );

-- Create composite index for fast lookups
CREATE INDEX IF NOT EXISTS idx_ayah_progress_learner_surah_ayah
  ON ayah_progress(learner_id, surah_number, ayah_number);

-- Create index for learner filtering
CREATE INDEX IF NOT EXISTS idx_ayah_progress_learner_id
  ON ayah_progress(learner_id);

-- Create index for memorization filtering (for overall progress calculation)
CREATE INDEX IF NOT EXISTS idx_ayah_progress_memorization
  ON ayah_progress(learner_id, memorization_complete)
  WHERE memorization_complete = true;

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ayah_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_ayah_progress_updated_at ON ayah_progress;
CREATE TRIGGER update_ayah_progress_updated_at
  BEFORE UPDATE ON ayah_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_ayah_progress_updated_at();
