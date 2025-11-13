-- Create lesson_recordings table to store video recordings from 100ms
CREATE TABLE IF NOT EXISTS lesson_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,

  -- 100ms recording data
  "100ms_recording_id" TEXT,
  "100ms_room_id" TEXT,
  recording_url TEXT,
  recording_size BIGINT,
  duration_seconds INTEGER,

  -- Storage data
  storage_path TEXT, -- Path in Supabase storage
  download_url TEXT, -- Temporary signed URL for downloads

  -- Transcript data
  transcript_url TEXT,
  transcript_text TEXT,
  has_transcript BOOLEAN DEFAULT false,

  -- Status and metadata
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'available', 'failed', 'expired')),
  expires_at TIMESTAMPTZ, -- 7 days from creation
  deleted_at TIMESTAMPTZ, -- Soft delete

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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
CREATE INDEX idx_lesson_recordings_lesson_id ON lesson_recordings(lesson_id);
CREATE INDEX idx_lesson_recordings_status ON lesson_recordings(status);
CREATE INDEX idx_lesson_recordings_expires_at ON lesson_recordings(expires_at);
CREATE INDEX idx_lesson_insights_lesson_id ON lesson_insights(lesson_id);
CREATE INDEX idx_lesson_insights_learner_id ON lesson_insights(learner_id);
CREATE INDEX idx_lesson_insights_teacher_id ON lesson_insights(teacher_id);
CREATE INDEX idx_lesson_insights_subject_id ON lesson_insights(subject_id);

-- Add RLS policies for lesson_recordings
ALTER TABLE lesson_recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view recordings of their lessons"
ON lesson_recordings
FOR SELECT
TO authenticated
USING (
  lesson_id IN (
    -- Students can see their own lesson recordings
    SELECT id FROM lessons WHERE learner_id IN (
      SELECT id FROM learners WHERE parent_id = auth.uid()
    )
  )
  OR
  lesson_id IN (
    -- Teachers can see recordings of lessons they taught
    SELECT id FROM lessons WHERE teacher_id IN (
      SELECT id FROM teacher_profiles WHERE user_id = auth.uid()
    )
  )
  OR
  -- Admins can see all recordings
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles)
  )
);

CREATE POLICY "System can insert recordings"
ON lesson_recordings
FOR INSERT
TO authenticated
WITH CHECK (true); -- Will be called by webhook/service role

CREATE POLICY "System can update recordings"
ON lesson_recordings
FOR UPDATE
TO authenticated
USING (true); -- Will be updated by webhook/service role

-- Add RLS policies for lesson_insights
ALTER TABLE lesson_insights ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "System can insert insights"
ON lesson_insights
FOR INSERT
TO authenticated
WITH CHECK (true); -- Will be created by background job

CREATE POLICY "System can update insights"
ON lesson_insights
FOR UPDATE
TO authenticated
USING (true); -- Will be updated by background job

-- Function to automatically set expires_at to 7 days from creation
CREATE OR REPLACE FUNCTION set_recording_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := NEW.created_at + INTERVAL '7 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_recording_expiry_trigger
BEFORE INSERT ON lesson_recordings
FOR EACH ROW
EXECUTE FUNCTION set_recording_expiry();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lesson_recordings_updated_at
BEFORE UPDATE ON lesson_recordings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lesson_insights_updated_at
BEFORE UPDATE ON lesson_insights
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add recording fields to lessons table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='lessons' AND column_name='recording_enabled') THEN
    ALTER TABLE lessons ADD COLUMN recording_enabled BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='lessons' AND column_name='recording_started_at') THEN
    ALTER TABLE lessons ADD COLUMN recording_started_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='lessons' AND column_name='recording_stopped_at') THEN
    ALTER TABLE lessons ADD COLUMN recording_stopped_at TIMESTAMPTZ;
  END IF;
END $$;
