-- Fix Teacher Tier System - Apply Missing Parts Only
-- This script safely adds missing components without recreating existing ones

-- 1. Ensure teacher_profiles has tier columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teacher_profiles' AND column_name='tier') THEN
    ALTER TABLE teacher_profiles ADD COLUMN tier text DEFAULT 'newcomer' REFERENCES teacher_tiers(tier);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teacher_profiles' AND column_name='tier_assigned_at') THEN
    ALTER TABLE teacher_profiles ADD COLUMN tier_assigned_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teacher_profiles' AND column_name='hours_taught') THEN
    ALTER TABLE teacher_profiles ADD COLUMN hours_taught decimal(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teacher_profiles' AND column_name='average_rating') THEN
    ALTER TABLE teacher_profiles ADD COLUMN average_rating decimal(2,1) DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teacher_profiles' AND column_name='total_lessons') THEN
    ALTER TABLE teacher_profiles ADD COLUMN total_lessons integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teacher_profiles' AND column_name='completed_lessons') THEN
    ALTER TABLE teacher_profiles ADD COLUMN completed_lessons integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teacher_profiles' AND column_name='tier_progression_eligible') THEN
    ALTER TABLE teacher_profiles ADD COLUMN tier_progression_eligible boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teacher_profiles' AND column_name='manual_tier_override') THEN
    ALTER TABLE teacher_profiles ADD COLUMN manual_tier_override boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teacher_profiles' AND column_name='tier_assigned_by') THEN
    ALTER TABLE teacher_profiles ADD COLUMN tier_assigned_by uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- 2. Create supporting tables if they don't exist
CREATE TABLE IF NOT EXISTS teacher_qualifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  qualification_type text NOT NULL,
  qualification_name text NOT NULL,
  issuing_institution text,
  year_obtained integer,
  certificate_url text,
  verified boolean DEFAULT false,
  verified_by uuid REFERENCES auth.users(id),
  verified_at timestamptz,
  verification_notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_teacher_qualifications_teacher ON teacher_qualifications(teacher_id);

CREATE TABLE IF NOT EXISTS teacher_tier_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  from_tier text REFERENCES teacher_tiers(tier),
  to_tier text REFERENCES teacher_tiers(tier),
  promotion_type text NOT NULL,
  promotion_reason text,
  hours_at_promotion decimal(10,2),
  rating_at_promotion decimal(2,1),
  promoted_by uuid REFERENCES auth.users(id),
  promoted_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_teacher_tier_history_teacher ON teacher_tier_history(teacher_id);

CREATE TABLE IF NOT EXISTS student_teacher_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  initial_booking_date timestamptz NOT NULL,
  initial_teacher_tier text REFERENCES teacher_tiers(tier),
  locked_hourly_price decimal(5,2) NOT NULL,
  price_locked_until timestamptz NOT NULL,
  is_price_locked boolean DEFAULT true,
  current_hourly_price decimal(5,2) NOT NULL,
  last_price_update timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, teacher_id)
);

CREATE INDEX IF NOT EXISTS idx_student_teacher_pricing_student ON student_teacher_pricing(student_id);
CREATE INDEX IF NOT EXISTS idx_student_teacher_pricing_teacher ON student_teacher_pricing(teacher_id);

CREATE TABLE IF NOT EXISTS teacher_tier_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  requested_tier text REFERENCES teacher_tiers(tier),
  requested_rate decimal(5,2),
  application_reason text,
  years_experience integer,
  english_proficiency text,
  intro_video_url text,
  recitation_sample_url text,
  certificates jsonb,
  status text DEFAULT 'pending',
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  review_notes text,
  assigned_tier text REFERENCES teacher_tiers(tier),
  assigned_rate decimal(5,2),
  interview_scheduled_at timestamptz,
  interview_completed_at timestamptz,
  interview_notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tier_applications_teacher ON teacher_tier_applications(teacher_id);
CREATE INDEX IF NOT EXISTS idx_tier_applications_status ON teacher_tier_applications(status);

-- 3. Create/Replace Functions
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
  SELECT * INTO v_teacher FROM teacher_profiles WHERE id = teacher_id_param;
  SELECT * INTO v_current_tier FROM teacher_tiers WHERE tier = v_teacher.tier;
  SELECT * INTO v_next_tier FROM teacher_tiers
  WHERE tier_level = v_current_tier.tier_level + 1
    AND requires_manual_approval = false
  ORDER BY tier_level LIMIT 1;

  IF v_next_tier IS NULL THEN
    RETURN QUERY SELECT false, v_teacher.tier, NULL::text, 0::decimal, 0::decimal,
      'No automatic progression available. Apply for manual tier review.'::text;
    RETURN;
  END IF;

  IF v_teacher.hours_taught >= v_next_tier.min_hours_taught
     AND v_teacher.average_rating >= v_next_tier.min_rating
     AND v_teacher.tier_progression_eligible = true THEN
    RETURN QUERY SELECT true, v_teacher.tier, v_next_tier.tier, 0::decimal, 0::decimal,
      'Eligible for automatic progression!'::text;
  ELSE
    RETURN QUERY SELECT false, v_teacher.tier, v_next_tier.tier,
      GREATEST(0, v_next_tier.min_hours_taught - v_teacher.hours_taught),
      GREATEST(0, v_next_tier.min_rating - v_teacher.average_rating),
      format('Need %s more hours and %s rating',
        GREATEST(0, v_next_tier.min_hours_taught - v_teacher.hours_taught),
        v_next_tier.min_rating)::text;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION auto_promote_teacher()
RETURNS TRIGGER AS $$
DECLARE
  v_next_tier teacher_tiers%ROWTYPE;
