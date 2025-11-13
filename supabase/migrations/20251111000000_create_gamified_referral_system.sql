-- Gamified Referral System Migration
-- This creates a comprehensive referral system with tiers, achievements, and rewards

-- 1. Create referral_tiers table
CREATE TABLE IF NOT EXISTS referral_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name TEXT NOT NULL UNIQUE,
  tier_level INTEGER NOT NULL UNIQUE,
  min_referrals INTEGER NOT NULL,
  max_referrals INTEGER,
  reward_multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.0,
  badge_icon TEXT,
  badge_color TEXT,
  tier_benefits JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default tiers
INSERT INTO referral_tiers (tier_name, tier_level, min_referrals, max_referrals, reward_multiplier, badge_icon, badge_color, tier_benefits) VALUES
  ('Bronze', 1, 0, 4, 1.0, '🥉', 'amber', '["Base rewards", "Access to referral dashboard"]'),
  ('Silver', 2, 5, 9, 1.25, '🥈', 'slate', '["25% bonus on all rewards", "Priority support", "Exclusive community access"]'),
  ('Gold', 3, 10, 19, 1.5, '🥇', 'yellow', '["50% bonus on all rewards", "Early access to new features", "Monthly bonus credits"]'),
  ('Platinum', 4, 20, 49, 2.0, '💎', 'cyan', '["Double rewards", "VIP support", "Personalized learning plan", "Annual bonus package"]'),
  ('Diamond', 5, 50, NULL, 3.0, '👑', 'purple', '["Triple rewards", "Lifetime VIP status", "Annual free course", "Featured on platform", "Direct line to founders"]')
ON CONFLICT (tier_name) DO NOTHING;

-- 2. Add gamification columns to existing referrals table
ALTER TABLE referrals
  ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tier_id UUID REFERENCES referral_tiers(id),
  ADD COLUMN IF NOT EXISTS milestone_reached INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_reward_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS referral_rank INTEGER,
  ADD COLUMN IF NOT EXISTS total_impact_hours DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reward_amount DECIMAL(10,2) DEFAULT 0;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_referrals_tier ON referrals(tier_id);
CREATE INDEX IF NOT EXISTS idx_referrals_points ON referrals(points_earned DESC);

-- 3. Create referral_achievements table
CREATE TABLE IF NOT EXISTS referral_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  achievement_name TEXT NOT NULL UNIQUE,
  achievement_description TEXT,
  achievement_icon TEXT,
  achievement_type TEXT CHECK (achievement_type IN ('milestone', 'streak', 'quality', 'speed', 'special')),
  requirement_value INTEGER,
  points_reward INTEGER DEFAULT 0,
  credits_reward DECIMAL(10,2) DEFAULT 0,
  is_hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default achievements
INSERT INTO referral_achievements (achievement_name, achievement_description, achievement_icon, achievement_type, requirement_value, points_reward, credits_reward) VALUES
  ('First Referral', 'Successfully referred your first student', '🎯', 'milestone', 1, 100, 5.0),
  ('Helping Hand', 'Referred 3 students', '🤝', 'milestone', 3, 250, 10.0),
  ('Community Builder', 'Referred 5 students', '🏗️', 'milestone', 5, 500, 25.0),
  ('Islamic Ambassador', 'Referred 10 students', '🕌', 'milestone', 10, 1000, 50.0),
  ('Da''wah Champion', 'Referred 25 students', '⭐', 'milestone', 25, 2500, 125.0),
  ('Ummah Connector', 'Referred 50 students', '🌟', 'milestone', 50, 5000, 250.0),
  ('Quick Start', 'First referral signed up within 24 hours', '⚡', 'speed', 1, 150, 0),
  ('Quality Referrer', '5 referrals completed first lesson', '💯', 'quality', 5, 500, 0),
  ('Week Streak', 'Referred someone every week for a month', '🔥', 'streak', 4, 300, 0),
  ('Family Affair', 'Referred 3 family members', '👨‍👩‍👧‍👦', 'special', 3, 400, 20.0)
ON CONFLICT (achievement_name) DO NOTHING;

-- 4. Create user_achievements junction table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES referral_achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notified BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);

-- 5. Create referral_rewards_history table
CREATE TABLE IF NOT EXISTS referral_rewards_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referral_id UUID REFERENCES referrals(id) ON DELETE SET NULL,
  reward_type TEXT CHECK (reward_type IN ('credit', 'points', 'achievement', 'tier_bonus', 'milestone')),
  reward_amount DECIMAL(10,2),
  reward_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rewards_history_user ON referral_rewards_history(user_id);
CREATE INDEX IF NOT EXISTS idx_rewards_history_date ON referral_rewards_history(created_at DESC);

-- 6. Create function to calculate user tier
CREATE OR REPLACE FUNCTION calculate_user_tier(user_id_param UUID)
RETURNS UUID AS $$
DECLARE
  completed_referrals INTEGER;
  tier_id_result UUID;
BEGIN
  -- Count completed referrals
  SELECT COUNT(*) INTO completed_referrals
  FROM referrals
  WHERE referrer_id = user_id_param
    AND status = 'completed';

  -- Find appropriate tier
  SELECT id INTO tier_id_result
  FROM referral_tiers
  WHERE min_referrals <= completed_referrals
    AND (max_referrals IS NULL OR completed_referrals <= max_referrals)
  ORDER BY tier_level DESC
  LIMIT 1;

  RETURN tier_id_result;
