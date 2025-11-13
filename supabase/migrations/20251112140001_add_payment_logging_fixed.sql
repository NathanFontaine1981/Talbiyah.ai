-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PAYMENT LOGGING & AUDIT TRAIL (FIXED FOR ACTUAL SCHEMA)
-- Uses correct column names: duration_minutes, learner_id, roles (not role)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. CREATE PAYMENT LOGS TABLE
CREATE TABLE IF NOT EXISTS payment_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE,

  -- Event details
  event_type text NOT NULL,
  stripe_event_id text,

  -- Payment IDs
  checkout_session_id text,
  payment_intent_id text,
  customer_id text,

  -- Amounts
  amount decimal(10,2),
  currency text DEFAULT 'gbp',

  -- Status
  payment_status text,

  -- Error tracking
  error_code text,
  error_message text,

  -- Raw data for debugging
  raw_event_data jsonb,

  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_logs_lesson ON payment_logs(lesson_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_event_type ON payment_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_payment_logs_payment_intent ON payment_logs(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_created_at ON payment_logs(created_at DESC);

-- 2. CREATE PAYMENT LOGGING FUNCTION
CREATE OR REPLACE FUNCTION log_payment_event(
  p_lesson_id uuid,
  p_event_type text,
  p_stripe_event_id text DEFAULT NULL,
  p_checkout_session_id text DEFAULT NULL,
  p_payment_intent_id text DEFAULT NULL,
  p_customer_id text DEFAULT NULL,
  p_amount decimal DEFAULT NULL,
  p_currency text DEFAULT 'gbp',
  p_payment_status text DEFAULT NULL,
  p_error_code text DEFAULT NULL,
  p_error_message text DEFAULT NULL,
  p_raw_event_data jsonb DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO payment_logs (
    lesson_id,
    event_type,
    stripe_event_id,
    checkout_session_id,
    payment_intent_id,
    customer_id,
    amount,
    currency,
    payment_status,
    error_code,
    error_message,
    raw_event_data
  ) VALUES (
    p_lesson_id,
    p_event_type,
    p_stripe_event_id,
    p_checkout_session_id,
    p_payment_intent_id,
    p_customer_id,
    p_amount,
    p_currency,
    p_payment_status,
    p_error_code,
    p_error_message,
    p_raw_event_data
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Payment logging failed: %', SQLERRM;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 3. CREATE PAYMENT OVERVIEW VIEW
-- Uses correct column names from actual schema
CREATE OR REPLACE VIEW payment_overview AS
SELECT
  l.id as lesson_id,
  l.learner_id,
  l.student_id,
  l.teacher_id,
  l.scheduled_time,
  l.duration_minutes,
  l.total_cost_paid as price,
  l.payment_status,
  l.payment_id,
  l.stripe_checkout_session_id,
  l.stripe_customer_id,
  l.paid_at,
  l.status as lesson_status,

  -- Student details (via learner or direct student_id)
  COALESCE(
    (SELECT full_name FROM profiles p
      JOIN learners lr ON lr.parent_id = p.id
      WHERE lr.id = l.learner_id
      LIMIT 1),
    (SELECT full_name FROM profiles WHERE id = l.student_id)
  ) as student_name,

  -- Teacher details
  tp.user_id as teacher_user_id,
  tpp.full_name as teacher_name,

  -- Payment logs (latest events)
  (
    SELECT json_agg(
      json_build_object(
        'event_type', pl.event_type,
        'created_at', pl.created_at,
        'amount', pl.amount,
        'payment_status', pl.payment_status
      ) ORDER BY pl.created_at DESC
    )
    FROM payment_logs pl
    WHERE pl.lesson_id = l.id
  ) as payment_events,

  (SELECT COUNT(*) FROM payment_logs WHERE lesson_id = l.id) as event_count,

  l.created_at

FROM lessons l
LEFT JOIN teacher_profiles tp ON tp.id = l.teacher_id
LEFT JOIN profiles tpp ON tpp.id = tp.user_id
WHERE l.payment_status IS NOT NULL;

GRANT SELECT ON payment_overview TO authenticated;

-- 4. CREATE RLS POLICIES FOR PAYMENT LOGS
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

-- Students can view logs for their own lessons (via learner_id or student_id)
CREATE POLICY "Students can view own payment logs" ON payment_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      WHERE lessons.id = payment_logs.lesson_id
      AND (
        lessons.student_id = auth.uid()
        OR lessons.learner_id IN (
          SELECT id FROM learners WHERE parent_id = auth.uid()
        )
      )
    )
  );

-- Teachers can view logs for their lessons
CREATE POLICY "Teachers can view lesson payment logs" ON payment_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      WHERE lessons.id = payment_logs.lesson_id
      AND lessons.teacher_id IN (
        SELECT id FROM teacher_profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Admins can view all payment logs
CREATE POLICY "Admins can view all payment logs" ON payment_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- 5. ADD HELPFUL COMMENTS
COMMENT ON TABLE payment_logs IS 'Complete audit trail of all Stripe payment events for debugging and compliance';
COMMENT ON FUNCTION log_payment_event IS 'Logs payment events to payment_logs table with error handling';
COMMENT ON VIEW payment_overview IS 'Consolidated view of lessons with payment data and event history';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- MIGRATION COMPLETE
-- ✅ payment_logs table created
-- ✅ log_payment_event() function created
-- ✅ payment_overview view created
-- ✅ RLS policies configured
-- ✅ Compatible with actual database schema
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
