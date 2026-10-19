-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- FIX TEACHER EARNINGS TRIGGER
-- The teacher_rate_at_booking field contains the TOTAL lesson price,
-- not the hourly rate. Fix the trigger to use it directly.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Drop and recreate the trigger function with correct logic
CREATE OR REPLACE FUNCTION create_teacher_earning_on_lesson_complete()
RETURNS TRIGGER AS $$
DECLARE
  v_lesson_price numeric;
  v_platform_fee numeric;
  v_amount_earned numeric;
BEGIN
  -- Only create earning if lesson status changed to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN

    -- teacher_rate_at_booking is the TOTAL lesson price (not hourly rate)
    v_lesson_price := COALESCE(NEW.teacher_rate_at_booking, 0);
    v_platform_fee := COALESCE(NEW.platform_fee, 0);

    -- Teacher earns the lesson price minus platform fee
    -- For now, platform fee is 0, so teacher gets full amount
    v_amount_earned := v_lesson_price - v_platform_fee;

    -- Insert earning record (if not already exists)
    INSERT INTO teacher_earnings (
      lesson_id,
      teacher_id,
      amount_earned,
      platform_fee,
      total_lesson_cost,
      currency,
      status,
      lesson_completed_at,
      hold_period_days,
      cleared_at
    ) VALUES (
      NEW.id,
      NEW.teacher_id,
      v_amount_earned,
      v_platform_fee,
      COALESCE(NEW.total_cost_paid, v_lesson_price),
      COALESCE(NEW.payment_currency, 'gbp'),
      'held', -- Start in 'held' status
      NOW(),
      7, -- 7 day hold period
      NOW() + INTERVAL '7 days' -- Auto-calculate clearing date
    )
    ON CONFLICT (lesson_id) DO UPDATE SET
      amount_earned = EXCLUDED.amount_earned,
      platform_fee = EXCLUDED.platform_fee,
      total_lesson_cost = EXCLUDED.total_lesson_cost,
      lesson_completed_at = EXCLUDED.lesson_completed_at,
      updated_at = NOW();

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS trigger_create_earning_on_lesson_complete ON lessons;
CREATE TRIGGER trigger_create_earning_on_lesson_complete
  AFTER UPDATE ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION create_teacher_earning_on_lesson_complete();

COMMENT ON FUNCTION create_teacher_earning_on_lesson_complete IS 'Auto-creates/updates teacher earning record when lesson is marked complete. Uses teacher_rate_at_booking as total lesson price.';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- BACKFILL: Create earnings for completed lessons that don't have them
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSERT INTO teacher_earnings (
  lesson_id,
  teacher_id,
  amount_earned,
  platform_fee,
  total_lesson_cost,
  currency,
  status,
  lesson_completed_at,
  hold_period_days,
  cleared_at
)
SELECT
  l.id,
  l.teacher_id,
  COALESCE(l.teacher_rate_at_booking, 0) - COALESCE(l.platform_fee, 0),
  COALESCE(l.platform_fee, 0),
  COALESCE(l.total_cost_paid, l.teacher_rate_at_booking, 0),
  COALESCE(l.payment_currency, 'gbp'),
  CASE
    WHEN l.scheduled_time < NOW() - INTERVAL '7 days' THEN 'cleared'
    ELSE 'held'
  END,
  COALESCE(l.scheduled_time, NOW()),
  7,
  l.scheduled_time + INTERVAL '7 days'
FROM lessons l
WHERE l.status = 'completed'
AND l.teacher_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM teacher_earnings te WHERE te.lesson_id = l.id
)
ON CONFLICT (lesson_id) DO NOTHING;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- MIGRATION COMPLETE
-- ✅ Fixed trigger to use teacher_rate_at_booking as total price
-- ✅ Changed to UPSERT to handle re-runs
-- ✅ Backfilled earnings for existing completed lessons
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
