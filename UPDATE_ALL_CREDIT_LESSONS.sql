-- Update ALL recent lessons that were booked via credit payments
-- These have booked_at set but payment_method is still 'stripe'
-- Note: payment_status constraint might only allow specific values

UPDATE lessons
SET
  payment_method = 'credits',
  payment_status = 'completed'  -- Changed from 'paid' to 'completed'
WHERE
  status = 'booked'
  AND payment_method = 'stripe'
  AND payment_status = 'pending'
  AND booked_at >= '2025-11-20 13:00:00'  -- All of today's bookings
  AND booked_at IS NOT NULL;

-- Show results
SELECT
  '✅ Updated credit lessons' as status,
  COUNT(*) as lessons_updated
FROM lessons
WHERE
  payment_method = 'credits'
  AND booked_at >= '2025-11-20 13:00:00';

-- Show the updated lessons
SELECT
  id,
  learner_id,
  scheduled_time,
  payment_method,
  payment_status,
  duration_minutes,
  booked_at
FROM lessons
WHERE
  payment_method = 'credits'
  AND booked_at >= '2025-11-20 13:00:00'
ORDER BY created_at DESC
LIMIT 10;
