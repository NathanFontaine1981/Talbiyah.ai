/*
  # Create Teacher Subjects Join Table

  1. New Tables
    - `teacher_subjects`
      - `teacher_id` (uuid, foreign key) - Links to teacher_profiles.id
      - `subject_id` (uuid, foreign key) - Links to subjects.id
      - `created_at` (timestamptz) - Timestamp of assignment
      - Composite primary key (teacher_id, subject_id) - Ensures unique teacher-subject pairs

  2. Security
    - Enable RLS on `teacher_subjects` table
    - Add policy for teachers to read their own subject assignments
    - Add policy for authenticated users to read approved teachers' subject assignments
    - Add policy for admin users to insert subject assignments
    - Add policy for admin users to delete subject assignments

  3. Notes
    - This is a many-to-many join table connecting teachers and subjects
    - Composite primary key prevents duplicate teacher-subject pairs
    - A teacher can teach multiple subjects, and a subject can have multiple teachers
*/

-- Create the teacher_subjects table
CREATE TABLE IF NOT EXISTS teacher_subjects (
  teacher_id uuid NOT NULL REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (teacher_id, subject_id)
);

-- Enable Row Level Security
ALTER TABLE teacher_subjects ENABLE ROW LEVEL SECURITY;

-- Policy: Teachers can read their own subject assignments
CREATE POLICY "Teachers can read own subject assignments"
  ON teacher_subjects
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teacher_profiles
      WHERE teacher_profiles.id = teacher_subjects.teacher_id
      AND teacher_profiles.user_id = auth.uid()
    )
  );

-- Policy: Authenticated users can read approved teachers' subject assignments
CREATE POLICY "Users can read approved teachers subject assignments"
  ON teacher_subjects
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teacher_profiles
      WHERE teacher_profiles.id = teacher_subjects.teacher_id
      AND teacher_profiles.status = 'approved'
    )
  );

-- Policy: Admin users can read all subject assignments
CREATE POLICY "Admin users can read all subject assignments"
  ON teacher_subjects
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- Policy: Admin users can insert subject assignments
CREATE POLICY "Admin users can insert subject assignments"
  ON teacher_subjects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- Policy: Admin users can delete subject assignments
CREATE POLICY "Admin users can delete subject assignments"
  ON teacher_subjects
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
CREATE INDEX IF NOT EXISTS idx_teacher_subjects_teacher_id ON teacher_subjects(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_subjects_subject_id ON teacher_subjects(subject_id);
