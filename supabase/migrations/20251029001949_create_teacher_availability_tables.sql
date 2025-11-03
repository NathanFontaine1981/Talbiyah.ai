/*
  # Create Teacher Availability Tables

  1. New Tables
    - `teacher_availability_recurring`
      - `id` (uuid, primary key) - Unique identifier for each recurring availability slot
      - `teacher_id` (uuid, foreign key) - Links to teacher_profiles.id
      - `day_of_week` (integer) - Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
      - `start_time` (time) - Start time of availability (e.g., '18:00')
      - `end_time` (time) - End time of availability (e.g., '21:00')
      - `created_at` (timestamptz) - Timestamp of creation
      - `updated_at` (timestamptz) - Timestamp of last update

    - `teacher_availability_one_off`
      - `id` (uuid, primary key) - Unique identifier for each one-off availability slot
      - `teacher_id` (uuid, foreign key) - Links to teacher_profiles.id
      - `date` (date) - Specific date of availability (e.g., '2025-11-20')
      - `start_time` (time) - Start time of availability (e.g., '16:00')
      - `end_time` (time) - End time of availability (e.g., '18:00')
      - `created_at` (timestamptz) - Timestamp of creation
      - `updated_at` (timestamptz) - Timestamp of last update

  2. Security
    - Enable RLS on both tables
    - Teachers can read and manage their own availability
    - Authenticated users can read approved teachers' availability
    - Admin users can read all availability

  3. Notes
    - Recurring table handles weekly repeating availability patterns
    - One-off table handles specific dates (e.g., holidays, special events)
    - day_of_week uses 0-6 where 0=Sunday, 6=Saturday
    - Time columns store time without timezone for simplicity
*/

-- Create the teacher_availability_recurring table
CREATE TABLE IF NOT EXISTS teacher_availability_recurring (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (end_time > start_time)
);

-- Create the teacher_availability_one_off table
CREATE TABLE IF NOT EXISTS teacher_availability_one_off (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (end_time > start_time)
);

-- Enable Row Level Security on teacher_availability_recurring
ALTER TABLE teacher_availability_recurring ENABLE ROW LEVEL SECURITY;

-- Enable Row Level Security on teacher_availability_one_off
ALTER TABLE teacher_availability_one_off ENABLE ROW LEVEL SECURITY;

-- Policies for teacher_availability_recurring

-- Policy: Teachers can read their own recurring availability
CREATE POLICY "Teachers can read own recurring availability"
  ON teacher_availability_recurring
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teacher_profiles
      WHERE teacher_profiles.id = teacher_availability_recurring.teacher_id
      AND teacher_profiles.user_id = auth.uid()
    )
  );

-- Policy: Teachers can insert their own recurring availability
CREATE POLICY "Teachers can insert own recurring availability"
  ON teacher_availability_recurring
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teacher_profiles
      WHERE teacher_profiles.id = teacher_availability_recurring.teacher_id
      AND teacher_profiles.user_id = auth.uid()
    )
  );

-- Policy: Teachers can update their own recurring availability
CREATE POLICY "Teachers can update own recurring availability"
  ON teacher_availability_recurring
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teacher_profiles
      WHERE teacher_profiles.id = teacher_availability_recurring.teacher_id
      AND teacher_profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teacher_profiles
      WHERE teacher_profiles.id = teacher_availability_recurring.teacher_id
      AND teacher_profiles.user_id = auth.uid()
    )
  );

-- Policy: Teachers can delete their own recurring availability
CREATE POLICY "Teachers can delete own recurring availability"
  ON teacher_availability_recurring
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teacher_profiles
      WHERE teacher_profiles.id = teacher_availability_recurring.teacher_id
      AND teacher_profiles.user_id = auth.uid()
    )
  );

-- Policy: Authenticated users can read approved teachers' recurring availability
CREATE POLICY "Users can read approved teachers recurring availability"
  ON teacher_availability_recurring
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teacher_profiles
      WHERE teacher_profiles.id = teacher_availability_recurring.teacher_id
      AND teacher_profiles.status = 'approved'
    )
  );

-- Policy: Admin users can read all recurring availability
CREATE POLICY "Admin users can read all recurring availability"
  ON teacher_availability_recurring
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- Policies for teacher_availability_one_off

-- Policy: Teachers can read their own one-off availability
CREATE POLICY "Teachers can read own one-off availability"
  ON teacher_availability_one_off
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teacher_profiles
      WHERE teacher_profiles.id = teacher_availability_one_off.teacher_id
      AND teacher_profiles.user_id = auth.uid()
    )
  );

-- Policy: Teachers can insert their own one-off availability
CREATE POLICY "Teachers can insert own one-off availability"
  ON teacher_availability_one_off
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teacher_profiles
      WHERE teacher_profiles.id = teacher_availability_one_off.teacher_id
      AND teacher_profiles.user_id = auth.uid()
    )
  );

-- Policy: Teachers can update their own one-off availability
CREATE POLICY "Teachers can update own one-off availability"
  ON teacher_availability_one_off
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teacher_profiles
      WHERE teacher_profiles.id = teacher_availability_one_off.teacher_id
      AND teacher_profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teacher_profiles
      WHERE teacher_profiles.id = teacher_availability_one_off.teacher_id
      AND teacher_profiles.user_id = auth.uid()
    )
  );

-- Policy: Teachers can delete their own one-off availability
CREATE POLICY "Teachers can delete own one-off availability"
  ON teacher_availability_one_off
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teacher_profiles
      WHERE teacher_profiles.id = teacher_availability_one_off.teacher_id
      AND teacher_profiles.user_id = auth.uid()
    )
  );

-- Policy: Authenticated users can read approved teachers' one-off availability
CREATE POLICY "Users can read approved teachers one-off availability"
  ON teacher_availability_one_off
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teacher_profiles
      WHERE teacher_profiles.id = teacher_availability_one_off.teacher_id
      AND teacher_profiles.status = 'approved'
    )
  );

-- Policy: Admin users can read all one-off availability
CREATE POLICY "Admin users can read all one-off availability"
  ON teacher_availability_one_off
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- Create indexes for efficient lookups on teacher_availability_recurring
CREATE INDEX IF NOT EXISTS idx_recurring_teacher_id ON teacher_availability_recurring(teacher_id);
CREATE INDEX IF NOT EXISTS idx_recurring_day_of_week ON teacher_availability_recurring(day_of_week);

-- Create indexes for efficient lookups on teacher_availability_one_off
CREATE INDEX IF NOT EXISTS idx_one_off_teacher_id ON teacher_availability_one_off(teacher_id);
CREATE INDEX IF NOT EXISTS idx_one_off_date ON teacher_availability_one_off(date);

-- Create triggers to automatically update updated_at timestamp
DROP TRIGGER IF EXISTS update_recurring_updated_at ON teacher_availability_recurring;
CREATE TRIGGER update_recurring_updated_at
  BEFORE UPDATE ON teacher_availability_recurring
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_one_off_updated_at ON teacher_availability_one_off;
CREATE TRIGGER update_one_off_updated_at
  BEFORE UPDATE ON teacher_availability_one_off
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