END;
$$ LANGUAGE plpgsql;

-- 7. Create function to update referral stats
CREATE OR REPLACE FUNCTION update_referral_stats()
RETURNS TRIGGER AS $$
DECLARE
  new_tier_id UUID;
  old_tier_level INTEGER;
  new_tier_level INTEGER;
BEGIN
  -- Only process if status changed to completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN

    -- Calculate new tier
    new_tier_id := calculate_user_tier(NEW.referrer_id);

    -- Get old tier level
    SELECT COALESCE(tier_level, 0) INTO old_tier_level
    FROM referral_tiers
    WHERE id = OLD.tier_id;

    -- Get new tier level
    SELECT tier_level INTO new_tier_level
    FROM referral_tiers
    WHERE id = new_tier_id;

    -- Update all referrals for this user with new tier
    UPDATE referrals
    SET tier_id = new_tier_id
    WHERE referrer_id = NEW.referrer_id;

    -- If tier increased, add bonus reward
    IF new_tier_level > old_tier_level THEN
      INSERT INTO referral_rewards_history (user_id, reward_type, reward_amount, reward_description)
      VALUES (
        NEW.referrer_id,
        'tier_bonus',
        new_tier_level * 10.0,
        'Tier upgrade bonus to ' || (SELECT tier_name FROM referral_tiers WHERE id = new_tier_id)
      );
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_referral_stats ON referrals;
CREATE TRIGGER trigger_update_referral_stats
  AFTER INSERT OR UPDATE OF status ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION update_referral_stats();

-- 8. Create function to check and award achievements
CREATE OR REPLACE FUNCTION check_achievements(user_id_param UUID)
RETURNS TABLE(achievement_id UUID, achievement_name TEXT, points_reward INTEGER, credits_reward DECIMAL) AS $$
BEGIN
  RETURN QUERY
  WITH referral_counts AS (
    SELECT
      COUNT(*) as total_referrals,
      COUNT(*) FILTER (WHERE status = 'completed') as completed_referrals,
      COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours' AND status = 'completed') as quick_signups
    FROM referrals
    WHERE referrer_id = user_id_param
  )
  INSERT INTO user_achievements (user_id, achievement_id)
  SELECT
    user_id_param,
    a.id
  FROM referral_achievements a
  CROSS JOIN referral_counts rc
  WHERE
    -- Check milestone achievements
    (a.achievement_type = 'milestone' AND rc.completed_referrals >= a.requirement_value)
    -- Check speed achievements
    OR (a.achievement_type = 'speed' AND rc.quick_signups >= a.requirement_value)
    -- Achievement not already earned
    AND NOT EXISTS (
      SELECT 1 FROM user_achievements ua
      WHERE ua.user_id = user_id_param AND ua.achievement_id = a.id
    )
  ON CONFLICT (user_id, achievement_id) DO NOTHING
  RETURNING
    user_achievements.achievement_id,
    (SELECT achievement_name FROM referral_achievements WHERE id = user_achievements.achievement_id),
    (SELECT points_reward FROM referral_achievements WHERE id = user_achievements.achievement_id),
    (SELECT credits_reward FROM referral_achievements WHERE id = user_achievements.achievement_id);
END;
$$ LANGUAGE plpgsql;

-- 9. Create RLS policies

-- referral_tiers
ALTER TABLE referral_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tiers are viewable by everyone" ON referral_tiers FOR SELECT USING (true);

-- referral_achievements
ALTER TABLE referral_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Achievements are viewable by everyone" ON referral_achievements FOR SELECT USING (true);

-- user_achievements
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert achievements" ON user_achievements FOR INSERT WITH CHECK (true);

-- referral_rewards_history
ALTER TABLE referral_rewards_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own reward history" ON referral_rewards_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert rewards" ON referral_rewards_history FOR INSERT WITH CHECK (true);

-- 10. Create leaderboard view
CREATE OR REPLACE VIEW referral_leaderboard AS
SELECT
  p.id,
  p.full_name,
  p.avatar_url,
  COUNT(r.id) FILTER (WHERE r.status = 'completed') as total_referrals,
  rt.tier_name,
  rt.badge_icon,
  rt.badge_color,
  SUM(r.reward_amount) FILTER (WHERE r.status = 'rewarded') as total_rewards,
  COUNT(ua.id) as total_achievements,
  ROW_NUMBER() OVER (ORDER BY COUNT(r.id) FILTER (WHERE r.status = 'completed') DESC) as rank
FROM profiles p
LEFT JOIN referrals r ON r.referrer_id = p.id
LEFT JOIN referral_tiers rt ON r.tier_id = rt.id
LEFT JOIN user_achievements ua ON ua.user_id = p.id
WHERE EXISTS (SELECT 1 FROM referrals WHERE referrer_id = p.id)
GROUP BY p.id, p.full_name, p.avatar_url, rt.tier_name, rt.badge_icon, rt.badge_color
ORDER BY total_referrals DESC;

-- Grant access to leaderboard
GRANT SELECT ON referral_leaderboard TO authenticated;

COMMENT ON TABLE referral_tiers IS 'Defines the tier system for referral rewards';
COMMENT ON TABLE referral_achievements IS 'Defines available achievements users can earn';
COMMENT ON TABLE user_achievements IS 'Tracks which achievements users have earned';
COMMENT ON TABLE referral_rewards_history IS 'Records all rewards given to users';
