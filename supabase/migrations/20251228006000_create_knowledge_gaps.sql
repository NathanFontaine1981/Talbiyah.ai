-- Create knowledge_gaps table for tracking learning weaknesses
-- Used by Smart Homework Engine to generate targeted practice

CREATE TABLE IF NOT EXISTS knowledge_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES learners(id) ON DELETE CASCADE,

  -- Gap Classification
  category TEXT NOT NULL CHECK (category IN (
    'vocabulary', 'grammar', 'comprehension',
    'tajweed', 'memorization', 'translation'
  )),
  subcategory TEXT, -- e.g., "verb_conjugation", "case_endings", "letter_pronunciation"

  -- Severity
  severity TEXT NOT NULL DEFAULT 'moderate'
    CHECK (severity IN ('minor', 'moderate', 'major')),
  confidence_score DECIMAL(5,2) DEFAULT 50.0,
  -- How confident we are that this is a real gap (0-100)

  -- Evidence
  source_type TEXT NOT NULL CHECK (source_type IN (
    'lesson_quiz', 'homework', 'diagnostic', 'teacher_note', 'ai_analysis'
  )),
  source_id UUID, -- Reference to lesson_insights, homework_submissions, etc.
  evidence JSONB DEFAULT '{}',
  -- Format varies by source_type:
  -- lesson_quiz: { "question": {...}, "wrong_answer": "...", "correct_answer": "..." }
  -- ai_analysis: { "area": "...", "details": "..." }
  -- teacher_note: { "note": "...", "created_by": "..." }

  -- Status
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'improving', 'resolved')),
  first_identified_at TIMESTAMPTZ DEFAULT NOW(),
  last_assessed_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,

  -- Targeting & Progress
  times_targeted INTEGER DEFAULT 0,
  improvement_rate DECIMAL(5,2),
  -- Calculated as: (initial_score - current_score) / initial_score * 100

  -- External Practice Recommendations
  external_practice_tips JSONB DEFAULT '[]',
  -- Format: [{ "app": "Tarteel", "task": "Practice these sounds: ض، ظ", "url": "..." }]

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gaps_learner ON knowledge_gaps(learner_id);
CREATE INDEX IF NOT EXISTS idx_gaps_category ON knowledge_gaps(category);
CREATE INDEX IF NOT EXISTS idx_gaps_status ON knowledge_gaps(status, severity);
CREATE INDEX IF NOT EXISTS idx_gaps_source ON knowledge_gaps(source_type, source_id);

-- Comments
COMMENT ON TABLE knowledge_gaps IS 'Tracks identified learning weaknesses for adaptive homework generation';
COMMENT ON COLUMN knowledge_gaps.category IS 'Type of knowledge gap: vocabulary, grammar, comprehension, tajweed, memorization, translation';
COMMENT ON COLUMN knowledge_gaps.severity IS 'Gap severity: minor (needs practice), moderate (significant weakness), major (blocking progress)';
COMMENT ON COLUMN knowledge_gaps.confidence_score IS 'How confident we are this is a real gap (0-100), based on evidence strength';
COMMENT ON COLUMN knowledge_gaps.times_targeted IS 'Number of homework sessions that have targeted this gap';
COMMENT ON COLUMN knowledge_gaps.external_practice_tips IS 'Recommendations for external apps like Tarteel, Quran.com';

-- RLS Policies
ALTER TABLE knowledge_gaps ENABLE ROW LEVEL SECURITY;

-- Learners can view their own gaps
CREATE POLICY "Learners can view own gaps" ON knowledge_gaps
  FOR SELECT
  USING (
    learner_id IN (
      SELECT id FROM learners WHERE parent_id = auth.uid()
    )
  );

-- System can insert gaps (via functions)
CREATE POLICY "System can insert gaps" ON knowledge_gaps
  FOR INSERT
  WITH CHECK (
    learner_id IN (
      SELECT id FROM learners WHERE parent_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM lessons
      WHERE lessons.teacher_id = auth.uid()
      AND lessons.learner_id = knowledge_gaps.learner_id
    )
  );

-- System can update gaps
CREATE POLICY "System can update gaps" ON knowledge_gaps
  FOR UPDATE
  USING (
    learner_id IN (
      SELECT id FROM learners WHERE parent_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM lessons
      WHERE lessons.teacher_id = auth.uid()
      AND lessons.learner_id = knowledge_gaps.learner_id
    )
  );

-- Teachers can view and add gaps for their students
CREATE POLICY "Teachers can view student gaps" ON knowledge_gaps
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      WHERE lessons.teacher_id = auth.uid()
      AND lessons.learner_id = knowledge_gaps.learner_id
    )
  );

-- Function to analyze quiz results and create gaps
CREATE OR REPLACE FUNCTION analyze_quiz_for_gaps(
  p_learner_id UUID,
  p_lesson_insight_id UUID,
  p_quiz_results JSONB
)
RETURNS SETOF knowledge_gaps AS $$
DECLARE
  v_result RECORD;
  v_gap knowledge_gaps;
  v_category TEXT;
  v_severity TEXT;
BEGIN
  -- Loop through quiz results looking for incorrect answers
  FOR v_result IN SELECT * FROM jsonb_array_elements(p_quiz_results)
  LOOP
    -- Only process incorrect answers
    IF NOT (v_result.value->>'correct')::BOOLEAN THEN
      -- Determine category based on question type
      v_category := COALESCE(v_result.value->>'category', 'vocabulary');

      -- Determine severity based on question difficulty
      IF (v_result.value->>'difficulty')::TEXT = 'easy' THEN
        v_severity := 'major';
      ELSIF (v_result.value->>'difficulty')::TEXT = 'hard' THEN
        v_severity := 'minor';
      ELSE
        v_severity := 'moderate';
      END IF;

      -- Check if gap already exists
      SELECT * INTO v_gap FROM knowledge_gaps
      WHERE learner_id = p_learner_id
      AND category = v_category
      AND source_id = p_lesson_insight_id
      AND status = 'active'
      LIMIT 1;

      IF NOT FOUND THEN
        -- Create new gap
        INSERT INTO knowledge_gaps (
          learner_id,
          category,
          subcategory,
          severity,
          confidence_score,
          source_type,
          source_id,
          evidence
        ) VALUES (
          p_learner_id,
          v_category,
          v_result.value->>'topic',
          v_severity,
          70.0, -- Initial confidence
          'lesson_quiz',
          p_lesson_insight_id,
          jsonb_build_object(
            'question', v_result.value,
            'wrong_answer', v_result.value->'selected_answer',
            'correct_answer', v_result.value->'correct_answer'
          )
        )
        RETURNING * INTO v_gap;
      ELSE
        -- Update existing gap with more evidence
        UPDATE knowledge_gaps
        SET
          confidence_score = LEAST(confidence_score + 10, 100),
          evidence = evidence || jsonb_build_object('additional_evidence', v_result.value),
          last_assessed_at = NOW(),
          updated_at = NOW()
        WHERE id = v_gap.id
        RETURNING * INTO v_gap;
      END IF;

      RETURN NEXT v_gap;
    END IF;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_knowledge_gaps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_knowledge_gaps_updated_at
  BEFORE UPDATE ON knowledge_gaps
  FOR EACH ROW
  EXECUTE FUNCTION update_knowledge_gaps_updated_at();
