/*
  # Create Teacher Availability System

  1. New Tables
    - `teacher_availability`
      - `id` (uuid, primary key) - Unique identifier for availability slot
      - `teacher_id` (uuid) - References teacher_profiles table
      - `day_of_week` (integer) - Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
      - `start_time` (time) - Start time of availability slot
      - `end_time` (time) - End time of availability slot
      - `is_available` (boolean) - Whether teacher is available during this time
      - `created_at` (timestamptz) - Timestamp when record was created
      - `updated_at` (timestamptz) - Timestamp when record was last updated

  2. Security
    - Enable RLS on `teacher_availability` table
    - Teachers can view and manage their own availability
    - Students and admins can view all teacher availability for booking purposes

  3. Indexes
    - Index on teacher_id for fast lookups
    - Composite index on (teacher_id, day_of_week, is_available) for booking queries
*/

CREATE TABLE IF NOT EXISTS teacher_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_teacher_availability_teacher_id ON teacher_availability(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_availability_lookup ON teacher_availability(teacher_id, day_of_week, is_available);

ALTER TABLE teacher_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view own availability"
  ON teacher_availability FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teacher_profiles
      WHERE teacher_profiles.id = teacher_availability.teacher_id
      AND teacher_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can insert own availability"
  ON teacher_availability FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teacher_profiles
      WHERE teacher_profiles.id = teacher_availability.teacher_id
      AND teacher_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update own availability"
  ON teacher_availability FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teacher_profiles
      WHERE teacher_profiles.id = teacher_availability.teacher_id
      AND teacher_profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teacher_profiles
      WHERE teacher_profiles.id = teacher_availability.teacher_id
      AND teacher_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can delete own availability"
  ON teacher_availability FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teacher_profiles
      WHERE teacher_profiles.id = teacher_availability.teacher_id
      AND teacher_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Everyone can view teacher availability for booking"
  ON teacher_availability FOR SELECT
  TO authenticated
  USING (true);

CREATE OR REPLACE FUNCTION update_teacher_availability_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_teacher_availability_timestamp
  BEFORE UPDATE ON teacher_availability
  FOR EACH ROW
  EXECUTE FUNCTION update_teacher_availability_timestamp();
