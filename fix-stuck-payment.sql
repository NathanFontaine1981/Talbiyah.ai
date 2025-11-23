-- MANUAL FIX FOR STUCK PAYMENT
-- Session ID: cs_live_b14LhJXonM0tZ00k0FMy7aVwlXGBTF4VBOQT1XTIEcybh3VShhv6IXcUgE
-- User ID: 46b4ace6-a4da-46b9-aa10-d01c1beefba0

-- Step 1: Find the pending lesson that was created
SELECT
  id,
  scheduled_time,
  duration,
  payment_amount,
  payment_status,
  status,
  stripe_checkout_session_id,
  created_at
FROM lessons
WHERE student_id = '46b4ace6-a4da-46b9-aa10-d01c1beefba0'
  AND payment_status = 'pending'
ORDER BY created_at DESC
LIMIT 5;

-- Step 2: Update the lesson to mark it as paid
-- (Replace <LESSON_ID> with the ID from step 1)
UPDATE lessons
SET
  payment_status = 'completed',
  status = 'scheduled',
  stripe_payment_intent_id = 'pi_FROM_STRIPE_DASHBOARD',  -- Get this from Stripe
  paid_at = NOW()
WHERE id = '<LESSON_ID>';

-- Step 3: Verify the update worked
SELECT
  id,
  scheduled_time,
  payment_status,
  status,
  paid_at
FROM lessons
WHERE id = '<LESSON_ID>';

-- Step 4: Create HMS room if not exists
-- You may need to create the room_code manually or trigger the room creation

-- Alternative: If NO lesson exists at all (only pending_booking)
-- Check pending bookings:
SELECT *
FROM pending_bookings
WHERE user_id = '46b4ace6-a4da-46b9-aa10-d01c1beefba0'
ORDER BY created_at DESC
LIMIT 3;

-- If you see a pending_booking but NO lesson, you need to create the lesson manually
-- based on the pending_booking data
