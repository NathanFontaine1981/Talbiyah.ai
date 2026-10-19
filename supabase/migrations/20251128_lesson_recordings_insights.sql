-- Create lesson_recordings table to store 100ms recording info
CREATE TABLE IF NOT EXISTS lesson_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  room_id TEXT NOT NULL,
  recording_url TEXT,
  recording_path TEXT,
  recording_size BIGINT,
  duration_seconds INTEGER,
  status TEXT DEFAULT 'processing',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lesson_id)
);

-- Create lesson_insights table to store AI-generated insights
CREATE TABLE IF NOT EXISTS lesson_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL,
  learner_id UUID NOT NULL,
  subject_name TEXT,
  summary TEXT,
  key_topics JSONB DEFAULT '[]',
  student_progress JSONB DEFAULT '{}',
  areas_of_strength JSONB DEFAULT '[]',
  areas_for_improvement JSONB DEFAULT '[]',
  homework_suggestions JSONB DEFAULT '[]',
  next_lesson_recommendations TEXT,
  teacher_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lesson_id)
);

-- Enable RLS
ALTER TABLE lesson_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_insights ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own lesson recordings
DROP POLICY IF EXISTS "Users can view their lesson recordings" ON lesson_recordings;
CREATE POLICY "Users can view their lesson recordings" ON lesson_recordings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lessons l
      JOIN teacher_profiles tp ON l.teacher_id = tp.id
      WHERE l.id = lesson_recordings.lesson_id
      AND (tp.user_id = auth.uid() OR l.learner_id IN (
        SELECT id FROM learners WHERE parent_id = auth.uid()
      ))
    )
  );

-- Policy: Users can view their own lesson insights
DROP POLICY IF EXISTS "Users can view their lesson insights" ON lesson_insights;
CREATE POLICY "Users can view their lesson insights" ON lesson_insights
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lessons l
      JOIN teacher_profiles tp ON l.teacher_id = tp.id
      WHERE l.id = lesson_insights.lesson_id
      AND (tp.user_id = auth.uid() OR l.learner_id IN (
        SELECT id FROM learners WHERE parent_id = auth.uid()
      ))
    )
  );

-- Policy: Service role can insert recordings
DROP POLICY IF EXISTS "Service can insert recordings" ON lesson_recordings;
CREATE POLICY "Service can insert recordings" ON lesson_recordings
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Service can update recordings" ON lesson_recordings;
CREATE POLICY "Service can update recordings" ON lesson_recordings
  FOR UPDATE USING (true);

-- Policy: Service role can insert insights
DROP POLICY IF EXISTS "Service can insert insights" ON lesson_insights;
CREATE POLICY "Service can insert insights" ON lesson_insights
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Service can update insights" ON lesson_insights;
CREATE POLICY "Service can update insights" ON lesson_insights
  FOR UPDATE USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_lesson_recordings_lesson_id ON lesson_recordings(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_recordings_expires_at ON lesson_recordings(expires_at);
CREATE INDEX IF NOT EXISTS idx_lesson_insights_lesson_id ON lesson_insights(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_insights_teacher_id ON lesson_insights(teacher_id);
CREATE INDEX IF NOT EXISTS idx_lesson_insights_learner_id ON lesson_insights(learner_id);
