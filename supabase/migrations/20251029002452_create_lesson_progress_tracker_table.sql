/*
  # Create Lesson Progress Tracker Table

  1. New Tables
    - `lesson_progress_tracker`
      - `id` (uuid, primary key) - Unique identifier for each progress record
      - `learner_id` (uuid, foreign key) - Links to learners.id
      - `subject_id` (uuid, foreign key) - Links to subjects.id
      - `topic` (text) - Name of the topic (e.g., 'Surah Al-Fatiha')
      
      3-Stage Progress System:
      - `understanding_complete` (boolean, default: false) - Stage 1: Understanding achieved
      - `fluency_complete` (boolean, default: false) - Stage 2: Fluency achieved
      - `memorization_complete` (boolean, default: false) - Stage 3: Memorization achieved
      
      - `teacher_notes` (text) - Teacher's notes on learner progress for this topic
      - `created_at` (timestamptz) - Timestamp of progress record creation
      - `updated_at` (timestamptz) - Timestamp of last update

  2. Security
    - Enable RLS on `lesson_progress_tracker` table
    - Parents can read progress for their learners
    - Teachers can read and update progress for their students
    - Admin users can read and manage all progress records

  3. Notes
    - Composite unique constraint on (learner_id, subject_id, topic) prevents duplicates
    - 3-stage system tracks: Understanding → Fluency → Memorization
    - Teachers can add detailed notes on learner progress
    - Progress is tracked per topic within each subject for granular monitoring
*/

-- Create the lesson_progress_tracker table
CREATE TABLE IF NOT EXISTS lesson_progress_tracker (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id uuid NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  topic text NOT NULL,
  
  -- 3-Stage Progress System
  understanding_complete boolean DEFAULT false,
  fluency_complete boolean DEFAULT false,
  memorization_complete boolean DEFAULT false,
  
  teacher_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Composite unique constraint to prevent duplicate progress records
  UNIQUE (learner_id, subject_id, topic)
);

-- Enable Row Level Security
ALTER TABLE lesson_progress_tracker ENABLE ROW LEVEL SECURITY;

-- Policy: Parents can read progress for their learners
CREATE POLICY "Parents can read own learners progress"
  ON lesson_progress_tracker
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM learners
      WHERE learners.id = lesson_progress_tracker.learner_id
      AND learners.parent_id = auth.uid()
    )
  );

-- Policy: Teachers can read progress for learners they teach
CREATE POLICY "Teachers can read learner progress"
  ON lesson_progress_tracker
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN teacher_profiles ON teacher_profiles.id = lessons.teacher_id
      WHERE lessons.learner_id = lesson_progress_tracker.learner_id
      AND lessons.subject_id = lesson_progress_tracker.subject_id
      AND teacher_profiles.user_id = auth.uid()
    )
  );

-- Policy: Teachers can insert progress records for their students
CREATE POLICY "Teachers can insert learner progress"
  ON lesson_progress_tracker
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN teacher_profiles ON teacher_profiles.id = lessons.teacher_id
      WHERE lessons.learner_id = lesson_progress_tracker.learner_id
      AND lessons.subject_id = lesson_progress_tracker.subject_id
      AND teacher_profiles.user_id = auth.uid()
    )
  );

-- Policy: Teachers can update progress for their students
CREATE POLICY "Teachers can update learner progress"
  ON lesson_progress_tracker
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN teacher_profiles ON teacher_profiles.id = lessons.teacher_id
      WHERE lessons.learner_id = lesson_progress_tracker.learner_id
      AND lessons.subject_id = lesson_progress_tracker.subject_id
      AND teacher_profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN teacher_profiles ON teacher_profiles.id = lessons.teacher_id
      WHERE lessons.learner_id = lesson_progress_tracker.learner_id
      AND lessons.subject_id = lesson_progress_tracker.subject_id
      AND teacher_profiles.user_id = auth.uid()
    )
  );

-- Policy: Admin users can read all progress records
CREATE POLICY "Admin users can read all progress"
  ON lesson_progress_tracker
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- Policy: Admin users can insert progress records
CREATE POLICY "Admin users can insert progress"
  ON lesson_progress_tracker
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- Policy: Admin users can update all progress records
CREATE POLICY "Admin users can update all progress"
  ON lesson_progress_tracker
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

-- Policy: Admin users can delete progress records
CREATE POLICY "Admin users can delete progress"
  ON lesson_progress_tracker
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_progress_learner_id ON lesson_progress_tracker(learner_id);
CREATE INDEX IF NOT EXISTS idx_progress_subject_id ON lesson_progress_tracker(subject_id);
CREATE INDEX IF NOT EXISTS idx_progress_topic ON lesson_progress_tracker(topic);

-- Create composite index for common queries (learner's progress in a subject)
CREATE INDEX IF NOT EXISTS idx_progress_learner_subject ON lesson_progress_tracker(learner_id, subject_id);

-- Create trigger to automatically update updated_at timestamp
DROP TRIGGER IF EXISTS update_progress_updated_at ON lesson_progress_tracker;
CREATE TRIGGER update_progress_updated_at
  BEFORE UPDATE ON lesson_progress_tracker
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
