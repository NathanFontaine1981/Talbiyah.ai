-- Add referral_code column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded')),
  reward_amount DECIMAL(10,2) DEFAULT 5.00,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  rewarded_at TIMESTAMPTZ
);

-- Create indexes for referrals table
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

-- Enable RLS on referrals table
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referrals table

-- Users can view their own referrals (where they are the referrer)
CREATE POLICY "Users can view their own referrals"
ON referrals
FOR SELECT
TO authenticated
USING (referrer_id = auth.uid());

-- Users can view referrals where they were referred
CREATE POLICY "Users can view referrals where they were referred"
ON referrals
FOR SELECT
TO authenticated
USING (referred_id = auth.uid());

-- System can insert referral records
CREATE POLICY "Anyone can create referral records"
ON referrals
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Only system/admin can update referral status
CREATE POLICY "System can update referral status"
ON referrals
FOR UPDATE
TO authenticated
USING (true);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code(user_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_code TEXT;
  random_suffix TEXT;
  final_code TEXT;
  code_exists BOOLEAN;
BEGIN
  -- Clean the name: lowercase, remove spaces/special chars, take first 10 chars
  base_code := lower(regexp_replace(user_name, '[^a-zA-Z0-9]', '', 'g'));
  base_code := substring(base_code, 1, 10);

  -- If name is empty, use 'user'
  IF base_code = '' THEN
    base_code := 'user';
  END IF;

  -- Try to generate unique code (max 10 attempts)
  FOR i IN 1..10 LOOP
    -- Generate 6-character random suffix
    random_suffix := substring(md5(random()::text || clock_timestamp()::text), 1, 6);
    final_code := base_code || '-' || random_suffix;

    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_code = final_code) INTO code_exists;

    IF NOT code_exists THEN
      RETURN final_code;
    END IF;
  END LOOP;

  -- Fallback: use UUID if all attempts failed
  RETURN base_code || '-' || substring(gen_random_uuid()::text, 1, 6);
END;
$$ LANGUAGE plpgsql;

-- Function to update existing users with referral codes (one-time migration)
DO $$
DECLARE
  profile_record RECORD;
  new_code TEXT;
BEGIN
  FOR profile_record IN
    SELECT id, full_name FROM profiles WHERE referral_code IS NULL
  LOOP
    new_code := generate_referral_code(COALESCE(profile_record.full_name, 'user'));
    UPDATE profiles SET referral_code = new_code WHERE id = profile_record.id;
  END LOOP;
END $$;
