-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TEACHER TIER PROGRESSION SYSTEM
-- 5-tier system with manual assignment and dynamic pricing
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. TEACHER TIERS TABLE
CREATE TABLE IF NOT EXISTS teacher_tiers (
  tier text PRIMARY KEY,
  tier_order integer UNIQUE NOT NULL,

  -- Earnings
  hourly_rate decimal(10,2) NOT NULL,
  student_price decimal(10,2) NOT NULL,
  platform_margin decimal(10,2) GENERATED ALWAYS AS (student_price - hourly_rate) STORED,

  -- Progression requirements (for auto-promotion)
  min_hours integer,
  max_hours integer,
  min_rating decimal(3,2),
  min_retention_rate integer, -- percentage
  min_completed_lessons integer,

  -- Manual assignment requirements
  requires_manual_approval boolean DEFAULT false,
  requires_credentials boolean DEFAULT false,

  -- Display
  icon text,
  color text,
  badge_image text,
  description text,

  created_at timestamptz DEFAULT now()
);

-- Seed tier data
INSERT INTO teacher_tiers (tier, tier_order, hourly_rate, student_price, min_hours, max_hours, min_rating, min_retention_rate, min_completed_lessons, requires_manual_approval, requires_credentials, icon, color, description) VALUES
  ('newcomer', 1, 5.00, 15.00, 0, 50, 4.0, 0, 0, false, false, '🌱', '#10B981', 'New teachers starting their journey'),
  ('apprentice', 2, 6.00, 15.00, 50, 150, 4.2, 70, 5, false, false, '📚', '#3B82F6', 'Developing teachers building experience'),
  ('skilled', 3, 7.00, 15.00, 150, 400, 4.5, 75, 20, false, false, '🎯', '#8B5CF6', 'Experienced teachers with proven track record'),
  ('expert', 4, 8.50, 16.50, 400, 1000, 4.7, 80, 50, true, true, '🏆', '#F59E0B', 'Highly qualified teachers with Ijazah or degree'),
  ('master', 5, 10.00, 18.00, 1000, NULL, 4.8, 85, 100, true, true, '💎', '#EC4899', 'Elite teachers with multiple certifications')
ON CONFLICT (tier) DO UPDATE SET
  hourly_rate = EXCLUDED.hourly_rate,
  student_price = EXCLUDED.student_price,
  min_hours = EXCLUDED.min_hours,
  max_hours = EXCLUDED.max_hours,
  min_rating = EXCLUDED.min_rating,
  min_retention_rate = EXCLUDED.min_retention_rate,
  min_completed_lessons = EXCLUDED.min_completed_lessons;

-- 2. UPDATE TEACHER_PROFILES TABLE
-- Add tier tracking
ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS
  current_tier text DEFAULT 'newcomer' REFERENCES teacher_tiers(tier);

ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS
  tier_assigned_by uuid REFERENCES profiles(id);

ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS
  tier_assigned_at timestamptz;

ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS
  tier_locked boolean DEFAULT false;

-- Teaching stats
ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS
  total_hours_taught decimal(10,2) DEFAULT 0;

ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS
  total_lessons_completed integer DEFAULT 0;

ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS
  average_rating decimal(3,2) DEFAULT 0;

ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS
  student_retention_rate integer DEFAULT 0;

ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS
  total_unique_students integer DEFAULT 0;

ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS
  returning_students integer DEFAULT 0;

-- Qualifications
ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS
  has_ijazah boolean DEFAULT false;

ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS
  ijazah_type text[];

ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS
  has_degree boolean DEFAULT false;

ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS
  degree_type text;

ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS
  years_experience integer DEFAULT 0;

ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS
  english_level text;

ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS
  certificates jsonb;

ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS
  intro_video_url text;

-- Interview tracking
ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS
  interview_required boolean DEFAULT false;

ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS
  interview_completed boolean DEFAULT false;

ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS
  interview_date timestamptz;

ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS
  interview_notes text;

ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS
  interviewed_by uuid REFERENCES profiles(id);

-- Tier progression tracking
ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS
  last_tier_check timestamptz;

ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS
  eligible_for_promotion boolean DEFAULT false;

ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS
  promotion_blocked_reason text;

-- 3. TEACHER TIER HISTORY TABLE
CREATE TABLE IF NOT EXISTS teacher_tier_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES teacher_profiles(id) ON DELETE CASCADE,

  from_tier text REFERENCES teacher_tiers(tier),
  to_tier text REFERENCES teacher_tiers(tier),

  promotion_type text NOT NULL CHECK (promotion_type IN ('auto', 'manual', 'admin_override')),
  promoted_by uuid REFERENCES profiles(id),

  reason text,
  stats_at_promotion jsonb,

  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tier_history_teacher ON teacher_tier_history(teacher_id);
