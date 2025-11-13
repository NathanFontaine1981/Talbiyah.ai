-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TEACHER TIER PROGRESSION SYSTEM
-- Phase 1 (Absorption): Student pays £15, teacher grows £5→£7, you absorb margin compression
-- Phase 2 (Pass-through): Lock £8 margin, teacher grows £7→£10, student pays £15→£18
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. CREATE TEACHER TIERS TABLE
CREATE TABLE IF NOT EXISTS teacher_tiers (
  tier text PRIMARY KEY,
  tier_level integer NOT NULL,
  tier_name text NOT NULL,
  tier_icon text NOT NULL,

  -- Teacher earnings
  teacher_hourly_rate decimal(5,2) NOT NULL,

  -- Student pricing
  student_hourly_price decimal(5,2) NOT NULL,

  -- Platform margin
  platform_margin decimal(5,2) NOT NULL,
  margin_percentage decimal(4,2) NOT NULL,

  -- Progression requirements
  min_hours_taught integer NOT NULL,
  min_rating decimal(2,1) NOT NULL,
  requires_manual_approval boolean DEFAULT false,

  -- Qualification requirements
  qualifications_required text[],

  -- Benefits
  benefits jsonb,

  -- Display
  color text,
  badge_color text,

  created_at timestamptz DEFAULT now()
);

-- Seed tier data
INSERT INTO teacher_tiers (tier, tier_level, tier_name, tier_icon, teacher_hourly_rate, student_hourly_price, platform_margin, margin_percentage, min_hours_taught, min_rating, requires_manual_approval, qualifications_required, benefits, color, badge_color) VALUES
  ('newcomer', 1, 'Newcomer', '🌱', 5.00, 15.00, 10.00, 66.67, 0, 0.0, false,
   ARRAY['None - Starting point for new teachers'],
   '{"priority_support": false, "featured_profile": false, "flexible_scheduling": true}',
   '#10B981', '#059669'),

  ('apprentice', 2, 'Apprentice', '📚', 6.00, 15.00, 9.00, 60.00, 50, 4.0, false,
   ARRAY['50+ hours taught', 'OR 1-2 years teaching experience', 'Maintain 4.0+ rating'],
   '{"priority_support": false, "featured_profile": false, "flexible_scheduling": true, "monthly_bonus_eligible": true}',
   '#3B82F6', '#2563EB'),

  ('skilled', 3, 'Skilled', '🎯', 7.00, 15.00, 8.00, 53.33, 150, 4.2, false,
   ARRAY['150+ hours taught', 'OR 3+ years experience', 'OR basic teaching certificate', 'Maintain 4.2+ rating'],
   '{"priority_support": true, "featured_profile": true, "flexible_scheduling": true, "monthly_bonus_eligible": true}',
   '#8B5CF6', '#7C3AED'),

  ('expert', 4, 'Expert', '🏆', 8.50, 16.50, 8.00, 48.48, 250, 4.5, true,
   ARRAY['Ijazah in Quran OR Islamic degree', 'OR 5+ years teaching experience', 'Fluent English (C1+)', 'Verified credentials', 'Admin interview passed'],
   '{"priority_support": true, "featured_profile": true, "flexible_scheduling": true, "monthly_bonus_eligible": true, "dedicated_student_coordinator": true}',
   '#F59E0B', '#D97706'),

  ('master', 5, 'Master', '💎', 10.00, 18.00, 8.00, 44.44, 500, 4.7, true,
   ARRAY['Multiple Ijazahs (Quran + Qira''at)', 'Al-Azhar University degree OR equivalent', 'Native/Near-native English', 'Exceptional teaching record', 'Admin interview + demonstration'],
   '{"priority_support": true, "featured_profile": true, "flexible_scheduling": true, "monthly_bonus_eligible": true, "dedicated_student_coordinator": true, "elite_teacher_badge": true, "platform_promotion": true}',
   '#EC4899', '#DB2777');

