-- Lesson Confirmation/Acknowledgment System
-- Allows teachers to acknowledge bookings within 24 hours
-- Auto-acknowledges after 24 hours to prevent ghosting

-- Add confirmation tracking to lessons table
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS confirmation_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS confirmation_requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS declined_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS decline_reason TEXT,
ADD COLUMN IF NOT EXISTS suggested_alternative_times JSONB,
ADD COLUMN IF NOT EXISTS auto_acknowledged BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS teacher_acknowledgment_message TEXT CHECK (char_length(teacher_acknowledgment_message) <= 300);

-- Add constraint for valid confirmation statuses
ALTER TABLE lessons
DROP CONSTRAINT IF EXISTS valid_confirmation_status;

ALTER TABLE lessons
ADD CONSTRAINT valid_confirmation_status
CHECK (confirmation_status IN ('pending', 'acknowledged', 'declined', 'auto_acknowledged'));

-- Teacher booking preferences
CREATE TABLE IF NOT EXISTS teacher_booking_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES teacher_profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- Auto-acknowledgment
  auto_acknowledge BOOLEAN DEFAULT FALSE,

  -- Notification preferences
  email_on_new_booking BOOLEAN DEFAULT TRUE,
  sms_on_new_booking BOOLEAN DEFAULT FALSE,

  -- Auto-decline rules (optional)
  min_hours_notice INTEGER DEFAULT 2,
  max_lessons_per_day INTEGER,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function: Auto-acknowledge lessons after 24 hours
CREATE OR REPLACE FUNCTION auto_acknowledge_pending_lessons()
RETURNS TABLE(
  lesson_id UUID,
  student_id UUID,
  student_name TEXT,
  teacher_id UUID,
  teacher_name TEXT,
  scheduled_time TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  UPDATE lessons l
  SET
    confirmation_status = 'auto_acknowledged',
    acknowledged_at = NOW(),
    auto_acknowledged = TRUE
  FROM learners lr, profiles sp, teacher_profiles tp, profiles t_prof
  WHERE
    l.confirmation_status = 'pending'
    AND l.confirmation_requested_at < NOW() - INTERVAL '24 hours'
    AND l.status = 'booked'
    AND l.learner_id = lr.id
    AND lr.user_id = sp.id
    AND l.teacher_id = tp.id
    AND tp.user_id = t_prof.id
  RETURNING
    l.id,
    lr.id,
    sp.full_name,
    tp.id,
    t_prof.full_name,
    l.scheduled_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get pending lessons for teacher
CREATE OR REPLACE FUNCTION get_teacher_pending_lessons(p_teacher_id UUID)
RETURNS TABLE(
  lesson_id UUID,
  student_name TEXT,
  student_id UUID,
  scheduled_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  subject_name TEXT,
  hours_until_lesson NUMERIC,
  requested_hours_ago NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    p.full_name,
    lr.id,
    l.scheduled_time,
    l.duration_minutes,
    s.name,
    EXTRACT(EPOCH FROM (l.scheduled_time - NOW())) / 3600,
    EXTRACT(EPOCH FROM (NOW() - l.confirmation_requested_at)) / 3600
  FROM lessons l
  JOIN learners lr ON l.learner_id = lr.id
  JOIN profiles p ON lr.user_id = p.id
  LEFT JOIN subjects s ON l.subject_id = s.id
  WHERE l.teacher_id = p_teacher_id
  AND l.confirmation_status = 'pending'
  AND l.status = 'booked'
  ORDER BY l.scheduled_time ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Calculate teacher acknowledgment stats
CREATE OR REPLACE FUNCTION get_teacher_acknowledgment_stats(p_teacher_id UUID)
RETURNS TABLE(
  acknowledgment_rate NUMERIC,
  avg_response_hours NUMERIC,
  total_bookings INTEGER,
  auto_acknowledged_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROUND(
      COUNT(CASE WHEN confirmation_status IN ('acknowledged', 'auto_acknowledged') THEN 1 END)::NUMERIC /
      NULLIF(COUNT(*), 0) * 100,
      1
    ) as acknowledgment_rate,
    ROUND(
      AVG(EXTRACT(EPOCH FROM (acknowledged_at - confirmation_requested_at)) / 3600)::NUMERIC,
      1
    ) as avg_response_hours,
    COUNT(*)::INTEGER as total_bookings,
    COUNT(CASE WHEN auto_acknowledged = true THEN 1 END)::INTEGER as auto_acknowledged_count
  FROM lessons
  WHERE teacher_id = p_teacher_id
  AND confirmation_requested_at > NOW() - INTERVAL '90 days'; -- Last 90 days
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lessons_confirmation_status ON lessons(confirmation_status);
CREATE INDEX IF NOT EXISTS idx_lessons_confirmation_requested ON lessons(confirmation_requested_at);
CREATE INDEX IF NOT EXISTS idx_lessons_teacher_pending ON lessons(teacher_id, confirmation_status)
  WHERE confirmation_status = 'pending';

-- RLS Policies
ALTER TABLE teacher_booking_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view own settings"
  ON teacher_booking_settings FOR SELECT
  USING (teacher_id IN (SELECT id FROM teacher_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Teachers can update own settings"
  ON teacher_booking_settings FOR ALL
  USING (teacher_id IN (SELECT id FROM teacher_profiles WHERE user_id = auth.uid()));

-- Insert default settings for existing teachers
INSERT INTO teacher_booking_settings (teacher_id)
SELECT id FROM teacher_profiles
WHERE id NOT IN (SELECT teacher_id FROM teacher_booking_settings)
ON CONFLICT (teacher_id) DO NOTHING;