CREATE INDEX IF NOT EXISTS idx_tier_history_date ON teacher_tier_history(created_at DESC);

-- 4. STUDENT PRICING LOCKS TABLE
CREATE TABLE IF NOT EXISTS student_pricing_locks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES teacher_profiles(id) ON DELETE CASCADE,

  locked_price decimal(10,2) NOT NULL,
  locked_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,

  original_tier text REFERENCES teacher_tiers(tier),
  current_applies boolean DEFAULT true,

  created_at timestamptz DEFAULT now(),

  UNIQUE(student_id, teacher_id)
);

CREATE INDEX IF NOT EXISTS idx_pricing_locks_student ON student_pricing_locks(student_id);
CREATE INDEX IF NOT EXISTS idx_pricing_locks_teacher ON student_pricing_locks(teacher_id);
CREATE INDEX IF NOT EXISTS idx_pricing_locks_expires ON student_pricing_locks(expires_at);

-- 5. TIER MILESTONE BONUSES TABLE
CREATE TABLE IF NOT EXISTS tier_milestone_bonuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_type text NOT NULL CHECK (milestone_type IN ('tier_unlock', 'hours_milestone', 'lessons_milestone')),

  -- Conditions
  tier text REFERENCES teacher_tiers(tier),
  hours_required integer,
  lessons_required integer,

  -- Reward
  bonus_amount decimal(10,2) NOT NULL,
  bonus_description text,

  -- Display
  icon text,
  celebration_message text,

  created_at timestamptz DEFAULT now()
);

-- Seed milestone bonuses
INSERT INTO tier_milestone_bonuses (milestone_type, tier, bonus_amount, bonus_description, icon, celebration_message) VALUES
  ('tier_unlock', 'apprentice', 50.00, 'Welcome to Apprentice tier!', '🎉', 'Congratulations! You''ve reached Apprentice tier and earned a £50 bonus!'),
  ('tier_unlock', 'skilled', 100.00, 'Welcome to Skilled tier!', '🎯', 'Amazing progress! You''re now a Skilled teacher with a £100 bonus!'),
  ('tier_unlock', 'expert', 200.00, 'Welcome to Expert tier!', '🏆', 'Exceptional achievement! You''ve reached Expert tier and earned £200!'),
  ('tier_unlock', 'master', 500.00, 'Welcome to Master tier!', '💎', 'Legendary! You''re now a Master teacher with a £500 bonus!')
ON CONFLICT DO NOTHING;

INSERT INTO tier_milestone_bonuses (milestone_type, hours_required, bonus_amount, bonus_description, icon, celebration_message) VALUES
  ('hours_milestone', 100, 25.00, '100 hours taught milestone', '⏰', 'You''ve taught 100 hours! Here''s £25 to celebrate!'),
  ('hours_milestone', 500, 75.00, '500 hours taught milestone', '⏰', 'Incredible! 500 hours taught milestone reached! £75 bonus!'),
  ('hours_milestone', 1000, 250.00, '1000 hours taught milestone', '⏰', 'Legendary milestone! 1000 hours taught! £250 bonus!')
ON CONFLICT DO NOTHING;

INSERT INTO tier_milestone_bonuses (milestone_type, lessons_required, bonus_amount, bonus_description, icon, celebration_message) VALUES
  ('lessons_milestone', 100, 50.00, '100 lessons completed', '📚', '100 lessons completed! Here''s £50 as a thank you!'),
  ('lessons_milestone', 500, 200.00, '500 lessons completed', '📚', 'Amazing dedication! 500 lessons milestone with £200 bonus!')
ON CONFLICT DO NOTHING;

-- 6. TEACHER BONUS PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS teacher_bonus_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  milestone_id uuid REFERENCES tier_milestone_bonuses(id),

  amount decimal(10,2) NOT NULL,
  description text,

  paid boolean DEFAULT false,
  paid_at timestamptz,

  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bonus_payments_teacher ON teacher_bonus_payments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_bonus_payments_paid ON teacher_bonus_payments(paid);

-- 7. RLS POLICIES

-- Teacher tiers (public read)
ALTER TABLE teacher_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view teacher tiers" ON teacher_tiers FOR SELECT USING (true);