BEGIN
  IF NEW.tier_progression_eligible = true AND NEW.manual_tier_override = false THEN
    SELECT * INTO v_next_tier FROM teacher_tiers
    WHERE tier_level = (SELECT tier_level FROM teacher_tiers WHERE tier = NEW.tier) + 1
      AND requires_manual_approval = false
      AND NEW.hours_taught >= min_hours_taught
      AND NEW.average_rating >= min_rating
    ORDER BY tier_level LIMIT 1;

    IF v_next_tier IS NOT NULL THEN
      NEW.tier := v_next_tier.tier;
      NEW.tier_assigned_at := now();

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

DROP TRIGGER IF EXISTS trigger_auto_promote_teacher ON teacher_profiles;
CREATE TRIGGER trigger_auto_promote_teacher
  BEFORE UPDATE OF hours_taught, average_rating ON teacher_profiles
  FOR EACH ROW EXECUTE FUNCTION auto_promote_teacher();

CREATE OR REPLACE FUNCTION get_student_teacher_price(
  student_id_param uuid,
  teacher_id_param uuid
) RETURNS decimal AS $$
DECLARE
  v_pricing student_teacher_pricing%ROWTYPE;
  v_teacher teacher_profiles%ROWTYPE;
  v_tier teacher_tiers%ROWTYPE;
BEGIN
  SELECT * INTO v_pricing FROM student_teacher_pricing
  WHERE student_id = student_id_param AND teacher_id = teacher_id_param;

  SELECT * INTO v_teacher FROM teacher_profiles WHERE id = teacher_id_param;
  SELECT * INTO v_tier FROM teacher_tiers WHERE tier = v_teacher.tier;

  IF v_pricing IS NULL THEN
    INSERT INTO student_teacher_pricing (
      student_id, teacher_id, initial_booking_date, initial_teacher_tier,
      locked_hourly_price, price_locked_until, current_hourly_price
    ) VALUES (
      student_id_param, teacher_id_param, now(), v_teacher.tier,
      v_tier.student_hourly_price, now() + interval '12 months', v_tier.student_hourly_price
    );
    RETURN v_tier.student_hourly_price;
  END IF;

  IF v_pricing.price_locked_until < now() THEN
    UPDATE student_teacher_pricing
    SET current_hourly_price = v_tier.student_hourly_price,
        is_price_locked = false, last_price_update = now()
    WHERE id = v_pricing.id;
    RETURN v_tier.student_hourly_price;
  END IF;

  RETURN v_pricing.current_hourly_price;
END;
$$ LANGUAGE plpgsql;

-- 4. Setup RLS
ALTER TABLE teacher_tiers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view teacher tiers" ON teacher_tiers;
CREATE POLICY "Anyone can view teacher tiers" ON teacher_tiers FOR SELECT USING (true);

ALTER TABLE teacher_qualifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Teachers can view own qualifications" ON teacher_qualifications;
DROP POLICY IF EXISTS "Teachers can insert own qualifications" ON teacher_qualifications;
CREATE POLICY "Teachers can view own qualifications" ON teacher_qualifications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM teacher_profiles WHERE id = teacher_id AND user_id = auth.uid())
  );
CREATE POLICY "Teachers can insert own qualifications" ON teacher_qualifications
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM teacher_profiles WHERE id = teacher_id AND user_id = auth.uid())
  );

ALTER TABLE teacher_tier_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Teachers can view own tier history" ON teacher_tier_history;
CREATE POLICY "Teachers can view own tier history" ON teacher_tier_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM teacher_profiles WHERE id = teacher_id AND user_id = auth.uid())
  );

ALTER TABLE student_teacher_pricing ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students can view own pricing" ON student_teacher_pricing;
CREATE POLICY "Students can view own pricing" ON student_teacher_pricing
  FOR SELECT USING (auth.uid() = student_id);

ALTER TABLE teacher_tier_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Teachers can view own applications" ON teacher_tier_applications;
DROP POLICY IF EXISTS "Teachers can create applications" ON teacher_tier_applications;
CREATE POLICY "Teachers can view own applications" ON teacher_tier_applications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM teacher_profiles WHERE id = teacher_id AND user_id = auth.uid())
  );
CREATE POLICY "Teachers can create applications" ON teacher_tier_applications
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM teacher_profiles WHERE id = teacher_id AND user_id = auth.uid())
  );

-- 5. Create/Replace View
CREATE OR REPLACE VIEW teacher_tier_stats AS
SELECT
  tp.id as teacher_id, tp.tier, tt.tier_name, tt.tier_icon,
  tt.teacher_hourly_rate, tt.student_hourly_price, tt.platform_margin,
  tp.hours_taught, tp.average_rating, tp.total_lessons, tp.completed_lessons,
  tp.tier_assigned_at,
  CASE WHEN tt.tier_level < 3 THEN
    (SELECT tier FROM teacher_tiers WHERE tier_level = tt.tier_level + 1 AND requires_manual_approval = false)
  ELSE NULL END as next_auto_tier,
  CASE WHEN tt.tier_level < 3 THEN
    (SELECT min_hours_taught - tp.hours_taught FROM teacher_tiers WHERE tier_level = tt.tier_level + 1 AND requires_manual_approval = false)
  ELSE NULL END as hours_to_next_tier,
  (SELECT COUNT(*) FROM student_teacher_pricing WHERE teacher_id = tp.id) as total_students,
  (SELECT COUNT(*) FROM student_teacher_pricing WHERE teacher_id = tp.id AND is_price_locked = true) as grandfathered_students
FROM teacher_profiles tp
JOIN teacher_tiers tt ON tt.tier = tp.tier;

GRANT SELECT ON teacher_tier_stats TO authenticated;
