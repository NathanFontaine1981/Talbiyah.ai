-- Create invoices table for payment records
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credit_purchase_id UUID REFERENCES credit_purchases(id) ON DELETE SET NULL,
  stripe_payment_intent_id TEXT,

  -- Customer details (snapshot at time of invoice)
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,

  -- Invoice details
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  discount_code TEXT,
  total_amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'GBP',

  -- Status
  status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'refunded', 'partially_refunded')),

  -- Timestamps
  invoice_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Refund tracking
  refund_amount NUMERIC(10,2),
  refunded_at TIMESTAMP WITH TIME ZONE
);

-- Create invoice number sequence
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1000;

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'TAL-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(nextval('invoice_number_seq')::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_payment ON invoices(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_invoices_purchase ON invoices(credit_purchase_id);

-- RLS policies
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Users can view their own invoices
CREATE POLICY "Users can view own invoices"
  ON invoices FOR SELECT
  USING (auth.uid() = user_id);

-- Only system (service role) can insert/update invoices
CREATE POLICY "Service role can manage invoices"
  ON invoices FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON invoices TO authenticated;
GRANT ALL ON invoices TO service_role;
GRANT USAGE, SELECT ON SEQUENCE invoice_number_seq TO service_role;
