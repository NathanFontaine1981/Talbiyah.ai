-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ADD 'MISSED' STATUS TO LESSONS TABLE
-- This status represents student no-shows
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Add CHECK constraint to allow 'missed' status
-- Current valid statuses: booked, completed, cancelled_by_teacher, cancelled_by_student
-- New status: missed (student no-show)

DO $$
BEGIN
  -- Drop the existing constraint if it exists (from older migrations)
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'lessons' AND constraint_name LIKE '%status%'
  ) THEN
    ALTER TABLE lessons DROP CONSTRAINT IF EXISTS lessons_status_check;
  END IF;

  -- Add new constraint with 'missed' status included
  ALTER TABLE lessons ADD CONSTRAINT lessons_status_check
    CHECK (status IN ('booked', 'completed', 'cancelled_by_teacher', 'cancelled_by_student', 'missed'));
END $$;

-- Add comment explaining the status values
COMMENT ON COLUMN lessons.status IS 'Lesson status:
  - booked: Scheduled and confirmed
  - completed: Lesson successfully completed (COUNTS toward referral rewards)
  - cancelled_by_teacher: Teacher cancelled
  - cancelled_by_student: Student cancelled
  - missed: Student no-show (credit consumed but NO referral reward)';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- REFERRAL REWARD POLICY
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- IMPORTANT: Only lessons with status = 'completed' count toward referral rewards
-- This is enforced by the trigger_referral_rewards() function which checks:
--   IF NEW.status = 'completed' AND NEW.payment_status = 'paid'
--
-- Lessons with status = 'missed' do NOT trigger referral rewards because:
-- 1. The referral system rewards "hours learned", not "hours paid for"
-- 2. Missed lessons = no learning occurred
-- 3. This encourages quality referrals (engaged students who actually attend)
--
-- Credit consumption policy (separate from referrals):
-- - completed: Credit consumed ✓
-- - missed: Credit consumed ✓ (no-show policy)
-- - cancelled_by_teacher: Credit refunded
-- - cancelled_by_student: Credit refunded (based on cancellation policy)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
