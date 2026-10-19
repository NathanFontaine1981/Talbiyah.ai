-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- AI TOKEN SYSTEM
-- Micro-currency for AI-powered features (Dua Builder, Khutbah Creator, Insights)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ┌──────────────────────────────────────────────────────────────────┐
-- │ USER TOKENS TABLE                                                 │
-- │ Stores user token balances                                        │
-- └──────────────────────────────────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS user_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tokens_remaining INTEGER NOT NULL DEFAULT 0,
  total_tokens_purchased INTEGER NOT NULL DEFAULT 0,
  total_tokens_from_bonuses INTEGER NOT NULL DEFAULT 0,
  total_tokens_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT user_tokens_user_id_key UNIQUE (user_id),
  CONSTRAINT tokens_remaining_non_negative CHECK (tokens_remaining >= 0)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON user_tokens(user_id);

-- Enable RLS
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;

-- Users can view their own token balance
CREATE POLICY "Users can view own tokens"
  ON user_tokens FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own tokens (for deductions through RPC)
CREATE POLICY "Users can update own tokens"
  ON user_tokens FOR UPDATE
  USING (auth.uid() = user_id);

-- Admin can manage all tokens
CREATE POLICY "Admin can manage all tokens"
  ON user_tokens FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- ┌──────────────────────────────────────────────────────────────────┐