-- Teacher tier history (teachers can view their own)
ALTER TABLE teacher_tier_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can view own tier history" ON teacher_tier_history
  FOR SELECT USING (
    teacher_id IN (
      SELECT id FROM teacher_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all tier history" ON teacher_tier_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Student pricing locks
ALTER TABLE student_pricing_locks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view own pricing locks" ON student_pricing_locks
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Teachers can view locks for their students" ON student_pricing_locks
  FOR SELECT USING (
    teacher_id IN (
      SELECT id FROM teacher_profiles WHERE user_id = auth.uid()
    )
  );

-- Milestone bonuses (public read)
ALTER TABLE tier_milestone_bonuses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view milestone bonuses" ON tier_milestone_bonuses FOR SELECT USING (true);

-- Bonus payments (teachers can view their own)
ALTER TABLE teacher_bonus_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can view own bonuses" ON teacher_bonus_payments
  FOR SELECT USING (
    teacher_id IN (
      SELECT id FROM teacher_profiles WHERE user_id = auth.uid()
    )
  );

-- 8. HELPER FUNCTIONS

-- Function to get current tier info for a teacher
CREATE OR REPLACE FUNCTION get_teacher_tier_info(teacher_user_id uuid)
RETURNS TABLE (
  tier text,
  tier_order integer,
  hourly_rate decimal(10,2),
  student_price decimal(10,2),
  platform_margin decimal(10,2),
  icon text,
  color text,
  description text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tt.tier,
    tt.tier_order,
    tt.hourly_rate,
    tt.student_price,
    tt.platform_margin,
    tt.icon,
    tt.color,
    tt.description
  FROM teacher_profiles tp
  JOIN teacher_tiers tt ON tp.current_tier = tt.tier
  WHERE tp.user_id = teacher_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get next tier requirements
CREATE OR REPLACE FUNCTION get_next_tier_requirements(teacher_user_id uuid)
RETURNS TABLE (
  next_tier text,
  min_hours integer,
  min_rating decimal(3,2),
  min_retention_rate integer,
  min_completed_lessons integer,
  requires_manual_approval boolean,
  hours_progress decimal(5,2),
  rating_progress boolean,
  retention_progress boolean,
  lessons_progress boolean
) AS $$
DECLARE
  current_order integer;
BEGIN
  -- Get current tier order
  SELECT tt.tier_order INTO current_order
  FROM teacher_profiles tp
  JOIN teacher_tiers tt ON tp.current_tier = tt.tier
  WHERE tp.user_id = teacher_user_id;

  RETURN QUERY
  SELECT
    tt.tier,
    tt.min_hours,
    tt.min_rating,
    tt.min_retention_rate,
    tt.min_completed_lessons,
    tt.requires_manual_approval,
    CASE
      WHEN tt.min_hours > 0 THEN (tp.total_hours_taught / tt.min_hours * 100)
      ELSE 100
    END as hours_progress,
    tp.average_rating >= tt.min_rating as rating_progress,
    tp.student_retention_rate >= tt.min_retention_rate as retention_progress,
    tp.total_lessons_completed >= tt.min_completed_lessons as lessons_progress
  FROM teacher_tiers tt
  JOIN teacher_profiles tp ON tp.user_id = teacher_user_id
  WHERE tt.tier_order = current_order + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate student price with locks
CREATE OR REPLACE FUNCTION get_student_price_for_teacher(
  p_student_id uuid,
  p_teacher_id uuid
)
RETURNS decimal(10,2) AS $$
DECLARE
  v_base_price decimal(10,2);
  v_locked_price decimal(10,2);
BEGIN
  -- Get teacher's current tier price
  SELECT tt.student_price INTO v_base_price
  FROM teacher_profiles tp
  JOIN teacher_tiers tt ON tp.current_tier = tt.tier
  WHERE tp.id = p_teacher_id;

  -- Check for active price lock
  SELECT locked_price INTO v_locked_price
  FROM student_pricing_locks
  WHERE student_id = p_student_id
    AND teacher_id = p_teacher_id
    AND current_applies = true
    AND expires_at > now();

  -- Return lower of locked or current price
  IF v_locked_price IS NOT NULL THEN
    RETURN LEAST(v_locked_price, v_base_price);
  ELSE
    RETURN v_base_price;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- MIGRATION COMPLETE
-- Teacher tier system with 5 tiers, manual assignment, and dynamic pricing
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
