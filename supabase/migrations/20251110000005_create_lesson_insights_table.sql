-- Create lesson_insights table for AI-generated insights
CREATE TABLE IF NOT EXISTS lesson_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  recording_id UUID REFERENCES lesson_recordings(id) ON DELETE CASCADE,

  -- Subject and teacher info
  subject_id UUID REFERENCES subjects(id),
  teacher_id UUID REFERENCES teacher_profiles(id),
  learner_id UUID REFERENCES learners(id),

  -- Insight data
  insight_type TEXT DEFAULT 'general' CHECK (insight_type IN ('general', 'subject_specific', 'pronunciation', 'comprehension', 'progress')),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  detailed_insights JSONB, -- Structured insights data

  -- Key metrics
  student_participation_score INTEGER CHECK (student_participation_score >= 0 AND student_participation_score <= 100),
  comprehension_level TEXT CHECK (comprehension_level IN ('beginner', 'intermediate', 'advanced', 'mastery')),
  areas_of_strength TEXT[],
  areas_for_improvement TEXT[],
  recommendations TEXT[],

  -- Transcript analysis
  key_topics TEXT[],
  vocabulary_used TEXT[],
  questions_asked INTEGER DEFAULT 0,
  teacher_feedback TEXT,

  -- AI metadata
  ai_model TEXT, -- e.g., 'gpt-4', 'claude-3'
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  processing_time_ms INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_lesson_insights_lesson_id ON lesson_insights(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_insights_learner_id ON lesson_insights(learner_id);
CREATE INDEX IF NOT EXISTS idx_lesson_insights_teacher_id ON lesson_insights(teacher_id);
CREATE INDEX IF NOT EXISTS idx_lesson_insights_subject_id ON lesson_insights(subject_id);

-- Add RLS policies for lesson_insights
ALTER TABLE lesson_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view insights of their lessons" ON lesson_insights;
CREATE POLICY "Users can view insights of their lessons"
ON lesson_insights
FOR SELECT
TO authenticated
USING (
  learner_id IN (
    -- Students can see their own insights
    SELECT id FROM learners WHERE parent_id = auth.uid()
  )
  OR
  teacher_id IN (
    -- Teachers can see insights of lessons they taught
    SELECT id FROM teacher_profiles WHERE user_id = auth.uid()
  )
  OR
  -- Admins can see all insights
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles)
  )
);

DROP POLICY IF EXISTS "System can insert insights" ON lesson_insights;
CREATE POLICY "System can insert insights"
ON lesson_insights
FOR INSERT
TO authenticated
WITH CHECK (true); -- Will be created by background job

DROP POLICY IF EXISTS "System can update insights" ON lesson_insights;
CREATE POLICY "System can update insights"
ON lesson_insights
FOR UPDATE
TO authenticated
USING (true); -- Will be updated by background job

-- Update trigger for updated_at
DROP TRIGGER IF EXISTS update_lesson_insights_updated_at ON lesson_insights;
CREATE TRIGGER update_lesson_insights_updated_at
BEFORE UPDATE ON lesson_insights
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
