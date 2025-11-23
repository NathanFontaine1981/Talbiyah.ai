-- Comprehensive fix for TeacherHub errors
-- This script creates/fixes all missing tables, views, and functions

-- Fix 1: Update the lesson confirmation functions to use parent_id
CREATE OR REPLACE FUNCTION get_teacher_pending_lessons(p_teacher_id UUID)
RETURNS TABLE(
  lesson_id UUID,
  student_name TEXT,
  student_id UUID,
  scheduled_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  subject_name TEXT,
  hours_until_lesson NUMERIC,
  requested_hours_ago NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    p.full_name,
    lr.id,
    l.scheduled_time,
    l.duration_minutes,
    s.name,
    EXTRACT(EPOCH FROM (l.scheduled_time - NOW())) / 3600,
    EXTRACT(EPOCH FROM (NOW() - l.confirmation_requested_at)) / 3600
  FROM lessons l
  JOIN learners lr ON l.learner_id = lr.id
  JOIN profiles p ON lr.parent_id = p.id
  LEFT JOIN subjects s ON l.subject_id = s.id
  WHERE l.teacher_id = p_teacher_id
  AND l.confirmation_status = 'pending'
  AND l.status = 'booked'
  ORDER BY l.scheduled_time ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix 2: Create/replace teacher_tier_stats view
DROP VIEW IF EXISTS teacher_tier_stats CASCADE;
CREATE VIEW teacher_tier_stats AS
SELECT
  tp.id AS teacher_id,
  COALESCE(tp.current_tier, 'bronze') AS tier,
  COALESCE(tt.tier_name, 'Bronze') AS tier_name,
  COALESCE(tt.tier_icon, '🥉') AS tier_icon,
  COALESCE(tt.teacher_hourly_rate, 15.00) AS teacher_hourly_rate,
  COALESCE(tt.student_hourly_price, 15.00) AS student_hourly_price,
  COALESCE(SUM(l.duration_minutes) / 60.0, 0) AS hours_taught,
  COALESCE(AVG(tr.overall_rating), 0) AS average_rating,
  COUNT(DISTINCT l.learner_id) AS total_students,
  COUNT(CASE WHEN l.status = 'completed' THEN 1 END) AS completed_lessons,
  (
    SELECT tt2.tier_name
    FROM teacher_tiers tt2
    WHERE tt2.min_hours_taught > COALESCE(SUM(l.duration_minutes) / 60.0, 0)
    AND tt2.requires_manual_approval = false
    ORDER BY tt2.min_hours_taught ASC
    LIMIT 1
  ) AS next_auto_tier
FROM teacher_profiles tp
LEFT JOIN teacher_tiers tt ON tp.current_tier = tt.tier
LEFT JOIN lessons l ON tp.id = l.teacher_id
LEFT JOIN teacher_ratings tr ON tp.id = tr.teacher_id
GROUP BY tp.id, tp.current_tier, tt.tier_name, tt.tier_icon, tt.teacher_hourly_rate, tt.student_hourly_price;

-- Grant permissions on view
GRANT SELECT ON teacher_tier_stats TO authenticated, anon;

-- Fix 3: Create/replace teacher_rating_summary view
DROP VIEW IF EXISTS teacher_rating_summary CASCADE;
CREATE VIEW teacher_rating_summary AS
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
  COUNT(DISTINCT l.learner_id) as total_unique_students,
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
            WHERE l2.learner_id = l.learner_id
            AND l2.teacher_id = tp.id
            AND l2.status = 'completed') > 1
      THEN l.learner_id
    END)::DECIMAL /
    NULLIF(COUNT(DISTINCT l.learner_id), 0),
    1
  ), 0) as rebook_rate,

  -- Average lessons per student
  COALESCE(ROUND(
    COUNT(CASE WHEN l.status = 'completed' THEN 1 END)::DECIMAL /
    NULLIF(COUNT(DISTINCT l.learner_id), 0),
    1
  ), 0) as avg_lessons_per_student

FROM teacher_profiles tp
LEFT JOIN profiles p ON tp.user_id = p.id
LEFT JOIN teacher_ratings tr ON tp.id = tr.teacher_id AND (tr.flagged_inappropriate = false OR tr.flagged_inappropriate IS NULL)
LEFT JOIN lesson_feedback lf ON tp.id = lf.teacher_id
LEFT JOIN lessons l ON tp.id = l.teacher_id
GROUP BY tp.id, tp.user_id, p.full_name;

-- Grant permissions on view
GRANT SELECT ON teacher_rating_summary TO authenticated, anon;

-- Fix 4: Create teacher_payouts table (needed by teacher_earnings)
CREATE TABLE IF NOT EXISTS teacher_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  total_amount numeric(10, 2) NOT NULL CHECK (total_amount > 0),
  currency text DEFAULT 'gbp' NOT NULL,
  earnings_count integer NOT NULL DEFAULT 0,
  payout_method text NOT NULL DEFAULT 'stripe_connect',
  external_payout_id text,
  status text NOT NULL DEFAULT 'pending',
  payment_details jsonb,
  initiated_at timestamptz DEFAULT now(),
  processing_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  retry_count integer DEFAULT 0,
  notes text,
  processed_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT teacher_payouts_status_check CHECK (
    status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')
  ),
  CONSTRAINT teacher_payouts_method_check CHECK (
    payout_method IN ('stripe_connect', 'manual', 'paypal', 'wise', 'bank_transfer')
  )
);

CREATE INDEX IF NOT EXISTS idx_teacher_payouts_teacher ON teacher_payouts(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_payouts_status ON teacher_payouts(status);

-- Fix 5: Create teacher_earnings table
CREATE TABLE IF NOT EXISTS teacher_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  payout_id uuid REFERENCES teacher_payouts(id) ON DELETE SET NULL,
  amount numeric(10, 2) NOT NULL CHECK (amount >= 0),
  platform_fee numeric(10, 2) DEFAULT 0,
  total_lesson_cost numeric(10, 2),
  currency text DEFAULT 'gbp' NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  lesson_completed_at timestamptz,
  hold_period_days integer DEFAULT 7 NOT NULL,
  cleared_at timestamptz,
  paid_at timestamptz,
  refunded_at timestamptz,
  refund_amount numeric(10, 2),
  refund_reason text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT teacher_earnings_status_check CHECK (
    status IN ('pending', 'held', 'cleared', 'paid', 'refunded', 'cancelled')
  ),
  CONSTRAINT teacher_earnings_unique_lesson UNIQUE (lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_teacher_earnings_teacher ON teacher_earnings(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_earnings_lesson ON teacher_earnings(lesson_id);
CREATE INDEX IF NOT EXISTS idx_teacher_earnings_status ON teacher_earnings(status);

-- Enable RLS
ALTER TABLE teacher_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_earnings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teacher_earnings (drop first if exists)
DROP POLICY IF EXISTS "Teachers can view own earnings" ON teacher_earnings;
CREATE POLICY "Teachers can view own earnings"
  ON teacher_earnings FOR SELECT
  USING (teacher_id IN (SELECT id FROM teacher_profiles WHERE user_id = auth.uid()));

-- RLS Policies for teacher_payouts (drop first if exists)
DROP POLICY IF EXISTS "Teachers can view own payouts" ON teacher_payouts;
CREATE POLICY "Teachers can view own payouts"
  ON teacher_payouts FOR SELECT
  USING (teacher_id IN (SELECT id FROM teacher_profiles WHERE user_id = auth.uid()));

COMMIT;