-- 2. ADD TIER FIELDS TO TEACHER_PROFILES
ALTER TABLE teacher_profiles
  ADD COLUMN IF NOT EXISTS tier text DEFAULT 'newcomer' REFERENCES teacher_tiers(tier),
  ADD COLUMN IF NOT EXISTS tier_assigned_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS tier_assigned_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS hours_taught decimal(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS average_rating decimal(2,1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_lessons integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed_lessons integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tier_progression_eligible boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS manual_tier_override boolean DEFAULT false;

-- 3. CREATE TEACHER QUALIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS teacher_qualifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES teacher_profiles(id) ON DELETE CASCADE,

  qualification_type text NOT NULL, -- 'ijazah_quran', 'ijazah_qiraat', 'university_degree', 'teaching_certificate', 'experience'
  qualification_name text NOT NULL,
  issuing_institution text,
  year_obtained integer,

  -- Verification
  certificate_url text,
  verified boolean DEFAULT false,
  verified_by uuid REFERENCES auth.users(id),
  verified_at timestamptz,
  verification_notes text,

  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_teacher_qualifications_teacher ON teacher_qualifications(teacher_id);

-- 4. CREATE TEACHER TIER HISTORY TABLE
CREATE TABLE IF NOT EXISTS teacher_tier_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES teacher_profiles(id) ON DELETE CASCADE,

  from_tier text REFERENCES teacher_tiers(tier),
  to_tier text REFERENCES teacher_tiers(tier),

  promotion_type text NOT NULL, -- 'automatic', 'manual', 'admin_override'
  promotion_reason text,

  hours_at_promotion decimal(10,2),
  rating_at_promotion decimal(2,1),

  promoted_by uuid REFERENCES auth.users(id),
  promoted_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_teacher_tier_history_teacher ON teacher_tier_history(teacher_id);

-- 5. CREATE STUDENT PRICING TABLE (for grandfather pricing)
CREATE TABLE IF NOT EXISTS student_teacher_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES teacher_profiles(id) ON DELETE CASCADE,

  -- Initial booking
  initial_booking_date timestamptz NOT NULL,
  initial_teacher_tier text REFERENCES teacher_tiers(tier),
  locked_hourly_price decimal(5,2) NOT NULL,

  -- Price lock
  price_locked_until timestamptz NOT NULL, -- 12 months from initial booking
  is_price_locked boolean DEFAULT true,

  -- Current pricing
  current_hourly_price decimal(5,2) NOT NULL,
  last_price_update timestamptz DEFAULT now(),

  created_at timestamptz DEFAULT now(),

  UNIQUE(student_id, teacher_id)
);

CREATE INDEX IF NOT EXISTS idx_student_teacher_pricing_student ON student_teacher_pricing(student_id);
CREATE INDEX IF NOT EXISTS idx_student_teacher_pricing_teacher ON student_teacher_pricing(teacher_id);

-- 6. CREATE TIER APPLICATION TABLE (for Expert/Master applications)
CREATE TABLE IF NOT EXISTS teacher_tier_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES teacher_profiles(id) ON DELETE CASCADE,

  requested_tier text REFERENCES teacher_tiers(tier),
  requested_rate decimal(5,2),

  -- Application details
  application_reason text,
  years_experience integer,
  english_proficiency text, -- 'basic', 'intermediate', 'fluent', 'native'

  -- Uploaded materials
  intro_video_url text,
  recitation_sample_url text,
  certificates jsonb, -- array of certificate URLs

  -- Review
  status text DEFAULT 'pending', -- 'pending', 'under_review', 'interview_scheduled', 'approved', 'rejected'
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  review_notes text,
  assigned_tier text REFERENCES teacher_tiers(tier),
  assigned_rate decimal(5,2),

  -- Interview
  interview_scheduled_at timestamptz,
  interview_completed_at timestamptz,
  interview_notes text,

  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tier_applications_teacher ON teacher_tier_applications(teacher_id);
CREATE INDEX IF NOT EXISTS idx_tier_applications_status ON teacher_tier_applications(status);

-- 7. CREATE TIER PROGRESSION FUNCTION
CREATE OR REPLACE FUNCTION check_tier_progression(teacher_id_param uuid)
RETURNS TABLE(
  eligible boolean,
  current_tier text,
  next_tier text,
  hours_needed decimal,
  rating_needed decimal,
  reason text
) AS $$
DECLARE
  v_teacher teacher_profiles%ROWTYPE;
  v_current_tier teacher_tiers%ROWTYPE;
  v_next_tier teacher_tiers%ROWTYPE;
BEGIN
  -- Get teacher details
  SELECT * INTO v_teacher
  FROM teacher_profiles
  WHERE id = teacher_id_param;

  -- Get current tier
  SELECT * INTO v_current_tier
  FROM teacher_tiers
  WHERE tier = v_teacher.tier;

  -- Get next tier
  SELECT * INTO v_next_tier
  FROM teacher_tiers
  WHERE tier_level = v_current_tier.tier_level + 1
  AND requires_manual_approval = false
  ORDER BY tier_level
  LIMIT 1;

  -- Check if progression is possible
  IF v_next_tier IS NULL THEN
    RETURN QUERY SELECT
      false,
      v_teacher.tier,
      NULL::text,
      0::decimal,
      0::decimal,
      'No automatic progression available. Apply for manual tier review.'::text;
    RETURN;
  END IF;

  -- Check if eligible
  IF v_teacher.hours_taught >= v_next_tier.min_hours_taught
     AND v_teacher.average_rating >= v_next_tier.min_rating
     AND v_teacher.tier_progression_eligible = true THEN
    RETURN QUERY SELECT
      true,
      v_teacher.tier,
      v_next_tier.tier,
      0::decimal,
      0::decimal,
      'Eligible for automatic progression!'::text;
  ELSE
    RETURN QUERY SELECT
      false,
      v_teacher.tier,
      v_next_tier.tier,
      GREATEST(0, v_next_tier.min_hours_taught - v_teacher.hours_taught),
      GREATEST(0, v_next_tier.min_rating - v_teacher.average_rating),
      format('Need %s more hours and %s rating',
        GREATEST(0, v_next_tier.min_hours_taught - v_teacher.hours_taught),
        v_next_tier.min_rating)::text;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 8. CREATE AUTO-PROGRESSION FUNCTION
CREATE OR REPLACE FUNCTION auto_promote_teacher()
RETURNS TRIGGER AS $$
DECLARE
  v_next_tier teacher_tiers%ROWTYPE;
BEGIN
  -- Only auto-promote if eligible and not manually overridden
  IF NEW.tier_progression_eligible = true AND NEW.manual_tier_override = false THEN
    -- Get next eligible tier (non-manual only)
    SELECT * INTO v_next_tier
    FROM teacher_tiers
    WHERE tier_level = (SELECT tier_level FROM teacher_tiers WHERE tier = NEW.tier) + 1
      AND requires_manual_approval = false
      AND NEW.hours_taught >= min_hours_taught
      AND NEW.average_rating >= min_rating
    ORDER BY tier_level
    LIMIT 1;

    -- If eligible for promotion, promote!
    IF v_next_tier IS NOT NULL THEN
      -- Update tier
      NEW.tier := v_next_tier.tier;
      NEW.tier_assigned_at := now();

      -- Record history
      INSERT INTO teacher_tier_history (
        teacher_id, from_tier, to_tier, promotion_type, promotion_reason,
        hours_at_promotion, rating_at_promotion
      ) VALUES (
        NEW.id, OLD.tier, NEW.tier, 'automatic',
        format('Auto-promoted: %s hours taught, %s rating', NEW.hours_taught, NEW.average_rating),
        NEW.hours_taught, NEW.average_rating
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_auto_promote_teacher ON teacher_profiles;
CREATE TRIGGER trigger_auto_promote_teacher
  BEFORE UPDATE OF hours_taught, average_rating ON teacher_profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_promote_teacher();

-- 9. CREATE GRANDFATHER PRICING FUNCTION
CREATE OR REPLACE FUNCTION get_student_teacher_price(
  student_id_param uuid,
  teacher_id_param uuid
)
RETURNS decimal AS $$
DECLARE
  v_pricing student_teacher_pricing%ROWTYPE;
  v_teacher teacher_profiles%ROWTYPE;
  v_tier teacher_tiers%ROWTYPE;
BEGIN
  -- Get existing pricing record
  SELECT * INTO v_pricing
  FROM student_teacher_pricing
  WHERE student_id = student_id_param
    AND teacher_id = teacher_id_param;

  -- Get teacher and tier
  SELECT * INTO v_teacher
  FROM teacher_profiles
  WHERE id = teacher_id_param;

  SELECT * INTO v_tier
  FROM teacher_tiers
  WHERE tier = v_teacher.tier;

  -- If no pricing record, create one (new student)
  IF v_pricing IS NULL THEN
    INSERT INTO student_teacher_pricing (
      student_id, teacher_id, initial_booking_date,
      initial_teacher_tier, locked_hourly_price,
      price_locked_until, current_hourly_price
    ) VALUES (
      student_id_param, teacher_id_param, now(),
      v_teacher.tier, v_tier.student_hourly_price,
      now() + interval '12 months', v_tier.student_hourly_price
    );

    RETURN v_tier.student_hourly_price;
  END IF;

  -- Check if price lock expired
  IF v_pricing.price_locked_until < now() THEN
    -- Update to current tier pricing
    UPDATE student_teacher_pricing
    SET current_hourly_price = v_tier.student_hourly_price,
        is_price_locked = false,
        last_price_update = now()
    WHERE id = v_pricing.id;

    RETURN v_tier.student_hourly_price;
  END IF;

  -- Return locked price
  RETURN v_pricing.current_hourly_price;
END;
$$ LANGUAGE plpgsql;

-- 10. CREATE RLS POLICIES
ALTER TABLE teacher_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view teacher tiers" ON teacher_tiers FOR SELECT USING (true);

ALTER TABLE teacher_qualifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can view own qualifications" ON teacher_qualifications FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can insert own qualifications" ON teacher_qualifications FOR INSERT WITH CHECK (auth.uid() = teacher_id);

ALTER TABLE teacher_tier_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can view own tier history" ON teacher_tier_history FOR SELECT USING (auth.uid() = teacher_id);

ALTER TABLE student_teacher_pricing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view own pricing" ON student_teacher_pricing FOR SELECT USING (auth.uid() = student_id);

ALTER TABLE teacher_tier_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can view own applications" ON teacher_tier_applications FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can create applications" ON teacher_tier_applications FOR INSERT WITH CHECK (auth.uid() = teacher_id);

-- 11. CREATE VIEW FOR TEACHER TIER STATS
CREATE OR REPLACE VIEW teacher_tier_stats AS
SELECT
  tp.id as teacher_id,
  tp.tier,
  tt.tier_name,
  tt.tier_icon,
  tt.teacher_hourly_rate,
  tt.student_hourly_price,
  tt.platform_margin,
  tp.hours_taught,
  tp.average_rating,
  tp.total_lessons,
  tp.completed_lessons,
  tp.tier_assigned_at,

  -- Progress to next tier
  CASE
    WHEN tt.tier_level < 3 THEN
      (SELECT tier FROM teacher_tiers WHERE tier_level = tt.tier_level + 1 AND requires_manual_approval = false)
    ELSE
      NULL
  END as next_auto_tier,

  CASE
    WHEN tt.tier_level < 3 THEN
      (SELECT min_hours_taught - tp.hours_taught FROM teacher_tiers WHERE tier_level = tt.tier_level + 1 AND requires_manual_approval = false)
    ELSE
      NULL
  END as hours_to_next_tier,

  -- Student count with pricing
  (SELECT COUNT(*) FROM student_teacher_pricing WHERE teacher_id = tp.id) as total_students,
  (SELECT COUNT(*) FROM student_teacher_pricing WHERE teacher_id = tp.id AND is_price_locked = true) as grandfathered_students

FROM teacher_profiles tp
JOIN teacher_tiers tt ON tt.tier = tp.tier;

GRANT SELECT ON teacher_tier_stats TO authenticated;

-- 12. ADD COMMENTS
COMMENT ON TABLE teacher_tiers IS '5-tier teacher progression system with dynamic pricing';
COMMENT ON TABLE student_teacher_pricing IS 'Grandfather pricing: locks student price for 12 months';
COMMENT ON TABLE teacher_tier_applications IS 'Applications for Expert/Master tiers requiring manual approval';
COMMENT ON COLUMN teacher_tiers.platform_margin IS 'Locked at £8 from Skilled tier onwards';
