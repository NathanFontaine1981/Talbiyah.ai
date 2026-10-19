-- Add streak tracking fields to learners table for Daily Maintenance Loop

ALTER TABLE learners
ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_maintenance_date DATE,
ADD COLUMN IF NOT EXISTS total_maintenance_sessions INTEGER DEFAULT 0;

-- Comments
COMMENT ON COLUMN learners.current_streak IS 'Current consecutive days of completed maintenance sessions';
COMMENT ON COLUMN learners.longest_streak IS 'Longest streak ever achieved';
COMMENT ON COLUMN learners.last_maintenance_date IS 'Date of last completed maintenance session';
COMMENT ON COLUMN learners.total_maintenance_sessions IS 'Total number of completed maintenance sessions';

-- Function to update streak when a maintenance session is completed
CREATE OR REPLACE FUNCTION update_learner_streak()
RETURNS TRIGGER AS $$
DECLARE
  v_learner_id UUID;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_last_date DATE;
  v_today DATE;
BEGIN
  -- Only process when session becomes 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    v_learner_id := NEW.learner_id;
    v_today := CURRENT_DATE;

    -- Get current learner streak data
    SELECT current_streak, longest_streak, last_maintenance_date
    INTO v_current_streak, v_longest_streak, v_last_date
    FROM learners
    WHERE id = v_learner_id;

    -- Calculate new streak
    IF v_last_date IS NULL THEN
      -- First ever session
      v_current_streak := 1;
    ELSIF v_last_date = v_today - INTERVAL '1 day' THEN
      -- Consecutive day
      v_current_streak := COALESCE(v_current_streak, 0) + 1;
    ELSIF v_last_date = v_today THEN
      -- Same day, don't increment
      NULL;
    ELSE
      -- Streak broken
      v_current_streak := 1;
    END IF;

    -- Update longest streak if current is higher
    IF v_current_streak > COALESCE(v_longest_streak, 0) THEN
      v_longest_streak := v_current_streak;
    END IF;

    -- Update learner record
    UPDATE learners
    SET
      current_streak = v_current_streak,
      longest_streak = v_longest_streak,
      last_maintenance_date = v_today,
      total_maintenance_sessions = COALESCE(total_maintenance_sessions, 0) + 1
    WHERE id = v_learner_id;

    -- Mark this session as a streak day
    NEW.is_streak_day := TRUE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on daily_maintenance_sessions
DROP TRIGGER IF EXISTS trigger_update_streak ON daily_maintenance_sessions;
CREATE TRIGGER trigger_update_streak
  BEFORE UPDATE ON daily_maintenance_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_learner_streak();

-- Also trigger on insert if status is already completed
CREATE OR REPLACE FUNCTION update_learner_streak_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    PERFORM update_learner_streak();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
