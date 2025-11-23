-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ADD CANCELLATION TRACKING AND TEACHER COMPENSATION
-- Implements late cancellation policy (30 minutes before lesson)
-- Ensures teachers get paid for late cancellations and no-shows
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Add cancellation tracking fields to lessons table
ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS is_late_cancellation BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS teacher_compensated BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS compensation_amount DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS compensation_paid_at TIMESTAMP WITH TIME ZONE;

-- Add comments for clarity
COMMENT ON COLUMN lessons.cancelled_at IS 'Timestamp when lesson was cancelled';
COMMENT ON COLUMN lessons.is_late_cancellation IS 'True if cancelled within 30 minutes of scheduled_time';
COMMENT ON COLUMN lessons.teacher_compensated IS 'True if teacher was paid for late cancellation or no-show';
COMMENT ON COLUMN lessons.compensation_amount IS 'Amount paid to teacher for late cancellation/no-show';
COMMENT ON COLUMN lessons.compensation_paid_at IS 'Timestamp when teacher compensation was processed';

-- Function to check if a cancellation is within 30 minutes of lesson start
CREATE OR REPLACE FUNCTION check_late_cancellation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check if status changed to cancelled
  IF NEW.status IN ('cancelled_by_student', 'cancelled_by_teacher')
     AND OLD.status != NEW.status THEN

    -- Set cancelled_at timestamp
    NEW.cancelled_at = NOW();

    -- Check if cancellation is within 30 minutes of scheduled time
    -- (scheduled_time - 30 minutes) <= NOW() means it's a late cancellation
    IF (NEW.scheduled_time - INTERVAL '30 minutes') <= NOW() THEN
      NEW.is_late_cancellation = TRUE;

      -- If cancelled by student within 30 minutes, teacher should be compensated
      IF NEW.status = 'cancelled_by_student' THEN
        NEW.teacher_compensated = FALSE; -- Will be set to TRUE after payment processing
        -- compensation_amount will be set by the payment processing logic
      END IF;
    ELSE
      NEW.is_late_cancellation = FALSE;
    END IF;
  END IF;

  -- For no-shows (missed status), teacher should always be compensated
  IF NEW.status = 'missed' AND OLD.status != NEW.status THEN
    NEW.teacher_compensated = FALSE; -- Will be set to TRUE after payment processing
    -- compensation_amount will be set by the payment processing logic
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-detect late cancellations
DROP TRIGGER IF EXISTS trigger_check_late_cancellation ON lessons;
CREATE TRIGGER trigger_check_late_cancellation
  BEFORE UPDATE ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION check_late_cancellation();

-- Function to get lessons requiring teacher compensation
-- (late cancellations and no-shows that haven't been compensated yet)
CREATE OR REPLACE FUNCTION get_lessons_requiring_teacher_compensation()
RETURNS TABLE (
  lesson_id UUID,
  teacher_id UUID,
  student_id UUID,
  scheduled_time TIMESTAMP WITH TIME ZONE,
  status TEXT,
  is_late_cancellation BOOLEAN,
  lesson_price DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id AS lesson_id,
    l.teacher_id,
    l.learner_id AS student_id,
    l.scheduled_time,
    l.status,
    l.is_late_cancellation,
    l.price AS lesson_price
  FROM lessons l
  WHERE
    l.teacher_compensated = FALSE
    AND (
      -- Late cancellation by student (within 30 minutes)
      (l.status = 'cancelled_by_student' AND l.is_late_cancellation = TRUE)
      OR
      -- No-show (missed)
      l.status = 'missed'
    )
  ORDER BY l.scheduled_time DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark teacher as compensated
CREATE OR REPLACE FUNCTION mark_teacher_compensated(
  p_lesson_id UUID,
  p_compensation_amount DECIMAL(10,2)
)
RETURNS VOID AS $$
BEGIN
  UPDATE lessons
  SET
    teacher_compensated = TRUE,
    compensation_amount = p_compensation_amount,
    compensation_paid_at = NOW()
  WHERE id = p_lesson_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Index for querying lessons requiring compensation
CREATE INDEX IF NOT EXISTS idx_lessons_teacher_compensation
  ON lessons(teacher_compensated, status)
  WHERE teacher_compensated = FALSE
    AND status IN ('cancelled_by_student', 'missed');

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- MIGRATION COMPLETE
-- ✅ Added cancellation tracking fields to lessons table
-- ✅ Created function to detect late cancellations (within 30 minutes)
-- ✅ Created trigger to auto-set late cancellation flag
-- ✅ Created function to get lessons requiring teacher compensation
-- ✅ Created function to mark teacher as compensated
-- ✅ Added indexes for performance
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
