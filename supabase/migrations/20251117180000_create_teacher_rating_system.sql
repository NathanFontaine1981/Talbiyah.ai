-- Teacher Rating System Migration
-- Creates a hybrid rating system combining quick feedback, detailed ratings, and behavioral metrics

-- Quick feedback after each lesson
CREATE TABLE IF NOT EXISTS lesson_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
  student_id UUID NOT NULL,
  teacher_id UUID REFERENCES teacher_profiles(id) ON DELETE CASCADE NOT NULL,

  -- Quick binary feedback
  thumbs_up BOOLEAN NOT NULL,

  -- If thumbs down, capture reason
  issue_type TEXT,
  issue_detail TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(lesson_id),
  CONSTRAINT valid_issue_type CHECK (
    issue_type IS NULL OR
    issue_type IN ('late', 'too_fast', 'too_slow', 'technical', 'unprepared', 'other')
  )
);

-- Detailed milestone ratings
CREATE TABLE IF NOT EXISTS teacher_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES teacher_profiles(id) ON DELETE CASCADE NOT NULL,
  student_id UUID NOT NULL,

  -- Milestone tracking
  milestone_type TEXT NOT NULL,
  lesson_count_at_rating INTEGER NOT NULL,

  -- Category ratings (1-5 stars)
  teaching_quality INTEGER NOT NULL CHECK (teaching_quality BETWEEN 1 AND 5),
  punctuality INTEGER NOT NULL CHECK (punctuality BETWEEN 1 AND 5),
  communication INTEGER NOT NULL CHECK (communication BETWEEN 1 AND 5),
  goal_progress INTEGER NOT NULL CHECK (goal_progress BETWEEN 1 AND 5),

  -- Calculated overall (average of above)
  overall_rating DECIMAL(2,1) NOT NULL CHECK (overall_rating BETWEEN 1.0 AND 5.0),

  -- Recommendation
  would_recommend BOOLEAN NOT NULL,

  -- Optional written feedback
  positive_feedback TEXT CHECK (char_length(positive_feedback) <= 500),
  improvement_feedback TEXT CHECK (char_length(improvement_feedback) <= 500),

  -- Admin controls
  is_verified BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  flagged_inappropriate BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_milestone CHECK (
    milestone_type IN ('lesson_1', 'lesson_5', 'lesson_10', 'lesson_20', 'exit')
  )
);

-- Computed teacher rating summary view
CREATE OR REPLACE VIEW teacher_rating_summary AS
SELECT
  tp.id as teacher_id,
  tp.user_id,
  p.full_name as teacher_name,

  -- Detailed ratings stats
  COALESCE(ROUND(AVG(tr.overall_rating), 1), 0) as avg_rating,
  COUNT(DISTINCT tr.id) as total_detailed_ratings,

  -- Quick feedback stats
  COALESCE(ROUND(
    100.0 * COUNT(CASE WHEN lf.thumbs_up = true THEN 1 END)::DECIMAL /
    NULLIF(COUNT(lf.id), 0),
    1
  ), 0) as thumbs_up_percentage,
  COUNT(lf.id) as total_quick_feedback,

  -- Category breakdowns
  COALESCE(ROUND(AVG(tr.teaching_quality), 1), 0) as avg_teaching_quality,
  COALESCE(ROUND(AVG(tr.punctuality), 1), 0) as avg_punctuality,
  COALESCE(ROUND(AVG(tr.communication), 1), 0) as avg_communication,
  COALESCE(ROUND(AVG(tr.goal_progress), 1), 0) as avg_goal_progress,

  -- Recommendation rate
  COALESCE(ROUND(
    100.0 * COUNT(CASE WHEN tr.would_recommend = true THEN 1 END)::DECIMAL /
    NULLIF(COUNT(tr.id), 0),
    1
  ), 0) as recommendation_rate,

  -- Behavioral metrics
  COUNT(DISTINCT l.student_id) as total_unique_students,
  COUNT(DISTINCT CASE WHEN l.status = 'completed' THEN l.id END) as total_lessons_completed,

  -- Completion rate
  COALESCE(ROUND(
    100.0 * COUNT(CASE WHEN l.status = 'completed' THEN 1 END)::DECIMAL /
    NULLIF(COUNT(CASE WHEN l.status IN ('completed', 'cancelled', 'missed') THEN 1 END), 0),
    1
  ), 0) as completion_rate,

  -- Rebook rate (students who took 2+ lessons)
  COALESCE(ROUND(
    100.0 * COUNT(DISTINCT CASE
      WHEN (SELECT COUNT(*) FROM lessons l2
            WHERE l2.student_id = l.student_id
            AND l2.teacher_id = tp.id
            AND l2.status = 'completed') > 1
      THEN l.student_id
    END)::DECIMAL /
    NULLIF(COUNT(DISTINCT l.student_id), 0),
    1
  ), 0) as rebook_rate,

  -- Average lessons per student
  COALESCE(ROUND(
    COUNT(CASE WHEN l.status = 'completed' THEN 1 END)::DECIMAL /
    NULLIF(COUNT(DISTINCT l.student_id), 0),
    1
  ), 0) as avg_lessons_per_student

