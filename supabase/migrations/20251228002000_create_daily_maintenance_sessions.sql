-- Create daily_maintenance_sessions table for tracking daily review sessions
-- Each learner can have one session per day

CREATE TABLE IF NOT EXISTS daily_maintenance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Session Content
  surahs_reviewed JSONB NOT NULL DEFAULT '[]',
  -- Format: [{ "surah": 114, "listening_completed": true, "reciting_completed": true, "quality": 4 }]

  -- Task Completion
  tasks_completed INTEGER NOT NULL DEFAULT 0,
  total_tasks INTEGER NOT NULL DEFAULT 0,

  -- Completion Status
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed', 'partial')),
  completed_at TIMESTAMPTZ,

  -- Streak Tracking
  is_streak_day BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(learner_id, session_date)
);

-- Index for daily lookup
CREATE INDEX IF NOT EXISTS idx_maintenance_learner_date ON daily_maintenance_sessions(learner_id, session_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON daily_maintenance_sessions(status);

-- Comments
COMMENT ON TABLE daily_maintenance_sessions IS 'Tracks daily Quran maintenance/review sessions per learner';
COMMENT ON COLUMN daily_maintenance_sessions.surahs_reviewed IS 'JSON array of surahs reviewed with completion status and quality rating';
COMMENT ON COLUMN daily_maintenance_sessions.status IS 'Session status: in_progress, completed, or partial';
COMMENT ON COLUMN daily_maintenance_sessions.is_streak_day IS 'Whether this session counts toward the streak';

-- RLS Policies
ALTER TABLE daily_maintenance_sessions ENABLE ROW LEVEL SECURITY;

-- Learners can view and manage their own sessions
CREATE POLICY "Learners can view own sessions" ON daily_maintenance_sessions
  FOR SELECT
  USING (
    learner_id IN (
      SELECT id FROM learners WHERE parent_id = auth.uid()
    )
  );

CREATE POLICY "Learners can insert own sessions" ON daily_maintenance_sessions
  FOR INSERT
  WITH CHECK (
    learner_id IN (
      SELECT id FROM learners WHERE parent_id = auth.uid()
    )
  );

CREATE POLICY "Learners can update own sessions" ON daily_maintenance_sessions
  FOR UPDATE
  USING (
    learner_id IN (
      SELECT id FROM learners WHERE parent_id = auth.uid()
    )
  );

-- Teachers can view their students' sessions
CREATE POLICY "Teachers can view student sessions" ON daily_maintenance_sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      WHERE lessons.teacher_id = auth.uid()
      AND lessons.learner_id = daily_maintenance_sessions.learner_id
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_maintenance_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_maintenance_session_updated_at
  BEFORE UPDATE ON daily_maintenance_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_maintenance_session_updated_at();
