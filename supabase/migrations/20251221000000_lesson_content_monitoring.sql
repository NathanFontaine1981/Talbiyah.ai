-- Lesson Content Monitoring System
-- Monitors lesson conversations for suspicious activity (contact sharing, poaching attempts)

-- Table to store flagged content from lessons
CREATE TABLE IF NOT EXISTS lesson_content_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  flag_type TEXT NOT NULL CHECK (flag_type IN ('email', 'phone', 'social_media', 'file_share', 'keyword', 'other')),
  source TEXT NOT NULL CHECK (source IN ('transcript', 'chat')),
  flagged_content TEXT NOT NULL,
  context TEXT, -- Surrounding text for context
  teacher_id UUID REFERENCES profiles(id),
  student_id UUID REFERENCES profiles(id),
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed BOOLEAN DEFAULT FALSE,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  severity TEXT DEFAULT 'warning' CHECK (severity IN ('warning', 'critical')),
  admin_notified BOOLEAN DEFAULT FALSE,
  action_taken TEXT, -- 'dismissed', 'warned', 'suspended'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin alert settings
CREATE TABLE IF NOT EXISTS admin_alert_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  email_alerts_enabled BOOLEAN DEFAULT TRUE,
  alert_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(admin_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_lesson_content_flags_lesson_id ON lesson_content_flags(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_content_flags_detected_at ON lesson_content_flags(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_lesson_content_flags_reviewed ON lesson_content_flags(reviewed);
CREATE INDEX IF NOT EXISTS idx_lesson_content_flags_severity ON lesson_content_flags(severity);
CREATE INDEX IF NOT EXISTS idx_lesson_content_flags_teacher_id ON lesson_content_flags(teacher_id);
CREATE INDEX IF NOT EXISTS idx_lesson_content_flags_student_id ON lesson_content_flags(student_id);

-- RLS Policies - Only admins can access
ALTER TABLE lesson_content_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_alert_settings ENABLE ROW LEVEL SECURITY;

-- Admin read access for flags
CREATE POLICY "Admins can view all content flags"
  ON lesson_content_flags
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- Admin update access for flags (to mark as reviewed)
CREATE POLICY "Admins can update content flags"
  ON lesson_content_flags
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- Service role insert (from edge functions)
CREATE POLICY "Service role can insert flags"
  ON lesson_content_flags
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Admin alert settings policies
CREATE POLICY "Admins can manage their alert settings"
  ON admin_alert_settings
  FOR ALL
  TO authenticated
  USING (admin_id = auth.uid())
  WITH CHECK (admin_id = auth.uid());

-- Function to check content for suspicious patterns
CREATE OR REPLACE FUNCTION check_content_for_suspicious_patterns(content TEXT)
RETURNS TABLE(flag_type TEXT, matched_content TEXT) AS $$
DECLARE
  email_pattern TEXT := '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}';
  phone_uk_pattern TEXT := '(?:\+44\s?|0)(?:7\d{3}|\d{4})[\s-]?\d{3}[\s-]?\d{3}|\d{10,11}';
  social_pattern TEXT := '(?:whatsapp|telegram|instagram|facebook|snapchat|twitter|tiktok|discord)';
  file_share_pattern TEXT := '(?:dropbox\.com|drive\.google\.com|wetransfer\.com|mega\.nz|mediafire\.com)';
  keyword_pattern TEXT := '(?:email me|call me|my number|add me on|text me|contact me outside|private lesson|off platform)';
  match_result TEXT[];
BEGIN
  -- Check for email
  IF content ~* email_pattern THEN
    RETURN QUERY SELECT 'email'::TEXT, (regexp_match(content, email_pattern, 'i'))[1];
  END IF;

  -- Check for phone numbers
  IF content ~* phone_uk_pattern THEN
    RETURN QUERY SELECT 'phone'::TEXT, (regexp_match(content, phone_uk_pattern, 'i'))[1];
  END IF;

  -- Check for social media
  IF content ~* social_pattern THEN
    RETURN QUERY SELECT 'social_media'::TEXT, (regexp_match(content, social_pattern, 'i'))[1];
  END IF;

  -- Check for file sharing
  IF content ~* file_share_pattern THEN
    RETURN QUERY SELECT 'file_share'::TEXT, (regexp_match(content, file_share_pattern, 'i'))[1];
  END IF;

  -- Check for keywords
  IF content ~* keyword_pattern THEN
    RETURN QUERY SELECT 'keyword'::TEXT, (regexp_match(content, keyword_pattern, 'i'))[1];
  END IF;

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to monitor lesson messages
CREATE OR REPLACE FUNCTION monitor_lesson_message()
RETURNS TRIGGER AS $$
DECLARE
  flag_record RECORD;
  lesson_record RECORD;
  new_flag_id UUID;
BEGIN
  -- Get lesson details
  SELECT l.*,
         tp.full_name as teacher_name,
         sp.full_name as student_name
  INTO lesson_record
  FROM lessons l
  LEFT JOIN profiles tp ON l.teacher_id = tp.id
  LEFT JOIN profiles sp ON l.learner_id = sp.id
  WHERE l.id = NEW.lesson_id;

  -- Check content for suspicious patterns
  FOR flag_record IN SELECT * FROM check_content_for_suspicious_patterns(NEW.message_text)
  LOOP
    -- Insert flag
    INSERT INTO lesson_content_flags (
      lesson_id,
      flag_type,
      source,
      flagged_content,
      context,
      teacher_id,
      student_id,
      severity
    ) VALUES (
      NEW.lesson_id,
      flag_record.flag_type,
      'chat',
      flag_record.matched_content,
      NEW.message_text,
      lesson_record.teacher_id,
      lesson_record.learner_id,
      CASE
        WHEN flag_record.flag_type IN ('email', 'phone') THEN 'critical'
        ELSE 'warning'
      END
    ) RETURNING id INTO new_flag_id;

    -- Trigger admin notification via edge function
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/send-admin-alert',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object(
        'flag_id', new_flag_id,
        'flag_type', flag_record.flag_type,
        'lesson_id', NEW.lesson_id,
        'flagged_content', flag_record.matched_content,
        'context', NEW.message_text
      )::text
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on lesson_messages table
DROP TRIGGER IF EXISTS lesson_message_monitor ON lesson_messages;
CREATE TRIGGER lesson_message_monitor
  AFTER INSERT ON lesson_messages
  FOR EACH ROW
  EXECUTE FUNCTION monitor_lesson_message();

-- Function to get flagged content stats for dashboard
CREATE OR REPLACE FUNCTION get_content_moderation_stats()
RETURNS TABLE(
  total_flags BIGINT,
  unreviewed_flags BIGINT,
  critical_flags BIGINT,
  flags_today BIGINT,
  flags_this_week BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_flags,
    COUNT(*) FILTER (WHERE NOT reviewed)::BIGINT as unreviewed_flags,
    COUNT(*) FILTER (WHERE severity = 'critical' AND NOT reviewed)::BIGINT as critical_flags,
    COUNT(*) FILTER (WHERE detected_at >= CURRENT_DATE)::BIGINT as flags_today,
    COUNT(*) FILTER (WHERE detected_at >= CURRENT_DATE - INTERVAL '7 days')::BIGINT as flags_this_week
  FROM lesson_content_flags;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users (admin check is in RLS)
GRANT EXECUTE ON FUNCTION get_content_moderation_stats() TO authenticated;
