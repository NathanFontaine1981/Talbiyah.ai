-- Create vocabulary_mastery table for tracking word learning progress
-- Uses Leitner system for spaced repetition flashcard learning

CREATE TABLE IF NOT EXISTS vocabulary_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES learners(id) ON DELETE CASCADE,

  -- Word Data
  word_arabic TEXT NOT NULL,
  word_transliteration TEXT,
  word_english TEXT NOT NULL,
  word_type TEXT, -- noun, verb, particle, adjective, etc.

  -- Source Tracking
  source_lesson_id UUID REFERENCES lessons(id),
  source_surah INTEGER CHECK (source_surah >= 1 AND source_surah <= 114),
  source_ayah INTEGER,

  -- Mastery Metrics (Leitner System)
  -- Level 0: New word, review immediately
  -- Level 1: Review next day
  -- Level 2: Review in 3 days
  -- Level 3: Review in 1 week
  -- Level 4: Review in 2 weeks
  -- Level 5: Mastered
  mastery_level INTEGER NOT NULL DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 5),
  correct_streak INTEGER DEFAULT 0,
  total_attempts INTEGER DEFAULT 0,
  total_correct INTEGER DEFAULT 0,

  -- Spaced Repetition
  next_review_at TIMESTAMPTZ DEFAULT NOW(),
  last_reviewed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(learner_id, word_arabic)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vocab_learner ON vocabulary_mastery(learner_id);
CREATE INDEX IF NOT EXISTS idx_vocab_mastery ON vocabulary_mastery(mastery_level);
CREATE INDEX IF NOT EXISTS idx_vocab_review ON vocabulary_mastery(next_review_at);
CREATE INDEX IF NOT EXISTS idx_vocab_lesson ON vocabulary_mastery(source_lesson_id);

-- Comments
COMMENT ON TABLE vocabulary_mastery IS 'Tracks Arabic vocabulary learning progress using Leitner spaced repetition';
COMMENT ON COLUMN vocabulary_mastery.mastery_level IS 'Leitner box level: 0=new, 1-4=learning, 5=mastered';
COMMENT ON COLUMN vocabulary_mastery.correct_streak IS 'Consecutive correct answers (resets on wrong answer)';
COMMENT ON COLUMN vocabulary_mastery.next_review_at IS 'Next scheduled review time based on Leitner schedule';

-- RLS Policies
ALTER TABLE vocabulary_mastery ENABLE ROW LEVEL SECURITY;

-- Learners can manage their own vocabulary
CREATE POLICY "Learners can view own vocabulary" ON vocabulary_mastery
  FOR SELECT
  USING (
    learner_id IN (
      SELECT id FROM learners WHERE parent_id = auth.uid()
    )
  );

CREATE POLICY "Learners can insert own vocabulary" ON vocabulary_mastery
  FOR INSERT
  WITH CHECK (
    learner_id IN (
      SELECT id FROM learners WHERE parent_id = auth.uid()
    )
  );

CREATE POLICY "Learners can update own vocabulary" ON vocabulary_mastery
  FOR UPDATE
  USING (
    learner_id IN (
      SELECT id FROM learners WHERE parent_id = auth.uid()
    )
  );

-- Teachers can view their students' vocabulary progress
CREATE POLICY "Teachers can view student vocabulary" ON vocabulary_mastery
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      WHERE lessons.teacher_id = auth.uid()
      AND lessons.learner_id = vocabulary_mastery.learner_id
    )
  );

-- Function to update mastery level based on answer
CREATE OR REPLACE FUNCTION update_vocabulary_mastery(
  p_vocab_id UUID,
  p_is_correct BOOLEAN
)
RETURNS vocabulary_mastery AS $$
DECLARE
  v_record vocabulary_mastery;
  v_new_level INTEGER;
  v_review_interval INTERVAL;
BEGIN
  SELECT * INTO v_record FROM vocabulary_mastery WHERE id = p_vocab_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Vocabulary record not found';
  END IF;

  IF p_is_correct THEN
    -- Move up one level (max 5)
    v_new_level := LEAST(v_record.mastery_level + 1, 5);
    v_record.correct_streak := v_record.correct_streak + 1;
    v_record.total_correct := v_record.total_correct + 1;
  ELSE
    -- Move back to level 0
    v_new_level := 0;
    v_record.correct_streak := 0;
  END IF;

  v_record.mastery_level := v_new_level;
  v_record.total_attempts := v_record.total_attempts + 1;
  v_record.last_reviewed_at := NOW();

  -- Calculate next review based on Leitner level
  CASE v_new_level
    WHEN 0 THEN v_review_interval := INTERVAL '0 hours'; -- Review immediately (same session)
    WHEN 1 THEN v_review_interval := INTERVAL '1 day';
    WHEN 2 THEN v_review_interval := INTERVAL '3 days';
    WHEN 3 THEN v_review_interval := INTERVAL '1 week';
    WHEN 4 THEN v_review_interval := INTERVAL '2 weeks';
    WHEN 5 THEN v_review_interval := INTERVAL '1 month'; -- Mastered, occasional review
    ELSE v_review_interval := INTERVAL '1 day';
  END CASE;

  v_record.next_review_at := NOW() + v_review_interval;
  v_record.updated_at := NOW();

  UPDATE vocabulary_mastery
  SET
    mastery_level = v_record.mastery_level,
    correct_streak = v_record.correct_streak,
    total_attempts = v_record.total_attempts,
    total_correct = v_record.total_correct,
    next_review_at = v_record.next_review_at,
    last_reviewed_at = v_record.last_reviewed_at,
    updated_at = v_record.updated_at
  WHERE id = p_vocab_id;

  RETURN v_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_vocabulary_mastery_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_vocabulary_mastery_updated_at
  BEFORE UPDATE ON vocabulary_mastery
  FOR EACH ROW
  EXECUTE FUNCTION update_vocabulary_mastery_updated_at();
