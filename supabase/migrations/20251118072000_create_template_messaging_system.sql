-- Template-Based Messaging System with Anti-Poaching Protection
-- This system prevents teachers from contacting students outside the platform
-- All communication uses pre-approved templates with content filtering

-- Message templates (pre-defined messages)
CREATE TABLE IF NOT EXISTS message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_code text UNIQUE NOT NULL,
  template_text text NOT NULL,
  sender_role text NOT NULL, -- 'student' or 'teacher'
  requires_response boolean DEFAULT false,
  requires_data jsonb, -- e.g., {"type": "datetime"} for rescheduling
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),

  CONSTRAINT valid_sender_role CHECK (sender_role IN ('student', 'teacher'))
);

-- Drop existing lesson_messages table if it exists (from old schema)
DROP TABLE IF EXISTS lesson_messages CASCADE;

-- Lesson messages (template-based communication)
CREATE TABLE lesson_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES profiles(id) NOT NULL,
  sender_role text NOT NULL,

  -- Template information
  template_id uuid REFERENCES message_templates(id),
  template_code text NOT NULL,
  message_text text NOT NULL, -- Generated from template

  -- Optional data (e.g., new datetime for reschedule)
  message_data jsonb,

  -- Status tracking
  status text DEFAULT 'sent',
  read_at timestamptz,
  responded_at timestamptz,

  -- Threading (for responses)
  parent_message_id uuid REFERENCES lesson_messages(id),

  created_at timestamptz DEFAULT now(),

  CONSTRAINT valid_sender_role CHECK (sender_role IN ('student', 'teacher')),
  CONSTRAINT valid_status CHECK (status IN ('sent', 'read', 'approved', 'declined'))
);

-- Audit log (detect poaching attempts)
CREATE TABLE IF NOT EXISTS message_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  lesson_id uuid REFERENCES lessons(id),
  attempted_message text,
  flagged_reason text NOT NULL,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now(),

  CONSTRAINT valid_flag_reason CHECK (
    flagged_reason IN (
      'phone_number',
      'email',
      'whatsapp',
      'telegram',
      'facebook',
      'instagram',
      'external_contact',
      'rate_limit',
      'suspicious_pattern'
    )
  )
);

-- Message read receipts (for real-time UI updates)
CREATE TABLE IF NOT EXISTS message_read_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES lesson_messages(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) NOT NULL,
  read_at timestamptz DEFAULT now(),

  UNIQUE(message_id, user_id)
);

-- Seed message templates
INSERT INTO message_templates (template_code, template_text, sender_role, requires_response, requires_data, display_order) VALUES

-- Student templates
('student_reschedule', 'I need to reschedule this lesson. Can we move it to {new_datetime}?', 'student', true, '{"type": "datetime"}', 1),
('student_late', 'I''m running late, I''ll be there in {minutes} minutes', 'student', false, '{"type": "minutes", "options": [5, 10, 15, 20]}', 2),
('student_cancel', 'I need to cancel this lesson. Sorry for the inconvenience.', 'student', true, null, 3),
('student_early', 'Can we start {minutes} minutes early?', 'student', true, '{"type": "minutes", "options": [5, 10, 15, 30]}', 4),
('student_question', 'I have a question: {question}', 'student', false, '{"type": "text", "max_length": 100}', 5),
('student_technical', 'I''m having technical issues with the video room', 'student', false, null, 6),
('student_prepared', 'I''m ready and in the room!', 'student', false, null, 7),

