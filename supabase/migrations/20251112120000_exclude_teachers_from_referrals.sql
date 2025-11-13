-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- EXCLUDE TEACHERS FROM REFERRAL SYSTEM
-- Teachers should not participate in the referral program
-- Only students, parents, and learners can refer others
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. ADD CHECK CONSTRAINT ON REFERRAL_CREDITS
-- Prevent teachers from having referral credits
ALTER TABLE referral_credits
  DROP CONSTRAINT IF EXISTS referral_credits_no_teachers_check;

ALTER TABLE referral_credits
  ADD CONSTRAINT referral_credits_no_teachers_check
  CHECK (
    user_id IN (
      SELECT id FROM profiles WHERE role IN ('student', 'learner', 'parent')
    )
  );

-- 2. UPDATE RLS POLICIES ON REFERRAL_CREDITS
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own referral credits" ON referral_credits;
DROP POLICY IF EXISTS "Users can insert own referral credits" ON referral_credits;
DROP POLICY IF EXISTS "Users can update own referral credits" ON referral_credits;

-- Recreate with teacher exclusion
CREATE POLICY "Non-teachers can view own referral credits" ON referral_credits
  FOR SELECT
  USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('student', 'learner', 'parent')
    )
  );

CREATE POLICY "Non-teachers can insert own referral credits" ON referral_credits
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('student', 'learner', 'parent')
    )
  );

CREATE POLICY "Non-teachers can update own referral credits" ON referral_credits
  FOR UPDATE
  USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('student', 'learner', 'parent')
    )
  );

-- 3. UPDATE RLS POLICIES ON REFERRAL_TRANSACTIONS
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own transactions" ON referral_transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON referral_transactions;

-- Recreate with teacher exclusion
CREATE POLICY "Non-teachers can view own transactions" ON referral_transactions
  FOR SELECT
  USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('student', 'learner', 'parent')
    )
  );

CREATE POLICY "Non-teachers can insert own transactions" ON referral_transactions
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('student', 'learner', 'parent')
    )
  );

-- 4. UPDATE RLS POLICIES ON REFERRALS TABLE
-- Drop existing policy
DROP POLICY IF EXISTS "Users can read own referral records" ON referrals;

-- Recreate with teacher exclusion
CREATE POLICY "Non-teachers can read own referral records" ON referrals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM learners
      WHERE learners.user_id = auth.uid()
      AND learners.id = referrals.referrer_id
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('student', 'learner', 'parent')
      )
    )
  );

-- 5. UPDATE REFERRAL LEADERBOARD VIEW
-- Exclude teachers from leaderboard
DROP VIEW IF EXISTS referral_leaderboard;

CREATE OR REPLACE VIEW referral_leaderboard AS
SELECT
  rc.user_id,
  p.full_name,
  p.avatar_url,
  rc.tier,
  rc.active_referrals,
  rc.total_earned,
  rc.earned_hours,
  RANK() OVER (ORDER BY rc.active_referrals DESC, rc.total_earned DESC) as rank
FROM referral_credits rc
JOIN profiles p ON p.id = rc.user_id
WHERE rc.active_referrals > 0
  AND p.role IN ('student', 'learner', 'parent')  -- Exclude teachers
ORDER BY rank;

GRANT SELECT ON referral_leaderboard TO authenticated;

-- 6. UPDATE get_referral_stats FUNCTION
-- Only return stats for non-teachers
CREATE OR REPLACE FUNCTION get_referral_stats(user_id_param uuid)
RETURNS TABLE(
  tier text,
  tier_info jsonb,
  total_referrals integer,
  active_referrals integer,
  total_earned decimal,
  available_balance decimal,
  earned_hours decimal,
  available_hours decimal,
  next_tier text,
  referrals_to_next_tier integer,
  can_transfer boolean,
  transfer_limit integer,
  transfers_used integer
) AS $$
DECLARE
  v_credits referral_credits%ROWTYPE;
  v_tier_info referral_tiers%ROWTYPE;
  v_next_tier referral_tiers%ROWTYPE;
  v_user_role text;
BEGIN
  -- Check if user is a teacher
  SELECT role INTO v_user_role
  FROM profiles
  WHERE id = user_id_param;

  -- If user is a teacher, return NULL (no referral access)
  IF v_user_role = 'teacher' THEN
    RETURN;
  END IF;

  -- Get user's credits
  SELECT * INTO v_credits
  FROM referral_credits
  WHERE referral_credits.user_id = user_id_param;

  -- If no credits, create default
  IF v_credits IS NULL THEN
    INSERT INTO referral_credits (user_id)
    VALUES (user_id_param)
    RETURNING * INTO v_credits;
  END IF;

  -- Get tier info
  SELECT * INTO v_tier_info
  FROM referral_tiers
  WHERE referral_tiers.tier = v_credits.tier;

  -- Get next tier
  SELECT * INTO v_next_tier
  FROM referral_tiers
  WHERE referral_tiers.min_referrals > v_credits.active_referrals
  ORDER BY referral_tiers.min_referrals
  LIMIT 1;

  RETURN QUERY SELECT
    v_credits.tier,
    row_to_json(v_tier_info)::jsonb,
    v_credits.total_referrals,
    v_credits.active_referrals,
    v_credits.total_earned,
    v_credits.available_balance,
    v_credits.earned_hours,
    v_credits.available_hours,
    v_next_tier.tier,
    COALESCE(v_next_tier.min_referrals - v_credits.active_referrals, 0),
    (v_tier_info.benefits->>'can_transfer')::boolean,
    v_credits.transfer_limit_monthly,
    v_credits.transfers_this_month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. REMOVE REFERRAL CODE FROM TEACHER PROFILES
-- Set referral_code to NULL for all teachers
UPDATE learners
SET referral_code = NULL
WHERE user_id IN (
  SELECT id FROM profiles WHERE role = 'teacher'
);

-- 8. ADD TRIGGER TO PREVENT REFERRAL CODE GENERATION FOR TEACHERS
CREATE OR REPLACE FUNCTION prevent_teacher_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  -- If user is a teacher, don't generate referral code
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = NEW.user_id
    AND role = 'teacher'
  ) THEN
    NEW.referral_code := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_teacher_referral_code_trigger ON learners;

CREATE TRIGGER prevent_teacher_referral_code_trigger
  BEFORE INSERT OR UPDATE ON learners
  FOR EACH ROW
  EXECUTE FUNCTION prevent_teacher_referral_code();

-- 9. ADD COMMENTS
COMMENT ON CONSTRAINT referral_credits_no_teachers_check ON referral_credits IS
  'Ensures only students, learners, and parents can participate in referral program';

COMMENT ON FUNCTION prevent_teacher_referral_code() IS
  'Prevents referral code generation for teachers';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- MIGRATION COMPLETE
-- Teachers are now excluded from the referral system
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
