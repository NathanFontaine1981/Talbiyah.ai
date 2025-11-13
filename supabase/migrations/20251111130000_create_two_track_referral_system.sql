-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TWO-TRACK REFERRAL SYSTEM WITH TRANSFERABLE HOURS
-- Track 1: Conversion Bonus (when referral completes first paid lesson)
-- Track 2: Lifetime Learning Hours (ongoing rewards for all referral lessons)
-- Feature: Transfer hours to others (Silver+ only)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. CREATE REFERRAL TIERS TABLE
CREATE TABLE IF NOT EXISTS referral_tiers (
  tier text PRIMARY KEY,
  min_referrals integer NOT NULL,
  max_referrals integer,

  -- Rewards
  unlock_bonus decimal(10,2) DEFAULT 0, -- one-time bonus on reaching tier
  conversion_bonus decimal(10,2) NOT NULL, -- per converted referral
  hourly_multiplier decimal(3,2) DEFAULT 1.0, -- 1.0 = 100%, 1.1 = 110%, etc.

  -- Transfer limits (0 = cannot transfer)
  transfer_limit_monthly integer DEFAULT 0,

  -- Benefits
  benefits jsonb,

  -- Display
  color text,
  icon text,
  badge_image text,

  created_at timestamptz DEFAULT now()
);

-- Seed tier data
INSERT INTO referral_tiers (tier, min_referrals, max_referrals, unlock_bonus, conversion_bonus, hourly_multiplier, transfer_limit_monthly, benefits, color, icon) VALUES
  ('bronze', 0, 4, 0, 5.00, 1.0, 0, '{"priority_booking": false, "can_transfer": false}', '#CD7F32', '🥉'),
  ('silver', 5, 9, 25.00, 7.00, 1.1, 10, '{"priority_booking": true, "can_transfer": true}', '#C0C0C0', '🥈'),
  ('gold', 10, 19, 75.00, 10.00, 1.2, 20, '{"priority_booking": true, "can_transfer": true, "featured_referrer": true, "free_group_sessions": true}', '#FFD700', '🥇'),
  ('platinum', 20, NULL, 200.00, 15.00, 1.3, 50, '{"priority_booking": true, "can_transfer": true, "featured_referrer": true, "free_group_sessions": true, "dedicated_support": true, "cash_withdrawal": true}', '#E5E4E2', '💎')
ON CONFLICT (tier) DO UPDATE SET
  unlock_bonus = EXCLUDED.unlock_bonus,
  conversion_bonus = EXCLUDED.conversion_bonus,
  hourly_multiplier = EXCLUDED.hourly_multiplier,
  transfer_limit_monthly = EXCLUDED.transfer_limit_monthly,
  benefits = EXCLUDED.benefits,
  color = EXCLUDED.color,
  icon = EXCLUDED.icon;

-- 2. CREATE REFERRAL CREDITS TABLE
CREATE TABLE IF NOT EXISTS referral_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  -- Tier info
  tier text DEFAULT 'bronze' REFERENCES referral_tiers(tier),
  tier_unlocked_at timestamptz,

  -- Referral counts
  total_referrals integer DEFAULT 0,
  active_referrals integer DEFAULT 0, -- referrals who completed at least 1 paid lesson

  -- Credits (in GBP)
  total_earned decimal(10,2) DEFAULT 0,
  total_used decimal(10,2) DEFAULT 0,
  available_balance decimal(10,2) DEFAULT 0,

  -- Hours tracking
  referred_hours decimal(10,2) DEFAULT 0, -- total hours from all referrals
  earned_hours decimal(10,2) DEFAULT 0, -- hours converted to free lessons (referred_hours / 10)
  used_hours decimal(10,2) DEFAULT 0,
  available_hours decimal(10,2) DEFAULT 0,

  -- Transfer tracking (Silver+ only)
  transferred_hours decimal(10,2) DEFAULT 0,
  transfer_limit_monthly integer DEFAULT 0, -- based on tier
  transfers_this_month integer DEFAULT 0,
  last_transfer_reset timestamptz DEFAULT date_trunc('month', CURRENT_DATE),

  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referral_credits_user ON referral_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_credits_tier ON referral_credits(tier);

-- 3. CREATE REFERRAL TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS referral_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_id uuid REFERENCES referrals(id) ON DELETE SET NULL,

  type text NOT NULL, -- 'conversion_bonus', 'hourly_reward', 'tier_unlock', 'transfer_out', 'transfer_in', 'used'

  -- Amount tracking
  credit_amount decimal(10,2) DEFAULT 0, -- GBP
  hours_amount decimal(10,2) DEFAULT 0, -- hours

  description text,

  -- Transfer specific (if type = 'transfer_out' or 'transfer_in')
  transfer_to_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  transfer_from_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  transfer_message text,

  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referral_transactions_user ON referral_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_transactions_type ON referral_transactions(type);
CREATE INDEX IF NOT EXISTS idx_referral_transactions_created ON referral_transactions(created_at DESC);

-- 4. UPDATE REFERRALS TABLE
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS
  completed_lessons integer DEFAULT 0;

ALTER TABLE referrals ADD COLUMN IF NOT EXISTS
  total_hours decimal(10,2) DEFAULT 0;

ALTER TABLE referrals ADD COLUMN IF NOT EXISTS
  credits_earned decimal(10,2) DEFAULT 0;

ALTER TABLE referrals ADD COLUMN IF NOT EXISTS
  conversion_paid boolean DEFAULT false;

ALTER TABLE referrals ADD COLUMN IF NOT EXISTS
  last_lesson_date timestamptz;

-- 5. CREATE RLS POLICIES

-- referral_tiers (public read)
ALTER TABLE referral_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view referral tiers" ON referral_tiers FOR SELECT USING (true);

-- referral_credits (users can only see their own)
ALTER TABLE referral_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own referral credits" ON referral_credits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own referral credits" ON referral_credits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own referral credits" ON referral_credits FOR UPDATE USING (auth.uid() = user_id);

-- referral_transactions (users can only see their own)
ALTER TABLE referral_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON referral_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON referral_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. CREATE HELPER FUNCTIONS

-- Function to calculate tier based on active referrals
CREATE OR REPLACE FUNCTION calculate_referral_tier(active_referrals_count integer)
RETURNS text AS $$
BEGIN
  IF active_referrals_count >= 20 THEN
    RETURN 'platinum';
  ELSIF active_referrals_count >= 10 THEN
    RETURN 'gold';
  ELSIF active_referrals_count >= 5 THEN
    RETURN 'silver';
  ELSE
    RETURN 'bronze';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's referral stats
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
BEGIN
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
$$ LANGUAGE plpgsql;

-- 7. CREATE VIEW FOR LEADERBOARD
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
ORDER BY rank;

-- Grant access to view
GRANT SELECT ON referral_leaderboard TO authenticated;

-- 8. ADD COMMENTS
COMMENT ON TABLE referral_credits IS 'Tracks user referral credits, tier, and hours earned';
COMMENT ON TABLE referral_transactions IS 'Records all referral reward transactions including transfers';
COMMENT ON TABLE referral_tiers IS 'Defines tier levels and their benefits';
COMMENT ON COLUMN referral_credits.available_balance IS 'GBP credit balance available to use';
COMMENT ON COLUMN referral_credits.available_hours IS 'Free lesson hours available to use or transfer';
COMMENT ON COLUMN referral_credits.referred_hours IS 'Total hours completed by all referrals';
COMMENT ON COLUMN referral_credits.earned_hours IS 'Hours earned from milestones (referred_hours / 10)';
