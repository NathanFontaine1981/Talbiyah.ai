-- Create surah_retention_tracker table for Daily Maintenance Loop
-- Tracks memorization status and spaced repetition schedule for each surah per learner

CREATE TABLE IF NOT EXISTS surah_retention_tracker (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  surah_number INTEGER NOT NULL CHECK (surah_number >= 1 AND surah_number <= 114),

  -- Memorization Status
  memorization_status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (memorization_status IN ('not_started', 'in_progress', 'memorized', 'needs_review')),
  memorization_completed_at TIMESTAMPTZ,

  -- Spaced Repetition Fields (SM-2 Algorithm)
  next_review_date DATE NOT NULL DEFAULT CURRENT_DATE,
  review_interval_days INTEGER NOT NULL DEFAULT 1,
  ease_factor DECIMAL(3,2) NOT NULL DEFAULT 2.5,
  consecutive_correct INTEGER NOT NULL DEFAULT 0,

  -- Review History
  total_reviews INTEGER NOT NULL DEFAULT 0,
  last_reviewed_at TIMESTAMPTZ,
  last_review_quality INTEGER CHECK (last_review_quality >= 0 AND last_review_quality <= 5),

  -- Retention Metrics
  retention_score DECIMAL(5,2) DEFAULT 100.0,
  days_since_memorized INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(learner_id, surah_number)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_retention_learner ON surah_retention_tracker(learner_id);
CREATE INDEX IF NOT EXISTS idx_retention_next_review ON surah_retention_tracker(learner_id, next_review_date);
CREATE INDEX IF NOT EXISTS idx_retention_status ON surah_retention_tracker(memorization_status);

-- Comments
COMMENT ON TABLE surah_retention_tracker IS 'Tracks Quran surah memorization and spaced repetition for daily maintenance';
COMMENT ON COLUMN surah_retention_tracker.memorization_status IS 'Current memorization state: not_started, in_progress, memorized, needs_review';
COMMENT ON COLUMN surah_retention_tracker.ease_factor IS 'SM-2 algorithm ease factor (default 2.5, min 1.3)';
COMMENT ON COLUMN surah_retention_tracker.next_review_date IS 'Next scheduled review date based on spaced repetition';
COMMENT ON COLUMN surah_retention_tracker.retention_score IS 'Estimated retention percentage (0-100)';
COMMENT ON COLUMN surah_retention_tracker.last_review_quality IS 'Quality rating from last review (0-5, where 5 is perfect recall)';

-- RLS Policies
ALTER TABLE surah_retention_tracker ENABLE ROW LEVEL SECURITY;

-- Learners can view and manage their own retention data
CREATE POLICY "Learners can view own retention data" ON surah_retention_tracker
  FOR SELECT
  USING (
    learner_id IN (
      SELECT id FROM learners WHERE parent_id = auth.uid()
    )
  );

CREATE POLICY "Learners can insert own retention data" ON surah_retention_tracker
  FOR INSERT
  WITH CHECK (
    learner_id IN (
      SELECT id FROM learners WHERE parent_id = auth.uid()
    )
  );

CREATE POLICY "Learners can update own retention data" ON surah_retention_tracker
  FOR UPDATE
  USING (
    learner_id IN (
      SELECT id FROM learners WHERE parent_id = auth.uid()
    )
  );

-- Teachers can view their students' retention data
CREATE POLICY "Teachers can view student retention data" ON surah_retention_tracker
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      WHERE lessons.teacher_id = auth.uid()
      AND lessons.learner_id = surah_retention_tracker.learner_id
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_surah_retention_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_surah_retention_updated_at
  BEFORE UPDATE ON surah_retention_tracker
  FOR EACH ROW
  EXECUTE FUNCTION update_surah_retention_updated_at();
