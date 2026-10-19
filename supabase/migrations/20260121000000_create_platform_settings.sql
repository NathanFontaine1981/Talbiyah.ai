-- Platform Settings table for admin configuration
CREATE TABLE IF NOT EXISTS platform_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Single row for platform settings

  -- General
  platform_name TEXT DEFAULT 'Talbiyah.ai',
  support_email TEXT DEFAULT 'support@talbiyah.ai',
  maintenance_mode BOOLEAN DEFAULT FALSE,

  -- Pricing
  default_lesson_price_per_credit INTEGER DEFAULT 1,
  referral_reward_credits INTEGER DEFAULT 1,
  min_credits_purchase INTEGER DEFAULT 5,

  -- Lessons
  default_lesson_duration INTEGER DEFAULT 60,
  max_booking_days_ahead INTEGER DEFAULT 30,
  cancellation_window_hours INTEGER DEFAULT 24,
  auto_generate_insights BOOLEAN DEFAULT TRUE,

  -- Notifications
  email_notifications_enabled BOOLEAN DEFAULT TRUE,
  lesson_reminder_hours INTEGER DEFAULT 2,

  -- Video
  video_provider TEXT DEFAULT '100ms',
  auto_record_lessons BOOLEAN DEFAULT TRUE,
  recording_retention_days INTEGER DEFAULT 90,

  -- XP & Gamification
  xp_per_lesson_completed INTEGER DEFAULT 100,
  xp_per_streak_day INTEGER DEFAULT 25,
  daily_login_reward_xp INTEGER DEFAULT 10,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings row
INSERT INTO platform_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read settings
CREATE POLICY "Admins can read platform settings"
  ON platform_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR 'admin' = ANY(profiles.roles))
    )
  );

-- Only admins can update settings
CREATE POLICY "Admins can update platform settings"
  ON platform_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR 'admin' = ANY(profiles.roles))
    )
  );

-- Grant access
GRANT SELECT, UPDATE ON platform_settings TO authenticated;
