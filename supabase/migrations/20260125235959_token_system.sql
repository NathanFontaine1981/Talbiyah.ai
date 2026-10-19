-- Token System Tables

-- Webhook idempotency table
CREATE TABLE IF NOT EXISTS processed_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User tokens
CREATE TABLE IF NOT EXISTS user_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tokens_remaining INTEGER NOT NULL DEFAULT 0,
  total_tokens_purchased INTEGER NOT NULL DEFAULT 0,
  total_tokens_from_bonuses INTEGER NOT NULL DEFAULT 0,
  total_tokens_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Token purchases
CREATE TABLE IF NOT EXISTS token_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_type TEXT NOT NULL,
  tokens_amount INTEGER NOT NULL,
  price_paid DECIMAL(10,2) NOT NULL,
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Token transactions
CREATE TABLE IF NOT EXISTS token_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL,
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$ BEGIN
  CREATE POLICY "Users can view own tokens" ON user_tokens FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view own purchases" ON token_purchases FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view own transactions" ON token_transactions FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add tokens function
CREATE OR REPLACE FUNCTION add_user_tokens(
  p_user_id UUID,
  p_tokens INTEGER,
  p_transaction_type TEXT DEFAULT 'purchase',
  p_notes TEXT DEFAULT NULL
)
RETURNS TABLE(new_balance INTEGER, transaction_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_transaction_id UUID;
BEGIN
  INSERT INTO user_tokens (user_id, tokens_remaining, total_tokens_purchased)
  VALUES (p_user_id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT tokens_remaining INTO v_current_balance
  FROM user_tokens WHERE user_id = p_user_id FOR UPDATE;

  v_new_balance := COALESCE(v_current_balance, 0) + p_tokens;

  UPDATE user_tokens SET
    tokens_remaining = v_new_balance,
    total_tokens_purchased = total_tokens_purchased + 
      (CASE WHEN p_transaction_type = 'purchase' THEN p_tokens ELSE 0 END),
    total_tokens_from_bonuses = total_tokens_from_bonuses + 
      (CASE WHEN p_transaction_type = 'bonus_from_credits' THEN p_tokens ELSE 0 END),
    updated_at = NOW()
  WHERE user_id = p_user_id;

  INSERT INTO token_transactions (user_id, amount, transaction_type, balance_before, balance_after, notes)
  VALUES (p_user_id, p_tokens, p_transaction_type, COALESCE(v_current_balance, 0), v_new_balance, p_notes)
  RETURNING id INTO v_transaction_id;

  RETURN QUERY SELECT v_new_balance, v_transaction_id;
END;
$$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON user_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_token_purchases_session_id ON token_purchases(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_token_purchases_status ON token_purchases(status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON processed_webhook_events(event_id);
