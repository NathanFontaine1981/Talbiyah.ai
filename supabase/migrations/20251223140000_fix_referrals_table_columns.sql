-- Fix referrals table to use referred_user_id (profiles/auth.users) instead of referred_id (learners)
-- This migration ensures the referrals table works with the track-referral-rewards function

-- Add referred_user_id column if it doesn't exist
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS referred_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update status column to have default value
ALTER TABLE referrals ALTER COLUMN status SET DEFAULT 'pending';

-- Add the additional columns needed by track-referral-rewards function
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS completed_lessons integer DEFAULT 0;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS total_hours decimal(10,2) DEFAULT 0;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS credits_earned decimal(10,2) DEFAULT 0;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS conversion_paid boolean DEFAULT false;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS last_lesson_date timestamptz;

-- Add unique constraint for referrer_id + referred_user_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'referrals_referrer_referred_user_unique'
  ) THEN
    ALTER TABLE referrals ADD CONSTRAINT referrals_referrer_referred_user_unique
      UNIQUE (referrer_id, referred_user_id);
  END IF;
EXCEPTION WHEN others THEN
  -- Constraint might already exist or there might be duplicates, ignore
  NULL;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);

-- Update RLS policies
DROP POLICY IF EXISTS "Users can create referrals" ON referrals;
DROP POLICY IF EXISTS "Users can read own referral records" ON referrals;

-- Allow authenticated users to insert referrals
CREATE POLICY "Users can create referrals"
  ON referrals FOR INSERT
  TO authenticated
  WITH CHECK (
    referrer_id = auth.uid() OR referred_user_id = auth.uid() OR referred_id::uuid = auth.uid()
  );

-- Allow users to read referrals where they are the referrer or referred
CREATE POLICY "Users can read own referral records"
  ON referrals FOR SELECT
  TO authenticated
  USING (referrer_id = auth.uid() OR referred_user_id = auth.uid() OR referred_id::uuid = auth.uid());

-- Backfill: Create referral records for users who have referred_by set but no referrals record
INSERT INTO referrals (referrer_id, referred_user_id, status, completed_lessons, total_hours, credits_earned, conversion_paid)
SELECT
  p.referred_by as referrer_id,
  p.id as referred_user_id,
  'pending' as status,
  0 as completed_lessons,
  0 as total_hours,
  0 as credits_earned,
  false as conversion_paid
FROM profiles p
WHERE p.referred_by IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM referrals r
    WHERE r.referrer_id = p.referred_by
      AND (r.referred_user_id = p.id OR r.referred_id::text = p.id::text)
  )
ON CONFLICT DO NOTHING;

-- Update referral_credits total_referrals count for all referrers
UPDATE referral_credits rc
SET total_referrals = (
  SELECT COUNT(*)
  FROM referrals r
  WHERE r.referrer_id = rc.user_id
);

-- Create referral_credits for referrers who don't have one
INSERT INTO referral_credits (user_id, total_referrals)
SELECT
  r.referrer_id,
  COUNT(*) as total_referrals
FROM referrals r
WHERE NOT EXISTS (SELECT 1 FROM referral_credits rc WHERE rc.user_id = r.referrer_id)
GROUP BY r.referrer_id
ON CONFLICT (user_id) DO UPDATE SET total_referrals = EXCLUDED.total_referrals;