-- Teacher templates
('teacher_approve', 'Approved! See you at {time}', 'teacher', false, '{"type": "datetime"}', 1),
('teacher_decline', 'Sorry, I can''t accommodate that change', 'teacher', false, null, 2),
('teacher_counter', 'I''m not available then. Can we do {new_datetime} instead?', 'teacher', true, '{"type": "datetime"}', 3),
('teacher_reschedule', 'I need to reschedule. Can we move to {new_datetime}?', 'teacher', true, '{"type": "datetime"}', 4),
('teacher_reminder', 'Looking forward to our lesson at {time}!', 'teacher', false, '{"type": "datetime"}', 5),
('teacher_ready', 'I''m in the room and ready when you are!', 'teacher', false, null, 6),
('teacher_waiting', 'I''m in the room. Join when you''re ready!', 'teacher', false, null, 7),
('teacher_late', 'I''m running {minutes} minutes late, apologies!', 'teacher', false, '{"type": "minutes", "options": [5, 10, 15, 20]}', 8);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_lesson_messages_lesson ON lesson_messages(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_messages_created ON lesson_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lesson_messages_sender ON lesson_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_message_audit_user ON message_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_message_audit_created ON message_audit_log(created_at DESC);

-- Row Level Security
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_read_receipts ENABLE ROW LEVEL SECURITY;

-- Policies for message_templates
DROP POLICY IF EXISTS "Anyone can view active templates" ON message_templates;
CREATE POLICY "Anyone can view active templates"
  ON message_templates FOR SELECT
  USING (is_active = true);

-- Policies for lesson_messages
DROP POLICY IF EXISTS "Users can view messages for their lessons" ON lesson_messages;
CREATE POLICY "Users can view messages for their lessons"
  ON lesson_messages FOR SELECT
  USING (
    lesson_id IN (
      SELECT id FROM lessons
      WHERE learner_id IN (SELECT id FROM learners WHERE parent_id = auth.uid())
      OR teacher_id IN (SELECT id FROM teacher_profiles WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can send messages for their lessons" ON lesson_messages;
CREATE POLICY "Users can send messages for their lessons"
  ON lesson_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    lesson_id IN (
      SELECT id FROM lessons
      WHERE learner_id IN (SELECT id FROM learners WHERE parent_id = auth.uid())
      OR teacher_id IN (SELECT id FROM teacher_profiles WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update read status" ON lesson_messages;
CREATE POLICY "Users can update read status"
  ON lesson_messages FOR UPDATE
  USING (
    lesson_id IN (
      SELECT id FROM lessons
      WHERE learner_id IN (SELECT id FROM learners WHERE parent_id = auth.uid())
      OR teacher_id IN (SELECT id FROM teacher_profiles WHERE user_id = auth.uid())
    )
  );

-- Policies for message_audit_log
DROP POLICY IF EXISTS "Admins can view audit log" ON message_audit_log;
CREATE POLICY "Admins can view audit log"
  ON message_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND 'admin' = ANY(roles)
    )
  );

-- Policies for message_read_receipts
DROP POLICY IF EXISTS "Users can view own read receipts" ON message_read_receipts;
CREATE POLICY "Users can view own read receipts"
  ON message_read_receipts FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create read receipts" ON message_read_receipts;
CREATE POLICY "Users can create read receipts"
  ON message_read_receipts FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Function: Check message rate limit
CREATE OR REPLACE FUNCTION check_message_rate_limit(p_user_id uuid)
RETURNS boolean AS $$
DECLARE
  message_count integer;
  max_messages_per_day CONSTANT integer := 10;
BEGIN
  SELECT COUNT(*) INTO message_count
  FROM lesson_messages
  WHERE sender_id = p_user_id
  AND created_at > NOW() - INTERVAL '24 hours';

  RETURN message_count < max_messages_per_day;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get unread message count for user
CREATE OR REPLACE FUNCTION get_unread_message_count(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  unread_count integer;
BEGIN
  SELECT COUNT(*) INTO unread_count
  FROM lesson_messages lm
  WHERE lm.lesson_id IN (
    SELECT id FROM lessons
    WHERE learner_id IN (SELECT id FROM learners WHERE parent_id = p_user_id)
    OR teacher_id IN (SELECT id FROM teacher_profiles WHERE user_id = p_user_id)
  )
  AND lm.sender_id != p_user_id
  AND lm.read_at IS NULL;

  RETURN unread_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(
  p_user_id uuid,
  p_lesson_id uuid
)
RETURNS void AS $$
BEGIN
  UPDATE lesson_messages
  SET read_at = NOW()
  WHERE lesson_id = p_lesson_id
  AND sender_id != p_user_id
  AND read_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Clean up old messages (run monthly)
CREATE OR REPLACE FUNCTION cleanup_old_messages()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM lesson_messages
  WHERE created_at < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE message_templates IS 'Pre-approved message templates to prevent direct contact exchange';
COMMENT ON TABLE lesson_messages IS 'Template-based messages between students and teachers';
COMMENT ON TABLE message_audit_log IS 'Audit trail of blocked poaching attempts';
COMMENT ON FUNCTION check_message_rate_limit IS 'Prevents spam - max 10 messages per 24 hours';
