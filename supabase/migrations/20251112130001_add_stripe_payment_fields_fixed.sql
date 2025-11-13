-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ADD STRIPE PAYMENT FIELDS TO LESSONS TABLE (FIXED FOR ACTUAL SCHEMA)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. ADD STRIPE PAYMENT COLUMNS TO LESSONS TABLE
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending';
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS payment_amount decimal(10,2);
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS payment_currency text DEFAULT 'gbp';
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS refund_amount decimal(10,2);
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS refund_reason text;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS refunded_at timestamptz;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS paid_at timestamptz;

-- Add CHECK constraint separately (only if column was just created)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'lessons_payment_status_check'
  ) THEN
    ALTER TABLE lessons ADD CONSTRAINT lessons_payment_status_check
      CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'));
  END IF;
END $$;

-- 2. ADD INDEXES FOR STRIPE QUERIES
CREATE INDEX IF NOT EXISTS idx_lessons_stripe_checkout_session ON lessons(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_lessons_stripe_payment_intent ON lessons(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_lessons_payment_status ON lessons(payment_status);
CREATE INDEX IF NOT EXISTS idx_lessons_stripe_customer ON lessons(stripe_customer_id);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- MIGRATION COMPLETE
-- ✅ Added Stripe tracking fields to lessons table
-- ✅ Added indexes for fast Stripe queries
-- ✅ Ready for enhanced payment tracking
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
