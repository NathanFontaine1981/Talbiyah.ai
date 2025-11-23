-- DROP the old trigger that's setting wrong defaults
DROP TRIGGER IF EXISTS set_credit_payment_defaults_trigger ON lessons;
DROP FUNCTION IF EXISTS set_credit_payment_defaults();

-- The issue: The edge function creates lessons with status='booked' but NO payment fields
-- The old trigger was setting payment_method='credits' for ALL booked lessons
-- But Stripe lessons also come in as 'booked' status initially

-- Solution: Don't use a trigger. The edge function should set payment fields directly.
-- For now, let's manually update the recent lessons that should be credits

-- Update recent lessons that were booked via credits
-- (They have booked_at timestamps matching when credits were deducted)
UPDATE lessons
SET
  payment_method = 'credits',
  payment_status = 'paid'
WHERE
  status = 'booked'
  AND payment_method = 'stripe'
  AND payment_status = 'pending'
  AND booked_at >= '2025-11-20 13:00:00'  -- Today's credit bookings
  AND booked_at IS NOT NULL;

SELECT
  '✅ Updated lessons to credit payment method' as status,
  COUNT(*) as updated_count
FROM lessons
WHERE
  payment_method = 'credits'
  AND booked_at >= '2025-11-20 13:00:00';
