-- Payout fixes so the admin Teacher Payouts page loads and the monthly payout
-- run works:
--   1. Add teacher_payment_settings.revolut_detail (the admin page selects & saves it).
--   2. Allow the 'revolut' payout method on both settings and payouts tables.
--   3. Allow the 'requested' payout status (monthly-teacher-payouts queues manual
--      payouts with status 'requested'; the admin page filters on it).
-- Idempotent: safe to run repeatedly in the Supabase SQL editor.

-- 1. Revolut recipient detail (e.g. @revtag or phone).
ALTER TABLE teacher_payment_settings
  ADD COLUMN IF NOT EXISTS revolut_detail text;

COMMENT ON COLUMN teacher_payment_settings.revolut_detail IS
  'Revolut recipient handle (@revtag) or phone number for manual payouts.';

-- 2. Add 'revolut' to the allowed payout methods on both tables (keeping the
--    existing set including taptap_send).
ALTER TABLE teacher_payment_settings DROP CONSTRAINT IF EXISTS teacher_payment_method_check;
ALTER TABLE teacher_payment_settings ADD CONSTRAINT teacher_payment_method_check CHECK (
  preferred_payout_method IN ('stripe_connect', 'manual', 'paypal', 'wise', 'bank_transfer', 'taptap_send', 'revolut')
);

ALTER TABLE teacher_payouts DROP CONSTRAINT IF EXISTS teacher_payouts_method_check;
ALTER TABLE teacher_payouts ADD CONSTRAINT teacher_payouts_method_check CHECK (
  payout_method IN ('stripe_connect', 'manual', 'paypal', 'wise', 'bank_transfer', 'taptap_send', 'revolut')
);

-- 3. Add 'requested' to the allowed payout statuses (the monthly run queues
--    manual payouts as 'requested' before an admin actions them).
ALTER TABLE teacher_payouts DROP CONSTRAINT IF EXISTS teacher_payouts_status_check;
ALTER TABLE teacher_payouts ADD CONSTRAINT teacher_payouts_status_check CHECK (
  status IN ('requested', 'pending', 'processing', 'completed', 'failed', 'cancelled')
);
