-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TEACHER EARNINGS & PAYOUT SYSTEM
-- Complete financial tracking for teacher payments
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ┌────────────────────────────────────────────────────────────────────┐
-- │ 1. TEACHER_PAYOUTS TABLE (CREATE FIRST - referenced by earnings)   │
-- │ Tracks payout batches to teachers                                  │
-- └────────────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS teacher_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Teacher relationship
  teacher_id uuid NOT NULL REFERENCES teacher_profiles(id) ON DELETE CASCADE,

  -- Payout details
  total_amount numeric(10, 2) NOT NULL CHECK (total_amount > 0),
  currency text DEFAULT 'gbp' NOT NULL,
  earnings_count integer NOT NULL DEFAULT 0,

  -- Payment method
  payout_method text NOT NULL DEFAULT 'stripe_connect',
  external_payout_id text, -- Stripe payout ID, PayPal transaction ID, etc.

  -- Status tracking
  status text NOT NULL DEFAULT 'pending',

  -- Bank/payment details (for manual payouts)
  payment_details jsonb, -- Store bank account info, PayPal email, etc.

  -- Timestamps
  initiated_at timestamptz DEFAULT now(),
  processing_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,

  -- Error tracking
  failure_reason text,
  retry_count integer DEFAULT 0,

  -- Admin notes
  notes text,
  processed_by uuid REFERENCES profiles(id), -- Admin who processed manual payout

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Constraints
  CONSTRAINT teacher_payouts_status_check CHECK (
    status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')
  ),
  CONSTRAINT teacher_payouts_method_check CHECK (
    payout_method IN ('stripe_connect', 'manual', 'paypal', 'wise', 'bank_transfer')
  )
);

-- Comments
COMMENT ON TABLE teacher_payouts IS 'Tracks payout batches to teachers';
COMMENT ON COLUMN teacher_payouts.status IS 'pending: queued | processing: being sent | completed: successful | failed: error | cancelled: manually cancelled';
COMMENT ON COLUMN teacher_payouts.external_payout_id IS 'External payment system transaction ID (e.g., Stripe payout ID)';
COMMENT ON COLUMN teacher_payouts.payment_details IS 'Payment method details (bank account, email, etc.) - encrypted in production';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_teacher_payouts_teacher ON teacher_payouts(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_payouts_status ON teacher_payouts(status);
CREATE INDEX IF NOT EXISTS idx_teacher_payouts_external_id ON teacher_payouts(external_payout_id);
CREATE INDEX IF NOT EXISTS idx_teacher_payouts_completed_at ON teacher_payouts(completed_at);
CREATE INDEX IF NOT EXISTS idx_teacher_payouts_teacher_created ON teacher_payouts(teacher_id, created_at DESC);

-- ┌────────────────────────────────────────────────────────────────────┐
-- │ 2. TEACHER_EARNINGS TABLE                                          │
-- │ Tracks earnings per lesson with hold period and payout status     │
-- └────────────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS teacher_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  payout_id uuid REFERENCES teacher_payouts(id) ON DELETE SET NULL,

  -- Financial amounts
  amount_earned numeric(10, 2) NOT NULL CHECK (amount_earned >= 0),
  platform_fee numeric(10, 2) NOT NULL CHECK (platform_fee >= 0),
  total_lesson_cost numeric(10, 2) NOT NULL CHECK (total_lesson_cost >= 0),
  currency text DEFAULT 'gbp' NOT NULL,

  -- Status tracking
  status text NOT NULL DEFAULT 'pending',

  -- Hold period tracking
  lesson_completed_at timestamptz,
  hold_period_days integer DEFAULT 7 NOT NULL,
  cleared_at timestamptz,
  paid_at timestamptz,

  -- Refund tracking
  refunded_at timestamptz,
  refund_amount numeric(10, 2),
  refund_reason text,

  -- Metadata
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Constraints
  CONSTRAINT teacher_earnings_status_check CHECK (
    status IN ('pending', 'held', 'cleared', 'paid', 'refunded', 'cancelled')
  ),
  CONSTRAINT teacher_earnings_unique_lesson UNIQUE (lesson_id)
);

