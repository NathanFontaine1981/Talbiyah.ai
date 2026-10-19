-- Add refund tracking columns to credit_purchases table
ALTER TABLE credit_purchases
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS refund_type TEXT CHECK (refund_type IN ('full', 'partial')),
ADD COLUMN IF NOT EXISTS refund_reason TEXT,
ADD COLUMN IF NOT EXISTS stripe_refund_id TEXT;

-- Create index for finding refunded purchases
CREATE INDEX IF NOT EXISTS idx_credit_purchases_refunded ON credit_purchases(refunded_at) WHERE refunded_at IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN credit_purchases.refunded_at IS 'Timestamp when refund was processed';
COMMENT ON COLUMN credit_purchases.refund_amount IS 'Amount refunded in GBP';
COMMENT ON COLUMN credit_purchases.refund_type IS 'Type of refund: full or partial';
COMMENT ON COLUMN credit_purchases.refund_reason IS 'Reason provided for refund request';
COMMENT ON COLUMN credit_purchases.stripe_refund_id IS 'Stripe refund ID for tracking';
