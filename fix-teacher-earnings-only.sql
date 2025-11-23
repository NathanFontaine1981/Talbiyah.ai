-- Quick fix to create just the teacher_earnings table
-- Run this if the comprehensive fix didn't create it

-- Create teacher_earnings table
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
ALTER TABLE teacher_earnings ENABLE ROW LEVEL SECURITY;

-- RLS Policy
DROP POLICY IF EXISTS "Teachers can view own earnings" ON teacher_earnings;
CREATE POLICY "Teachers can view own earnings"
  ON teacher_earnings FOR SELECT
  USING (teacher_id IN (SELECT id FROM teacher_profiles WHERE user_id = auth.uid()));

COMMIT;
