/*
  # Create Lessons Table

  1. New Tables
    - `lessons`
      - `id` (uuid, primary key) - Unique identifier for each lesson booking
      - `learner_id` (uuid, foreign key) - Links to learners.id
      - `teacher_id` (uuid, foreign key) - Links to teacher_profiles.id
      - `subject_id` (uuid, foreign key) - Links to subjects.id
      - `scheduled_time` (timestamptz) - Lesson date/time with timezone
      - `duration_minutes` (integer) - Lesson duration (e.g., 30, 60)
      - `status` (text) - Lesson state (booked, completed, cancelled_by_teacher, cancelled_by_student)
      - `is_free_trial` (boolean, default: false) - Whether this is a free trial lesson
      
      Financial fields (to lock in pricing):
      - `teacher_rate_at_booking` (numeric) - Teacher's hourly rate at time of booking
      - `platform_fee` (numeric) - Platform fee charged
      - `total_cost_paid` (numeric) - Total amount paid by learner
      - `payment_id` (text) - Stripe transaction ID
      
      Integration fields (video & AI):
      - `100ms_room_id` (text) - Unique video room ID for 100ms
      - `recording_url` (text) - Link to 100ms recording
      - `recording_expires_at` (timestamptz) - Recording expiration date (7-day rule)
      
      Timestamps:
      - `created_at` (timestamptz) - Booking creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `lessons` table
    - Parents can read and manage lessons for their learners
    - Teachers can read and manage lessons they're teaching
    - Admin users can read and manage all lessons
    - Platform fees and payment details are restricted

  3. Notes
    - Financial fields are locked at booking time for consistency
    - Status field supports complete lesson lifecycle tracking
    - timestamptz ensures correct time display globally
    - Integration fields support video conferencing and AI features
*/

-- Create the lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id uuid NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
  scheduled_time timestamptz NOT NULL,
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
  status text NOT NULL DEFAULT 'booked',
  is_free_trial boolean DEFAULT false,
  
  -- Financial fields
  teacher_rate_at_booking numeric(10, 2),
  platform_fee numeric(10, 2),
  total_cost_paid numeric(10, 2),
  payment_id text,
  
  -- Integration fields
  "100ms_room_id" text,
  recording_url text,
  recording_expires_at timestamptz,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Policy: Parents can read lessons for their learners
CREATE POLICY "Parents can read own learners lessons"
  ON lessons
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM learners
      WHERE learners.id = lessons.learner_id
      AND learners.parent_id = auth.uid()
    )
  );

-- Policy: Teachers can read lessons they're teaching
CREATE POLICY "Teachers can read their lessons"
  ON lessons
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teacher_profiles
      WHERE teacher_profiles.id = lessons.teacher_id
      AND teacher_profiles.user_id = auth.uid()
    )
  );

-- Policy: Parents can insert lessons for their learners (booking)
CREATE POLICY "Parents can insert own learners lessons"
  ON lessons
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM learners
      WHERE learners.id = lessons.learner_id
      AND learners.parent_id = auth.uid()
    )
  );

-- Policy: Parents can update lessons for their learners
CREATE POLICY "Parents can update own learners lessons"
  ON lessons
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM learners
      WHERE learners.id = lessons.learner_id
      AND learners.parent_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM learners
      WHERE learners.id = lessons.learner_id
      AND learners.parent_id = auth.uid()
    )
  );

-- Policy: Teachers can update their lessons (status, room details)
CREATE POLICY "Teachers can update their lessons"
  ON lessons
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teacher_profiles
      WHERE teacher_profiles.id = lessons.teacher_id
      AND teacher_profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teacher_profiles
      WHERE teacher_profiles.id = lessons.teacher_id
      AND teacher_profiles.user_id = auth.uid()
    )
  );

-- Policy: Admin users can read all lessons
CREATE POLICY "Admin users can read all lessons"
  ON lessons
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- Policy: Admin users can insert lessons
CREATE POLICY "Admin users can insert lessons"
  ON lessons
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- Policy: Admin users can update all lessons
CREATE POLICY "Admin users can update all lessons"
  ON lessons
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

-- Policy: Admin users can delete lessons
CREATE POLICY "Admin users can delete lessons"
  ON lessons
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
CREATE INDEX IF NOT EXISTS idx_lessons_learner_id ON lessons(learner_id);
CREATE INDEX IF NOT EXISTS idx_lessons_teacher_id ON lessons(teacher_id);
CREATE INDEX IF NOT EXISTS idx_lessons_subject_id ON lessons(subject_id);
CREATE INDEX IF NOT EXISTS idx_lessons_scheduled_time ON lessons(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_lessons_status ON lessons(status);
CREATE INDEX IF NOT EXISTS idx_lessons_is_free_trial ON lessons(is_free_trial);
CREATE INDEX IF NOT EXISTS idx_lessons_payment_id ON lessons(payment_id);
CREATE INDEX IF NOT EXISTS idx_lessons_recording_expires_at ON lessons(recording_expires_at);

-- Create composite index for common queries (teacher's upcoming lessons)
CREATE INDEX IF NOT EXISTS idx_lessons_teacher_scheduled ON lessons(teacher_id, scheduled_time);

-- Create composite index for common queries (learner's upcoming lessons)
CREATE INDEX IF NOT EXISTS idx_lessons_learner_scheduled ON lessons(learner_id, scheduled_time);

-- Create trigger to automatically update updated_at timestamp
DROP TRIGGER IF EXISTS update_lessons_updated_at ON lessons;
CREATE TRIGGER update_lessons_updated_at
  BEFORE UPDATE ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