-- Comments
COMMENT ON TABLE teacher_earnings IS 'Tracks teacher earnings per lesson with hold period and payout tracking';
COMMENT ON COLUMN teacher_earnings.status IS 'pending: lesson not complete | held: completed but in hold period | cleared: ready for payout | paid: included in payout | refunded: refunded to student';
COMMENT ON COLUMN teacher_earnings.hold_period_days IS 'Number of days to hold funds before clearing (default 7 days)';
COMMENT ON COLUMN teacher_earnings.cleared_at IS 'Timestamp when hold period ended and funds became available for payout';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_teacher_earnings_teacher ON teacher_earnings(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_earnings_lesson ON teacher_earnings(lesson_id);
CREATE INDEX IF NOT EXISTS idx_teacher_earnings_payout ON teacher_earnings(payout_id);
CREATE INDEX IF NOT EXISTS idx_teacher_earnings_status ON teacher_earnings(status);
CREATE INDEX IF NOT EXISTS idx_teacher_earnings_cleared_at ON teacher_earnings(cleared_at);
CREATE INDEX IF NOT EXISTS idx_teacher_earnings_teacher_status ON teacher_earnings(teacher_id, status);

-- ┌────────────────────────────────────────────────────────────────────┐
-- │ 3. TEACHER PAYMENT SETTINGS TABLE                                  │
-- │ Store teacher payment preferences and bank details                 │
-- └────────────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS teacher_payment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL UNIQUE REFERENCES teacher_profiles(id) ON DELETE CASCADE,

  -- Payment preferences
  preferred_payout_method text DEFAULT 'stripe_connect',
  minimum_payout_amount numeric(10, 2) DEFAULT 50.00,
  payout_schedule text DEFAULT 'monthly', -- weekly, biweekly, monthly, manual

  -- Stripe Connect
  stripe_account_id text,
  stripe_onboarding_completed boolean DEFAULT false,

  -- Bank details (encrypted in production)
  bank_account_holder_name text,
  bank_account_number text,
  bank_sort_code text,
  bank_name text,

  -- PayPal
  paypal_email text,

  -- Tax information
  tax_id text, -- UTR for UK self-employed
  vat_registered boolean DEFAULT false,
  vat_number text,

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT teacher_payment_method_check CHECK (
    preferred_payout_method IN ('stripe_connect', 'manual', 'paypal', 'wise', 'bank_transfer')
  ),
  CONSTRAINT teacher_payout_schedule_check CHECK (
    payout_schedule IN ('weekly', 'biweekly', 'monthly', 'manual')
  )
);

COMMENT ON TABLE teacher_payment_settings IS 'Teacher payment preferences and bank details (should be encrypted in production)';
COMMENT ON COLUMN teacher_payment_settings.minimum_payout_amount IS 'Minimum balance before automatic payout (default £50)';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_teacher_payment_settings_teacher ON teacher_payment_settings(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_payment_settings_stripe ON teacher_payment_settings(stripe_account_id);

-- ┌────────────────────────────────────────────────────────────────────┐
-- │ 4. FUNCTIONS FOR EARNINGS CALCULATION                              │
-- └────────────────────────────────────────────────────────────────────┘

-- Function to calculate teacher balance (cleared but unpaid)
CREATE OR REPLACE FUNCTION get_teacher_balance(p_teacher_id uuid)
RETURNS numeric AS $$
BEGIN
  RETURN COALESCE(
    (
      SELECT SUM(amount_earned)
      FROM teacher_earnings
      WHERE teacher_id = p_teacher_id
      AND status = 'cleared'
    ),
    0
  );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_teacher_balance IS 'Get teacher cleared balance ready for payout';

-- Function to get teacher earnings summary
CREATE OR REPLACE FUNCTION get_teacher_earnings_summary(p_teacher_id uuid)
RETURNS TABLE (
  pending_amount numeric,
  held_amount numeric,
  cleared_amount numeric,
  paid_amount numeric,
  total_lifetime_earnings numeric,
  lessons_pending integer,
  lessons_held integer,
  lessons_cleared integer,
  lessons_paid integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN status = 'pending' THEN amount_earned ELSE 0 END), 0) as pending_amount,
    COALESCE(SUM(CASE WHEN status = 'held' THEN amount_earned ELSE 0 END), 0) as held_amount,
    COALESCE(SUM(CASE WHEN status = 'cleared' THEN amount_earned ELSE 0 END), 0) as cleared_amount,
    COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_earned ELSE 0 END), 0) as paid_amount,
    COALESCE(SUM(CASE WHEN status IN ('cleared', 'paid') THEN amount_earned ELSE 0 END), 0) as total_lifetime_earnings,
    COUNT(*) FILTER (WHERE status = 'pending')::integer as lessons_pending,
    COUNT(*) FILTER (WHERE status = 'held')::integer as lessons_held,
    COUNT(*) FILTER (WHERE status = 'cleared')::integer as lessons_cleared,
    COUNT(*) FILTER (WHERE status = 'paid')::integer as lessons_paid
  FROM teacher_earnings
  WHERE teacher_id = p_teacher_id;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_teacher_earnings_summary IS 'Get comprehensive earnings summary for a teacher';

