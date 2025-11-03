/*
  # Create Lesson Messages Table

  1. New Tables
    - `lesson_messages`
      - `id` (uuid, primary key) - Unique identifier for each message
      - `lesson_id` (uuid, foreign key) - Links to lessons.id (groups messages by booking)
      - `sender_id` (uuid, foreign key) - Links to profiles.id (message sender)
      - `receiver_id` (uuid, foreign key) - Links to profiles.id (message receiver)
      - `message_text` (text) - The message content
      - `created_at` (timestamptz, default: now()) - Timestamp of message creation
      - `is_read` (boolean, default: false) - Whether the message has been read

  2. Security
    - Enable RLS on `lesson_messages` table
    - Users can read messages where they are sender or receiver
    - Users can send messages for lessons they're involved in
    - Users can update read status for messages they received
    - Admin users can read all messages

  3. Notes
    - Messages are grouped by lesson_id for organized conversation threads
    - is_read flag enables unread message tracking
    - Both sender and receiver can view their message history
    - Index on lesson_id ensures fast chat history loading
*/

-- Create the lesson_messages table
CREATE TABLE IF NOT EXISTS lesson_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message_text text NOT NULL,
  created_at timestamptz DEFAULT now(),
  is_read boolean DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE lesson_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read messages where they are sender or receiver
CREATE POLICY "Users can read own messages"
  ON lesson_messages
  FOR SELECT
  TO authenticated
  USING (
    sender_id = auth.uid() OR receiver_id = auth.uid()
  );

-- Policy: Users can send messages for lessons they're involved in (as parent of learner or as teacher)
CREATE POLICY "Users can send messages for their lessons"
  ON lesson_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND (
      -- User is the parent of the learner in this lesson
      EXISTS (
        SELECT 1 FROM lessons
        JOIN learners ON learners.id = lessons.learner_id
        WHERE lessons.id = lesson_messages.lesson_id
        AND learners.parent_id = auth.uid()
      )
      OR
      -- User is the teacher in this lesson
      EXISTS (
        SELECT 1 FROM lessons
        JOIN teacher_profiles ON teacher_profiles.id = lessons.teacher_id
        WHERE lessons.id = lesson_messages.lesson_id
        AND teacher_profiles.user_id = auth.uid()
      )
    )
  );

-- Policy: Users can update read status for messages they received
CREATE POLICY "Users can mark own messages as read"
  ON lesson_messages
  FOR UPDATE
  TO authenticated
  USING (receiver_id = auth.uid())
  WITH CHECK (receiver_id = auth.uid());

-- Policy: Admin users can read all messages
CREATE POLICY "Admin users can read all messages"
  ON lesson_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- Policy: Admin users can insert messages
CREATE POLICY "Admin users can insert messages"
  ON lesson_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- Policy: Admin users can update all messages
CREATE POLICY "Admin users can update all messages"
  ON lesson_messages
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

-- Policy: Admin users can delete messages
CREATE POLICY "Admin users can delete messages"
  ON lesson_messages
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- Create index for fast chat history loading by lesson
CREATE INDEX IF NOT EXISTS idx_lesson_messages_lesson_id ON lesson_messages(lesson_id);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_lesson_messages_sender_id ON lesson_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_lesson_messages_receiver_id ON lesson_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_lesson_messages_is_read ON lesson_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_lesson_messages_created_at ON lesson_messages(created_at);

-- Create composite index for common queries (unread messages for a user)
CREATE INDEX IF NOT EXISTS idx_lesson_messages_receiver_unread ON lesson_messages(receiver_id, is_read);

-- Create composite index for chronological message ordering within a lesson
CREATE INDEX IF NOT EXISTS idx_lesson_messages_lesson_time ON lesson_messages(lesson_id, created_at);