-- │ TOKEN TRANSACTIONS TABLE                                          │
-- │ Audit trail for all token movements                               │
-- └──────────────────────────────────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS token_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL,
  tokens_change INTEGER NOT NULL,
  tokens_after INTEGER NOT NULL,
  feature TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_transaction_type CHECK (
    transaction_type IN (
      'purchase',           -- Standalone token purchase
      'bonus_from_credits', -- Bonus tokens from credit purchase
      'dua_audio',          -- Dua Builder audio generation
      'khutbah_text',       -- Khutbah Creator text (after free limit)
      'khutbah_audio',      -- Khutbah Creator audio
      'insight_audio',      -- Insight audio summary
      'insight_pdf',        -- Insight PDF download
      'refund',             -- Token refund
      'admin_adjustment',   -- Manual admin adjustment
      'gift'                -- Gift from another user
    )
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_token_transactions_user_id ON token_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_type ON token_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_token_transactions_created_at ON token_transactions(created_at);

-- Enable RLS
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view own token transactions"
  ON token_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Admin can view all transactions
CREATE POLICY "Admin can view all token transactions"
  ON token_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- ┌──────────────────────────────────────────────────────────────────┐
-- │ TOKEN PURCHASES TABLE                                             │
-- │ Tracks standalone token purchases via Stripe                      │
-- └──────────────────────────────────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS token_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  package_type TEXT NOT NULL,
  tokens_amount INTEGER NOT NULL,
  price_paid NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'gbp',
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT valid_package_type CHECK (
    package_type IN ('starter', 'standard', 'best_value')
  ),
  CONSTRAINT valid_status CHECK (
    status IN ('pending', 'completed', 'failed', 'refunded')
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_token_purchases_user_id ON token_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_token_purchases_stripe_session ON token_purchases(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_token_purchases_status ON token_purchases(status);

-- Enable RLS
ALTER TABLE token_purchases ENABLE ROW LEVEL SECURITY;

-- Users can view their own purchases
CREATE POLICY "Users can view own token purchases"
  ON token_purchases FOR SELECT
  USING (auth.uid() = user_id);

-- Admin can manage all purchases
CREATE POLICY "Admin can manage all token purchases"
  ON token_purchases FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- ┌──────────────────────────────────────────────────────────────────┐
-- │ MONTHLY KHUTBAH USAGE TABLE                                       │
-- │ Tracks free Khutbah limit (2 per month)                           │
-- └──────────────────────────────────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS monthly_khutbah_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL, -- Format: YYYY-MM
  khutbahs_generated INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT monthly_khutbah_usage_unique UNIQUE (user_id, month_year)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_monthly_khutbah_user_month ON monthly_khutbah_usage(user_id, month_year);

-- Enable RLS
ALTER TABLE monthly_khutbah_usage ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own usage
CREATE POLICY "Users can view own khutbah usage"
  ON monthly_khutbah_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own khutbah usage"
  ON monthly_khutbah_usage FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own khutbah usage"
  ON monthly_khutbah_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ┌──────────────────────────────────────────────────────────────────┐
-- │ FUNCTIONS                                                         │
-- └──────────────────────────────────────────────────────────────────┘

-- Function to get user's token balance
CREATE OR REPLACE FUNCTION get_user_tokens(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_tokens INTEGER;
BEGIN
  SELECT tokens_remaining INTO v_tokens
  FROM user_tokens
  WHERE user_id = p_user_id;

  RETURN COALESCE(v_tokens, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add tokens to user account
CREATE OR REPLACE FUNCTION add_user_tokens(
  p_user_id UUID,
  p_tokens INTEGER,
  p_transaction_type TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Insert or update user_tokens
  INSERT INTO user_tokens (user_id, tokens_remaining, total_tokens_purchased)
  VALUES (p_user_id, p_tokens, CASE WHEN p_transaction_type = 'purchase' THEN p_tokens ELSE 0 END)
  ON CONFLICT (user_id)
  DO UPDATE SET
    tokens_remaining = user_tokens.tokens_remaining + p_tokens,
    total_tokens_purchased = user_tokens.total_tokens_purchased +
      CASE WHEN p_transaction_type = 'purchase' THEN p_tokens ELSE 0 END,
    total_tokens_from_bonuses = user_tokens.total_tokens_from_bonuses +
      CASE WHEN p_transaction_type = 'bonus_from_credits' THEN p_tokens ELSE 0 END,
    updated_at = NOW()
  RETURNING tokens_remaining INTO v_new_balance;

  -- Log transaction
  INSERT INTO token_transactions (
    user_id,
    transaction_type,
    tokens_change,
    tokens_after,
    notes
  ) VALUES (
    p_user_id,
    p_transaction_type,
    p_tokens,
    v_new_balance,
    p_notes
  );

  RETURN json_build_object(
    'success', true,
    'new_balance', v_new_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to deduct tokens (main function for AI features)
CREATE OR REPLACE FUNCTION deduct_user_tokens(
  p_user_id UUID,
  p_tokens INTEGER,
  p_feature TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Validate tokens amount
  IF p_tokens <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Token amount must be positive');
  END IF;

  -- Get current balance
  SELECT tokens_remaining INTO v_current_balance
  FROM user_tokens
  WHERE user_id = p_user_id;

  v_current_balance := COALESCE(v_current_balance, 0);

  -- Check sufficient balance
  IF v_current_balance < p_tokens THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Insufficient tokens',
      'required', p_tokens,
      'available', v_current_balance
    );
  END IF;

  -- Deduct tokens
  UPDATE user_tokens
  SET
    tokens_remaining = tokens_remaining - p_tokens,
    total_tokens_used = total_tokens_used + p_tokens,
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING tokens_remaining INTO v_new_balance;

  -- Log transaction
  INSERT INTO token_transactions (
    user_id,
    transaction_type,
    tokens_change,
    tokens_after,
    feature,
    notes
  ) VALUES (
    p_user_id,
    p_feature,
    -p_tokens,
    v_new_balance,
    p_feature,
    p_notes
  );

  RETURN json_build_object(
    'success', true,
    'tokens_deducted', p_tokens,
    'new_balance', v_new_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and increment monthly khutbah usage
-- Returns: { within_free_limit: boolean, current_count: integer }
CREATE OR REPLACE FUNCTION check_khutbah_usage(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_current_month TEXT;
  v_current_count INTEGER;
  v_free_limit INTEGER := 2;
BEGIN
  v_current_month := TO_CHAR(NOW(), 'YYYY-MM');

  -- Get or create usage record
  INSERT INTO monthly_khutbah_usage (user_id, month_year, khutbahs_generated)
  VALUES (p_user_id, v_current_month, 0)
  ON CONFLICT (user_id, month_year)
  DO NOTHING;

  SELECT khutbahs_generated INTO v_current_count
  FROM monthly_khutbah_usage
  WHERE user_id = p_user_id AND month_year = v_current_month;

  RETURN json_build_object(
    'within_free_limit', v_current_count < v_free_limit,
    'current_count', v_current_count,
    'free_limit', v_free_limit,
    'remaining_free', GREATEST(0, v_free_limit - v_current_count)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment khutbah usage count
CREATE OR REPLACE FUNCTION increment_khutbah_usage(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_current_month TEXT;
  v_new_count INTEGER;
BEGIN
  v_current_month := TO_CHAR(NOW(), 'YYYY-MM');

  INSERT INTO monthly_khutbah_usage (user_id, month_year, khutbahs_generated)
  VALUES (p_user_id, v_current_month, 1)
  ON CONFLICT (user_id, month_year)
  DO UPDATE SET
    khutbahs_generated = monthly_khutbah_usage.khutbahs_generated + 1,
    updated_at = NOW()
  RETURNING khutbahs_generated INTO v_new_count;

  RETURN json_build_object(
    'success', true,
    'new_count', v_new_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at on user_tokens
CREATE OR REPLACE FUNCTION update_user_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_tokens_updated_at_trigger ON user_tokens;
CREATE TRIGGER update_user_tokens_updated_at_trigger
  BEFORE UPDATE ON user_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_user_tokens_updated_at();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TOKEN PRICING REFERENCE (for documentation)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
--
-- STANDALONE PACKAGES:
-- - starter:    100 tokens = £5  (£0.05/token)
-- - standard:   250 tokens = £10 (£0.04/token)
-- - best_value: 500 tokens = £18 (£0.036/token)
--
-- BONUS TOKENS WITH CREDIT PURCHASES:
-- - 4 credits (Starter):    100 FREE tokens
-- - 8 credits (Standard):   300 FREE tokens
-- - 16 credits (Intensive): 700 FREE tokens
--
-- TOKEN COSTS BY FEATURE:
-- - Dua Builder audio download:           10 tokens
-- - Khutbah text (after 2 free/month):    20 tokens
-- - Khutbah audio download:               25 tokens
-- - Insight audio summary:                15 tokens
-- - Insight PDF download:                 10 tokens
--
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- MIGRATION COMPLETE
-- ✅ Created user_tokens table
-- ✅ Created token_transactions table
-- ✅ Created token_purchases table
-- ✅ Created monthly_khutbah_usage table
-- ✅ Added get_user_tokens function
-- ✅ Added add_user_tokens function
-- ✅ Added deduct_user_tokens function
-- ✅ Added check_khutbah_usage function
-- ✅ Added increment_khutbah_usage function
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