-- ┌────────────────────────────────────────────────────────────────────┐
-- │ 5. TRIGGER TO AUTO-CREATE EARNINGS ON LESSON COMPLETION            │
-- └────────────────────────────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION create_teacher_earning_on_lesson_complete()
RETURNS TRIGGER AS $$
DECLARE
  v_teacher_rate numeric;
  v_duration_hours numeric;
  v_amount_earned numeric;
  v_platform_fee numeric;
BEGIN
  -- Only create earning if lesson status changed to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN

    -- Calculate earnings
    v_teacher_rate := COALESCE(NEW.teacher_rate_at_booking, 0);
    v_duration_hours := NEW.duration_minutes / 60.0;
    v_amount_earned := v_teacher_rate * v_duration_hours;
    v_platform_fee := COALESCE(NEW.platform_fee, 0);

    -- Insert earning record (if not already exists)
    INSERT INTO teacher_earnings (
      lesson_id,
      teacher_id,
      amount_earned,
      platform_fee,
      total_lesson_cost,
      currency,
      status,
      lesson_completed_at,
      hold_period_days,
      cleared_at
    ) VALUES (
      NEW.id,
      NEW.teacher_id,
      v_amount_earned,
      v_platform_fee,
      COALESCE(NEW.total_cost_paid, v_amount_earned + v_platform_fee),
      COALESCE(NEW.payment_currency, 'gbp'),
      'held', -- Start in 'held' status
      NOW(),
      7, -- 7 day hold period
      NOW() + INTERVAL '7 days' -- Auto-calculate clearing date
    )
    ON CONFLICT (lesson_id) DO NOTHING;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_earning_on_lesson_complete ON lessons;
CREATE TRIGGER trigger_create_earning_on_lesson_complete
  AFTER UPDATE ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION create_teacher_earning_on_lesson_complete();

COMMENT ON FUNCTION create_teacher_earning_on_lesson_complete IS 'Auto-creates teacher earning record when lesson is marked complete';

-- ┌────────────────────────────────────────────────────────────────────┐
-- │ 6. FUNCTION TO CLEAR HELD EARNINGS AFTER HOLD PERIOD               │
-- └────────────────────────────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION clear_held_earnings()
RETURNS integer AS $$
DECLARE
  v_cleared_count integer;
BEGIN
  -- Update earnings that have passed their hold period
  UPDATE teacher_earnings
  SET
    status = 'cleared',
    updated_at = NOW()
  WHERE status = 'held'
  AND cleared_at <= NOW();

  GET DIAGNOSTICS v_cleared_count = ROW_COUNT;

  RETURN v_cleared_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION clear_held_earnings IS 'Clears earnings that have passed their hold period - run via cron job';

-- ┌────────────────────────────────────────────────────────────────────┐
-- │ 7. VIEWS FOR REPORTING                                             │
-- └────────────────────────────────────────────────────────────────────┘

