-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ADD STRIPE PAYMENT FIELDS TO LESSONS TABLE
-- Replace fake payment system with real Stripe integration
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. ADD STRIPE PAYMENT COLUMNS TO LESSONS TABLE
-- payment_id will now store Stripe payment_intent ID
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS
  stripe_checkout_session_id text;

ALTER TABLE lessons ADD COLUMN IF NOT EXISTS
  stripe_payment_intent_id text;

ALTER TABLE lessons ADD COLUMN IF NOT EXISTS
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'));

ALTER TABLE lessons ADD COLUMN IF NOT EXISTS
  payment_amount decimal(10,2);

ALTER TABLE lessons ADD COLUMN IF NOT EXISTS
  payment_currency text DEFAULT 'gbp';

ALTER TABLE lessons ADD COLUMN IF NOT EXISTS
  stripe_customer_id text;

ALTER TABLE lessons ADD COLUMN IF NOT EXISTS
  refund_amount decimal(10,2);

ALTER TABLE lessons ADD COLUMN IF NOT EXISTS
  refund_reason text;

ALTER TABLE lessons ADD COLUMN IF NOT EXISTS
  refunded_at timestamptz;

-- 2. ADD INDEXES FOR STRIPE QUERIES
CREATE INDEX IF NOT EXISTS idx_lessons_stripe_checkout_session ON lessons(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_lessons_stripe_payment_intent ON lessons(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_lessons_payment_status ON lessons(payment_status);
CREATE INDEX IF NOT EXISTS idx_lessons_stripe_customer ON lessons(stripe_customer_id);

-- 3. CREATE PAYMENT LOGS TABLE FOR AUDIT TRAIL
CREATE TABLE IF NOT EXISTS payment_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE,

  event_type text NOT NULL, -- 'checkout_created', 'payment_succeeded', 'payment_failed', 'refund_issued'
  stripe_event_id text,

  -- Event data
  amount decimal(10,2),
  currency text,
  payment_status text,

  -- Stripe IDs
  checkout_session_id text,
  payment_intent_id text,
  customer_id text,

  -- Error details (if applicable)
  error_code text,
  error_message text,

  -- Raw event data for debugging
  raw_event_data jsonb,

  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_logs_lesson ON payment_logs(lesson_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_event_type ON payment_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_payment_logs_stripe_event ON payment_logs(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_created ON payment_logs(created_at DESC);

-- 4. ENABLE RLS ON PAYMENT LOGS
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

-- Students can view payment logs for their own lessons
CREATE POLICY "Students can view own payment logs" ON payment_logs
  FOR SELECT
  USING (
    lesson_id IN (
      SELECT id FROM lessons WHERE student_id = auth.uid()
    )
  );

-- Teachers can view payment logs for their lessons
CREATE POLICY "Teachers can view their lesson payment logs" ON payment_logs
  FOR SELECT
  USING (
    lesson_id IN (
      SELECT id FROM lessons
      WHERE teacher_id IN (
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
      WHERE id = auth.uid()
      AND (role = 'admin' OR 'admin' = ANY(roles))
    )
  );

-- 5. CREATE FUNCTION TO LOG PAYMENT EVENTS
CREATE OR REPLACE FUNCTION log_payment_event(
  p_lesson_id uuid,
  p_event_type text,
  p_stripe_event_id text DEFAULT NULL,
  p_amount decimal DEFAULT NULL,
  p_currency text DEFAULT NULL,
  p_payment_status text DEFAULT NULL,
  p_checkout_session_id text DEFAULT NULL,
  p_payment_intent_id text DEFAULT NULL,
  p_customer_id text DEFAULT NULL,
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
    amount,
    currency,
    payment_status,
    checkout_session_id,
    payment_intent_id,
    customer_id,
    error_code,
    error_message,
    raw_event_data
  ) VALUES (
    p_lesson_id,
    p_event_type,
    p_stripe_event_id,
    p_amount,
    p_currency,
    p_payment_status,
    p_checkout_session_id,
    p_payment_intent_id,
    p_customer_id,
    p_error_code,
    p_error_message,
    p_raw_event_data
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. CREATE VIEW FOR PAYMENT OVERVIEW
CREATE OR REPLACE VIEW payment_overview AS
SELECT
  l.id as lesson_id,
  l.student_id,
  l.teacher_id,
  l.scheduled_time,
  l.duration,
  l.payment_status,
  l.payment_amount,
  l.payment_currency,
  l.stripe_checkout_session_id,
  l.stripe_payment_intent_id,
  l.stripe_customer_id,
  l.refund_amount,
  l.refunded_at,
  p.full_name as student_name,
  p.email as student_email,
  tp.user_id as teacher_user_id,
  COUNT(pl.id) as payment_event_count,
  MAX(pl.created_at) as last_payment_event
FROM lessons l
LEFT JOIN profiles p ON p.id = l.student_id
LEFT JOIN teacher_profiles tp ON tp.id = l.teacher_id
LEFT JOIN payment_logs pl ON pl.lesson_id = l.id
WHERE l.payment_status IS NOT NULL
GROUP BY l.id, p.full_name, p.email, tp.user_id;

GRANT SELECT ON payment_overview TO authenticated;

-- 7. UPDATE EXISTING LESSONS
-- Mark existing lessons with fake payment_id as 'completed' if they're done
UPDATE lessons
SET payment_status = 'completed'
WHERE status = 'completed'
  AND payment_id IS NOT NULL
  AND payment_status IS NULL;

-- Mark pending lessons as 'pending'
UPDATE lessons
SET payment_status = 'pending'
WHERE status IN ('scheduled', 'pending')
  AND payment_status IS NULL;

-- 8. ADD COMMENTS
COMMENT ON COLUMN lessons.stripe_checkout_session_id IS 'Stripe Checkout Session ID for this lesson booking';
COMMENT ON COLUMN lessons.stripe_payment_intent_id IS 'Stripe Payment Intent ID (actual payment)';
COMMENT ON COLUMN lessons.payment_status IS 'Payment status: pending, processing, completed, failed, refunded, cancelled';
COMMENT ON COLUMN lessons.payment_amount IS 'Amount paid in pounds (GBP)';
COMMENT ON COLUMN lessons.stripe_customer_id IS 'Stripe Customer ID for the student';
COMMENT ON TABLE payment_logs IS 'Audit trail for all payment events and webhook calls';
COMMENT ON FUNCTION log_payment_event IS 'Helper function to log payment events from webhooks';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- MIGRATION COMPLETE
-- Stripe payment fields added to lessons table
-- Payment logging and audit trail implemented
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
