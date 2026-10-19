-- Trigger to update referral status when user verifies email
-- The notification is sent by the notify-referral-signup Edge Function
-- which is called from the frontend after the user first logs in

-- Add notification_sent column to track if referrer was notified
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS notification_sent boolean DEFAULT false;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS email_verified_at timestamptz;

-- Create a function to update referral status on email verification
CREATE OR REPLACE FUNCTION update_referral_on_email_verification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if email_confirmed_at changed from NULL to a value
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    -- Update the referral status to 'active' (email verified)
    UPDATE public.referrals
    SET
      status = 'active',
      email_verified_at = NOW()
    WHERE referred_user_id = NEW.id
      AND status = 'pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users for email verification
DROP TRIGGER IF EXISTS on_email_verified_update_referral ON auth.users;
CREATE TRIGGER on_email_verified_update_referral
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION update_referral_on_email_verification();

-- Create index for faster lookups of pending notifications
CREATE INDEX IF NOT EXISTS idx_referrals_pending_notification
  ON referrals(referrer_id)
  WHERE status = 'active' AND notification_sent = false;