-- Teacher earnings overview
CREATE OR REPLACE VIEW teacher_earnings_overview AS
SELECT
  tp.id as teacher_profile_id,
  tp.user_id as teacher_user_id,
  p.full_name as teacher_name,
  p.email as teacher_email,

  -- Earnings breakdown
  COALESCE(SUM(CASE WHEN te.status = 'pending' THEN te.amount_earned ELSE 0 END), 0) as pending_earnings,
  COALESCE(SUM(CASE WHEN te.status = 'held' THEN te.amount_earned ELSE 0 END), 0) as held_earnings,
  COALESCE(SUM(CASE WHEN te.status = 'cleared' THEN te.amount_earned ELSE 0 END), 0) as cleared_earnings,
  COALESCE(SUM(CASE WHEN te.status = 'paid' THEN te.amount_earned ELSE 0 END), 0) as paid_earnings,
  COALESCE(SUM(CASE WHEN te.status IN ('held', 'cleared', 'paid') THEN te.amount_earned ELSE 0 END), 0) as total_lifetime_earnings,

  -- Lesson counts
  COUNT(*) FILTER (WHERE te.status = 'pending') as pending_lessons,
  COUNT(*) FILTER (WHERE te.status = 'held') as held_lessons,
  COUNT(*) FILTER (WHERE te.status = 'cleared') as cleared_lessons,
  COUNT(*) FILTER (WHERE te.status = 'paid') as paid_lessons,

  -- Payment settings
  tps.preferred_payout_method,
  tps.minimum_payout_amount,
  tps.stripe_account_id,

  -- Next payout eligibility
  CASE
    WHEN COALESCE(SUM(CASE WHEN te.status = 'cleared' THEN te.amount_earned ELSE 0 END), 0) >= COALESCE(tps.minimum_payout_amount, 50)
    THEN true
    ELSE false
  END as eligible_for_payout

FROM teacher_profiles tp
JOIN profiles p ON p.id = tp.user_id
LEFT JOIN teacher_earnings te ON te.teacher_id = tp.id
LEFT JOIN teacher_payment_settings tps ON tps.teacher_id = tp.id
GROUP BY tp.id, tp.user_id, p.full_name, p.email, tps.preferred_payout_method, tps.minimum_payout_amount, tps.stripe_account_id;

COMMENT ON VIEW teacher_earnings_overview IS 'Comprehensive overview of all teacher earnings and payout eligibility';

-- ┌────────────────────────────────────────────────────────────────────┐
-- │ 8. RLS POLICIES                                                    │
-- └────────────────────────────────────────────────────────────────────┘

-- teacher_earnings policies
ALTER TABLE teacher_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view own earnings" ON teacher_earnings
  FOR SELECT
  USING (
    teacher_id IN (
      SELECT id FROM teacher_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all earnings" ON teacher_earnings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND 'admin' = ANY(roles)
    )
  );

CREATE POLICY "Admins can manage earnings" ON teacher_earnings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND 'admin' = ANY(roles)
    )
  );

-- teacher_payouts policies
ALTER TABLE teacher_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view own payouts" ON teacher_payouts
  FOR SELECT
  USING (
    teacher_id IN (
      SELECT id FROM teacher_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all payouts" ON teacher_payouts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND 'admin' = ANY(roles)
    )
  );

CREATE POLICY "Admins can manage payouts" ON teacher_payouts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND 'admin' = ANY(roles)
    )
  );

-- teacher_payment_settings policies
ALTER TABLE teacher_payment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view own payment settings" ON teacher_payment_settings
  FOR SELECT
  USING (
    teacher_id IN (
      SELECT id FROM teacher_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update own payment settings" ON teacher_payment_settings
  FOR ALL
  USING (
    teacher_id IN (
      SELECT id FROM teacher_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all payment settings" ON teacher_payment_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND 'admin' = ANY(roles)
    )
  );

-- ┌────────────────────────────────────────────────────────────────────┐
-- │ 9. UPDATE TRIGGERS                                                 │
-- └────────────────────────────────────────────────────────────────────┘

DROP TRIGGER IF EXISTS update_teacher_earnings_updated_at ON teacher_earnings;
CREATE TRIGGER update_teacher_earnings_updated_at
  BEFORE UPDATE ON teacher_earnings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_teacher_payouts_updated_at ON teacher_payouts;
CREATE TRIGGER update_teacher_payouts_updated_at
  BEFORE UPDATE ON teacher_payouts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_teacher_payment_settings_updated_at ON teacher_payment_settings;
CREATE TRIGGER update_teacher_payment_settings_updated_at
  BEFORE UPDATE ON teacher_payment_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- MIGRATION COMPLETE
-- ✅ teacher_payouts table created first (no dependencies)
-- ✅ teacher_earnings table created with proper FK to payouts
-- ✅ teacher_payment_settings table for payment preferences
-- ✅ Auto-creates earnings when lesson completes (7-day hold)
-- ✅ Functions for balance calculation and earnings summary
-- ✅ Views for admin reporting
-- ✅ RLS policies configured
-- ✅ Ready for Stripe Connect integration
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
