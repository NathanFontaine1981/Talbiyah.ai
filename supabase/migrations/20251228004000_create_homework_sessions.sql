-- Create homework_sessions table for Smart Homework Engine
-- Tracks adaptive homework game sessions with progress and scoring

CREATE TABLE IF NOT EXISTS homework_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id),

  -- Session Configuration
  session_type TEXT NOT NULL DEFAULT 'adaptive'
    CHECK (session_type IN ('adaptive', 'lesson_review', 'weak_areas', 'custom')),
  difficulty_level TEXT NOT NULL DEFAULT 'auto'
    CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'auto')),

  -- Game Content
  games JSONB NOT NULL DEFAULT '[]',
  -- Format: [{ "type": "flashcard", "config": {...}, "questions": [...], "results": {...} }]

  -- Progress
  current_game_index INTEGER DEFAULT 0,
  games_completed INTEGER DEFAULT 0,
  total_games INTEGER DEFAULT 0,

  -- Scoring
  total_score INTEGER DEFAULT 0,
  max_possible_score INTEGER DEFAULT 0,
  accuracy_percentage DECIMAL(5,2),

  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  time_spent_seconds INTEGER DEFAULT 0,

  -- Analysis
  weak_areas_targeted JSONB DEFAULT '[]',
  improvement_metrics JSONB DEFAULT '{}',
  external_practice_tips JSONB DEFAULT '[]',
  -- Format: [{ "category": "Pronunciation", "appName": "Tarteel", "appUrl": "...", "task": "..." }]

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'abandoned')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_homework_learner ON homework_sessions(learner_id);
CREATE INDEX IF NOT EXISTS idx_homework_lesson ON homework_sessions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_homework_status ON homework_sessions(status);
CREATE INDEX IF NOT EXISTS idx_homework_created ON homework_sessions(created_at DESC);

-- Comments
COMMENT ON TABLE homework_sessions IS 'Tracks Smart Homework Engine sessions with mini-games and scoring';
COMMENT ON COLUMN homework_sessions.session_type IS 'Type: adaptive (AI-generated), lesson_review, weak_areas, or custom (teacher-assigned)';
COMMENT ON COLUMN homework_sessions.games IS 'JSON array of game configurations, questions, and results';
COMMENT ON COLUMN homework_sessions.weak_areas_targeted IS 'Knowledge gap IDs that this session targets';
COMMENT ON COLUMN homework_sessions.external_practice_tips IS 'Recommendations for external apps (Tarteel, Quran.com, etc.)';

-- RLS Policies
ALTER TABLE homework_sessions ENABLE ROW LEVEL SECURITY;

-- Learners can view and manage their own homework
CREATE POLICY "Learners can view own homework" ON homework_sessions
  FOR SELECT
  USING (
    learner_id IN (
      SELECT id FROM learners WHERE parent_id = auth.uid()
    )
  );

CREATE POLICY "Learners can insert own homework" ON homework_sessions
  FOR INSERT
  WITH CHECK (
    learner_id IN (
      SELECT id FROM learners WHERE parent_id = auth.uid()
    )
  );

CREATE POLICY "Learners can update own homework" ON homework_sessions
  FOR UPDATE
  USING (
    learner_id IN (
      SELECT id FROM learners WHERE parent_id = auth.uid()
    )
  );

-- Teachers can view and assign homework to their students
CREATE POLICY "Teachers can view student homework" ON homework_sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      WHERE lessons.teacher_id = auth.uid()
      AND lessons.learner_id = homework_sessions.learner_id
    )
  );

CREATE POLICY "Teachers can insert homework for students" ON homework_sessions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lessons
      WHERE lessons.teacher_id = auth.uid()
      AND lessons.learner_id = homework_sessions.learner_id
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_homework_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_homework_session_updated_at
  BEFORE UPDATE ON homework_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_homework_session_updated_at();
