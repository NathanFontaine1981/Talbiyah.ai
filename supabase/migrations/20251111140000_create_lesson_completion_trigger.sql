-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- LESSON COMPLETION TRIGGER FOR REFERRAL REWARDS
-- Automatically calls track-referral-rewards Edge Function when lesson completes
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Enable http extension if not already enabled
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Create function to trigger referral rewards tracking
CREATE OR REPLACE FUNCTION trigger_referral_rewards()
RETURNS TRIGGER AS $$
DECLARE
  function_url text;
  service_role_key text;
BEGIN
  -- Only process when lesson status changes to completed and is paid
  IF NEW.status = 'completed' AND NEW.payment_status = 'paid'
     AND (OLD.status IS NULL OR OLD.status != 'completed') THEN

    -- Get function URL from environment
    function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/track-referral-rewards';
    service_role_key := current_setting('app.settings.service_role_key', true);

    -- Call Edge Function asynchronously using pg_net
    PERFORM
      net.http_post(
        url := function_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_role_key
        ),
        body := jsonb_build_object(
          'lesson_id', NEW.id,
          'learner_id', NEW.learner_id,
          'duration_minutes', NEW.duration_minutes,
          'status', NEW.status,
          'payment_status', NEW.payment_status
        )
      );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on lessons table
DROP TRIGGER IF EXISTS on_lesson_completed ON lessons;
CREATE TRIGGER on_lesson_completed
  AFTER INSERT OR UPDATE ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION trigger_referral_rewards();

-- Add comment
COMMENT ON FUNCTION trigger_referral_rewards() IS 'Triggers referral reward calculation when a paid lesson is completed';