FROM teacher_profiles tp
LEFT JOIN profiles p ON tp.user_id = p.id
LEFT JOIN teacher_ratings tr ON tp.id = tr.teacher_id AND tr.flagged_inappropriate = false
LEFT JOIN lesson_feedback lf ON tp.id = lf.teacher_id
LEFT JOIN lessons l ON tp.id = l.teacher_id
GROUP BY tp.id, tp.user_id, p.full_name;

-- Grant access to the view
GRANT SELECT ON teacher_rating_summary TO authenticated, anon;

-- Function: Check if student should give detailed rating
CREATE OR REPLACE FUNCTION should_request_detailed_rating(
  p_student_id UUID,
  p_teacher_id UUID
)
RETURNS TEXT AS $$
DECLARE
  lesson_count INTEGER;
  last_rating_milestone TEXT;
BEGIN
  -- Count completed lessons with this teacher
  SELECT COUNT(*) INTO lesson_count
  FROM lessons
  WHERE student_id = p_student_id
  AND teacher_id = p_teacher_id
  AND status = 'completed';

  -- Get last rating milestone
  SELECT milestone_type INTO last_rating_milestone
  FROM teacher_ratings
  WHERE student_id = p_student_id
  AND teacher_id = p_teacher_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Determine next milestone
  IF lesson_count = 1 AND last_rating_milestone IS NULL THEN
    RETURN 'lesson_1';
  ELSIF lesson_count = 5 AND (last_rating_milestone IS NULL OR last_rating_milestone = 'lesson_1') THEN
    RETURN 'lesson_5';
  ELSIF lesson_count = 10 AND (last_rating_milestone IS NULL OR last_rating_milestone IN ('lesson_1', 'lesson_5')) THEN
    RETURN 'lesson_10';
  ELSIF lesson_count = 20 AND last_rating_milestone != 'lesson_20' THEN
    RETURN 'lesson_20';
  ELSE
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get teacher rating data for display
CREATE OR REPLACE FUNCTION get_teacher_rating_display(p_teacher_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'summary', (SELECT row_to_json(t) FROM teacher_rating_summary t WHERE teacher_id = p_teacher_id),
    'recent_reviews', (
      SELECT json_agg(
        json_build_object(
          'rating', overall_rating,
          'would_recommend', would_recommend,
          'positive_feedback', positive_feedback,
          'created_at', created_at,
          'milestone', milestone_type
        )
      )
      FROM teacher_ratings tr
      WHERE tr.teacher_id = p_teacher_id
      AND tr.flagged_inappropriate = false
      AND tr.positive_feedback IS NOT NULL
      AND tr.positive_feedback != ''
      ORDER BY tr.created_at DESC
      LIMIT 5
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_lesson_feedback_teacher ON lesson_feedback(teacher_id);
CREATE INDEX IF NOT EXISTS idx_lesson_feedback_student ON lesson_feedback(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_feedback_lesson ON lesson_feedback(lesson_id);
CREATE INDEX IF NOT EXISTS idx_teacher_ratings_teacher ON teacher_ratings(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_ratings_student ON teacher_ratings(student_id);
CREATE INDEX IF NOT EXISTS idx_teacher_ratings_created ON teacher_ratings(created_at DESC);

-- Row Level Security
ALTER TABLE lesson_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_ratings ENABLE ROW LEVEL SECURITY;

-- Policies for lesson_feedback
CREATE POLICY "Users can view feedback for their lessons"
  ON lesson_feedback FOR SELECT
  USING (
    student_id::text = auth.uid()::text OR
    teacher_id IN (SELECT id FROM teacher_profiles WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles))
  );

CREATE POLICY "Students can submit feedback"
  ON lesson_feedback FOR INSERT
  WITH CHECK (
    student_id::text = auth.uid()::text
  );

-- Policies for teacher_ratings
CREATE POLICY "Anyone can view non-flagged ratings"
  ON teacher_ratings FOR SELECT
  USING (flagged_inappropriate = false);

CREATE POLICY "Students can submit ratings"
  ON teacher_ratings FOR INSERT
  WITH CHECK (
    student_id::text = auth.uid()::text
  );

CREATE POLICY "Admins can update ratings"
  ON teacher_ratings FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles)));

-- Comment on tables
COMMENT ON TABLE lesson_feedback IS 'Quick thumbs up/down feedback collected after every lesson';
COMMENT ON TABLE teacher_ratings IS 'Detailed multi-category ratings collected at milestone lessons (1, 5, 10, 20)';
COMMENT ON VIEW teacher_rating_summary IS 'Comprehensive teacher rating summary combining quick feedback, detailed ratings, and behavioral metrics';
