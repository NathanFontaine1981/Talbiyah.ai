-- ┌────────────────────────────────────────────────────────────────────┐
-- │ INTERNATIONAL PAYOUT SUPPORT                                        │
-- │ Adds IBAN / SWIFT / country fields so non-UK teachers (e.g. Egypt)  │
-- │ can be paid via international bank transfer (Wise).                 │
-- │                                                                    │
-- │ Stripe Connect Express does NOT support Egypt as a connected-      │
-- │ account country, so international teachers are paid via the         │
-- │ existing manual/Wise payout flow using the details below.          │
-- └────────────────────────────────────────────────────────────────────┘

ALTER TABLE teacher_payment_settings
  ADD COLUMN IF NOT EXISTS bank_iban text,
  ADD COLUMN IF NOT EXISTS bank_swift_bic text,
  ADD COLUMN IF NOT EXISTS bank_country text,        -- ISO 3166-1 alpha-2 (e.g. 'EG')
  ADD COLUMN IF NOT EXISTS bank_currency text,       -- payout currency (e.g. 'EGP', 'USD')
  ADD COLUMN IF NOT EXISTS taptap_phone text;        -- TapTap Send recipient mobile/phone number

COMMENT ON COLUMN teacher_payment_settings.bank_iban IS 'IBAN for international bank transfers (Wise). Encrypt in production.';
COMMENT ON COLUMN teacher_payment_settings.bank_swift_bic IS 'SWIFT/BIC code for international bank transfers.';
COMMENT ON COLUMN teacher_payment_settings.bank_country IS 'ISO 3166-1 alpha-2 country code of the bank account.';
COMMENT ON COLUMN teacher_payment_settings.bank_currency IS 'Currency the teacher wants to be paid in (e.g. EGP, USD).';
COMMENT ON COLUMN teacher_payment_settings.taptap_phone IS 'TapTap Send recipient phone/mobile number (manual payout method).';

-- Allow the new 'taptap_send' payout method on both tables.
-- TapTap Send is a manual (no-API) remittance method: admin sends from the app,
-- then records the payout. Recipient name reuses bank_account_holder_name.
ALTER TABLE teacher_payment_settings DROP CONSTRAINT IF EXISTS teacher_payment_method_check;
ALTER TABLE teacher_payment_settings ADD CONSTRAINT teacher_payment_method_check CHECK (
  preferred_payout_method IN ('stripe_connect', 'manual', 'paypal', 'wise', 'bank_transfer', 'taptap_send')
);

ALTER TABLE teacher_payouts DROP CONSTRAINT IF EXISTS teacher_payouts_method_check;
ALTER TABLE teacher_payouts ADD CONSTRAINT teacher_payouts_method_check CHECK (
  payout_method IN ('stripe_connect', 'manual', 'paypal', 'wise', 'bank_transfer', 'taptap_send')
);
