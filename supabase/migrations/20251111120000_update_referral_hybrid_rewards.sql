-- Update Referral System to Hybrid Model (Initial + Ongoing Rewards)
-- This migration updates tiers to support both one-time and ongoing rewards

-- 1. Add columns to track ongoing rewards for each referral
ALTER TABLE referrals
  ADD COLUMN IF NOT EXISTS total_hours_tracked DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_hours_milestone INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS initial_reward_paid BOOLEAN DEFAULT FALSE;

-- 2. Update referral_tiers to include initial reward and ongoing rate
ALTER TABLE referral_tiers
  ADD COLUMN IF NOT EXISTS initial_reward_hours DECIMAL(5,2) DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS ongoing_reward_rate DECIMAL(5,2) DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS hours_per_milestone INTEGER DEFAULT 10;

-- 3. Update existing tiers with hybrid reward structure
UPDATE referral_tiers SET
  initial_reward_hours = 1.0,
  ongoing_reward_rate = 1.0,
  hours_per_milestone = 10,
  reward_multiplier = 1.0
WHERE tier_name = 'Bronze';

UPDATE referral_tiers SET
  initial_reward_hours = 1.5,
  ongoing_reward_rate = 1.25,
  hours_per_milestone = 10,
  reward_multiplier = 1.25
WHERE tier_name = 'Silver';

UPDATE referral_tiers SET
  initial_reward_hours = 2.0,
  ongoing_reward_rate = 1.5,
  hours_per_milestone = 10,
  reward_multiplier = 1.5
WHERE tier_name = 'Gold';

UPDATE referral_tiers SET
  initial_reward_hours = 3.0,
  ongoing_reward_rate = 2.0,
  hours_per_milestone = 10,
  reward_multiplier = 2.0
WHERE tier_name = 'Platinum';

UPDATE referral_tiers SET
  initial_reward_hours = 5.0,
  ongoing_reward_rate = 3.0,
  hours_per_milestone = 10,
  reward_multiplier = 3.0
WHERE tier_name = 'Diamond';

-- 4. Update tier benefits to reflect hybrid model
UPDATE referral_tiers SET tier_benefits =
  '["1h initial reward", "1h per 10h ongoing", "Access to referral dashboard"]'
WHERE tier_name = 'Bronze';

UPDATE referral_tiers SET tier_benefits =
  '["1.5h initial reward", "1.25h per 10h ongoing", "Priority support", "Exclusive community access"]'
WHERE tier_name = 'Silver';

UPDATE referral_tiers SET tier_benefits =
  '["2h initial reward", "1.5h per 10h ongoing", "Early access to new features", "Monthly bonus credits"]'
WHERE tier_name = 'Gold';

UPDATE referral_tiers SET tier_benefits =
  '["3h initial reward", "2h per 10h ongoing", "VIP support", "Personalized learning plan"]'
WHERE tier_name = 'Platinum';

UPDATE referral_tiers SET tier_benefits =
  '["5h initial reward", "3h per 10h ongoing", "Lifetime VIP status", "Annual free course", "Featured on platform"]'
WHERE tier_name = 'Diamond';

-- 5. Create function to process ongoing rewards
CREATE OR REPLACE FUNCTION process_ongoing_referral_rewards(
  referral_id_param UUID,
  new_hours_completed DECIMAL
)
RETURNS TABLE(
  milestone_reached INTEGER,
  reward_hours DECIMAL,
  total_milestones INTEGER
) AS $$
DECLARE
  v_referral RECORD;
  v_tier RECORD;
  v_new_milestone INTEGER;
  v_milestones_earned INTEGER;
  v_reward_hours DECIMAL;
BEGIN
  -- Get referral details
  SELECT * INTO v_referral
  FROM referrals
  WHERE id = referral_id_param;

  -- Get tier details
  SELECT * INTO v_tier
  FROM referral_tiers
  WHERE id = v_referral.tier_id;

  -- Calculate new total hours
  UPDATE referrals
  SET total_hours_tracked = total_hours_tracked + new_hours_completed
  WHERE id = referral_id_param;

  -- Check if we've reached a new milestone
  v_new_milestone := FLOOR((v_referral.total_hours_tracked + new_hours_completed) / v_tier.hours_per_milestone);

  IF v_new_milestone > v_referral.last_hours_milestone THEN
    -- Calculate how many milestones were reached
    v_milestones_earned := v_new_milestone - v_referral.last_hours_milestone;
    v_reward_hours := v_milestones_earned * v_tier.ongoing_reward_rate;

    -- Update last milestone
    UPDATE referrals
    SET last_hours_milestone = v_new_milestone
    WHERE id = referral_id_param;

    RETURN QUERY SELECT v_new_milestone, v_reward_hours, v_milestones_earned;
  ELSE
    RETURN QUERY SELECT v_referral.last_hours_milestone, 0::DECIMAL, 0;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 6. Create index for performance
CREATE INDEX IF NOT EXISTS idx_referrals_hours_tracked ON referrals(total_hours_tracked);

COMMENT ON COLUMN referrals.total_hours_tracked IS 'Total hours completed by referred user (for ongoing rewards)';
COMMENT ON COLUMN referrals.initial_reward_paid IS 'Whether the initial reward has been paid';
COMMENT ON COLUMN referrals.last_hours_milestone IS 'Last milestone reached (e.g., 1 = 10h, 2 = 20h, etc.)';
COMMENT ON COLUMN referral_tiers.initial_reward_hours IS 'Free hours given when referral completes first lesson';
COMMENT ON COLUMN referral_tiers.ongoing_reward_rate IS 'Free hours given per milestone reached';
