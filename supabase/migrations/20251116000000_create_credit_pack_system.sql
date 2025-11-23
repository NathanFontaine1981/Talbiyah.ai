-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- CREATE CREDIT PACK SYSTEM
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- User credits balance table (uses NUMERIC for fractional credits)
CREATE TABLE IF NOT EXISTS user_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  credits_remaining NUMERIC(10,2) NOT NULL DEFAULT 0, -- Changed to support 0.5 credits
  total_credits_purchased NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_credits_used NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Credit purchase history
CREATE TABLE IF NOT EXISTS credit_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  pack_size INTEGER NOT NULL, -- 4, 8, or 16
  pack_price DECIMAL(10,2) NOT NULL,
  credits_added INTEGER NOT NULL,
  stripe_payment_id TEXT,
  stripe_checkout_session_id TEXT,
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  refund_deadline TIMESTAMP WITH TIME ZONE, -- 7 days after purchase
  refunded BOOLEAN DEFAULT FALSE,
  refund_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Credit transaction log (supports fractional credits)
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  transaction_type TEXT NOT NULL, -- 'purchase', 'booking', 'refund', 'adjustment'
  credits_change NUMERIC(10,2) NOT NULL, -- positive for add, negative for deduct
  credits_after NUMERIC(10,2) NOT NULL, -- balance after transaction
  lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  purchase_id UUID REFERENCES credit_purchases(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_user_id ON credit_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_stripe_session ON credit_purchases(stripe_checkout_session_id);

-- Row Level Security
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Policies: Users can read their own data
CREATE POLICY "Users can view own credits"
  ON user_credits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own purchases"
  ON credit_purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions"
  ON credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Function to get user credit balance
CREATE OR REPLACE FUNCTION get_user_credits(p_user_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_credits NUMERIC;
BEGIN
  SELECT credits_remaining INTO v_credits
  FROM user_credits
  WHERE user_id = p_user_id;

  RETURN COALESCE(v_credits, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add credits (called by webhook after purchase)
CREATE OR REPLACE FUNCTION add_user_credits(
  p_user_id UUID,
  p_credits INTEGER,
  p_purchase_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS NUMERIC AS $$
DECLARE
  v_new_balance NUMERIC;
BEGIN
  -- Insert or update user_credits
  INSERT INTO user_credits (user_id, credits_remaining, total_credits_purchased)
  VALUES (p_user_id, p_credits, p_credits)
  ON CONFLICT (user_id)
  DO UPDATE SET
    credits_remaining = user_credits.credits_remaining + p_credits,
    total_credits_purchased = user_credits.total_credits_purchased + p_credits,
    updated_at = NOW()
  RETURNING credits_remaining INTO v_new_balance;

  -- Log transaction
  INSERT INTO credit_transactions (
    user_id,
    transaction_type,
    credits_change,
    credits_after,
    purchase_id,
    notes
  ) VALUES (
    p_user_id,
    'purchase',
    p_credits,
    v_new_balance,
    p_purchase_id,
    p_notes
  );

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to deduct credits (called when booking lesson)
-- UPDATED: Now supports fractional credits (0.5 for 30min, 1.0 for 60min)
CREATE OR REPLACE FUNCTION deduct_user_credits(
  p_user_id UUID,
  p_credits NUMERIC, -- Amount to deduct (0.5 or 1.0)
  p_lesson_id UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS NUMERIC AS $$
DECLARE
  v_new_balance NUMERIC;
  v_current_balance NUMERIC;
BEGIN
  -- Get current balance
  SELECT credits_remaining INTO v_current_balance
  FROM user_credits
  WHERE user_id = p_user_id;

  -- Check if user has enough credits
  IF v_current_balance IS NULL OR v_current_balance < p_credits THEN
    RAISE EXCEPTION 'Insufficient credits. Current: %, Required: %', COALESCE(v_current_balance, 0), p_credits;
  END IF;

  -- Deduct the specified amount
  UPDATE user_credits
  SET
    credits_remaining = credits_remaining - p_credits,
    total_credits_used = total_credits_used + p_credits,
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING credits_remaining INTO v_new_balance;

  -- Log transaction
  INSERT INTO credit_transactions (
    user_id,
    transaction_type,
    credits_change,
    credits_after,
    lesson_id,
    notes
  ) VALUES (
    p_user_id,
    'booking',
    -p_credits,
    v_new_balance,
    p_lesson_id,
    p_notes
  );

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- MIGRATION COMPLETE
-- ✅ Created user_credits table
-- ✅ Created credit_purchases table
-- ✅ Created credit_transactions table
-- ✅ Added indexes and RLS policies
-- ✅ Created helper functions
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
