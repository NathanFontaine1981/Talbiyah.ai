-- SIMPLEST UPDATE: Just change payment_method to 'credits'
-- Don't touch payment_status to avoid constraint issues

UPDATE lessons
SET payment_method = 'credits'
WHERE
  status = 'booked'
  AND payment_method = 'stripe'
  AND booked_at >= '2025-11-20 13:00:00'
  AND booked_at IS NOT NULL;

-- Show results
SELECT
  '✅ Updated payment_method to credits' as status,
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
