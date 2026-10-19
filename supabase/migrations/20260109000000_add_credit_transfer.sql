-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ADD CREDIT TRANSFER SYSTEM
-- Allows users to transfer credits to other users after 7-day refund window
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Credit transfers tracking table
CREATE TABLE IF NOT EXISTS credit_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  to_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  credits_amount NUMERIC(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure you can't transfer to yourself
  CONSTRAINT no_self_transfer CHECK (from_user_id != to_user_id),
  -- Ensure positive amount
  CONSTRAINT positive_transfer CHECK (credits_amount > 0)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_credit_transfers_from_user ON credit_transfers(from_user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transfers_to_user ON credit_transfers(to_user_id);

-- Row Level Security
ALTER TABLE credit_transfers ENABLE ROW LEVEL SECURITY;

-- Users can view transfers they sent or received
CREATE POLICY "Users can view own transfers"
  ON credit_transfers FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Function to check if user has transferable credits
-- Credits are transferable if they are past the 7-day refund window
CREATE OR REPLACE FUNCTION get_transferable_credits(p_user_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_total_credits NUMERIC;
  v_non_transferable NUMERIC;
BEGIN
  -- Get total credits
  SELECT COALESCE(credits_remaining, 0) INTO v_total_credits
  FROM user_credits
  WHERE user_id = p_user_id;

  -- Calculate credits still within 7-day refund window
  -- These are from recent purchases that could still be refunded
  SELECT COALESCE(SUM(credits_added), 0) INTO v_non_transferable
  FROM credit_purchases
  WHERE user_id = p_user_id
    AND refund_deadline > NOW()
    AND refunded = FALSE;

  -- Return transferable credits (total minus non-transferable)
  RETURN GREATEST(0, v_total_credits - v_non_transferable);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to transfer credits between users
CREATE OR REPLACE FUNCTION transfer_credits(
  p_from_user_id UUID,
  p_to_user_id UUID,
  p_credits NUMERIC,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_from_balance NUMERIC;
  v_to_balance NUMERIC;
  v_transferable NUMERIC;
  v_transfer_id UUID;
  v_to_user_name TEXT;
BEGIN
  -- Validate: Can't transfer to self
  IF p_from_user_id = p_to_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Cannot transfer credits to yourself');
  END IF;

  -- Validate: Positive amount
  IF p_credits <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Transfer amount must be positive');
  END IF;

  -- Check if recipient exists
  SELECT full_name INTO v_to_user_name
  FROM profiles
  WHERE id = p_to_user_id;

  IF v_to_user_name IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Recipient not found');
  END IF;

  -- Get transferable credits (past 7-day window)
  v_transferable := get_transferable_credits(p_from_user_id);

  IF v_transferable < p_credits THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Insufficient transferable credits. You have ' || v_transferable || ' transferable credits. Credits purchased within the last 7 days cannot be transferred.'
    );
  END IF;

  -- Deduct from sender
  UPDATE user_credits
  SET
    credits_remaining = credits_remaining - p_credits,
    updated_at = NOW()
  WHERE user_id = p_from_user_id
  RETURNING credits_remaining INTO v_from_balance;

  -- Add to recipient (create record if doesn't exist)
  INSERT INTO user_credits (user_id, credits_remaining, total_credits_purchased)
  VALUES (p_to_user_id, p_credits, 0)
  ON CONFLICT (user_id)
  DO UPDATE SET
    credits_remaining = user_credits.credits_remaining + p_credits,
    updated_at = NOW()
  RETURNING credits_remaining INTO v_to_balance;

  -- Create transfer record
  INSERT INTO credit_transfers (from_user_id, to_user_id, credits_amount, notes)
  VALUES (p_from_user_id, p_to_user_id, p_credits, p_notes)
  RETURNING id INTO v_transfer_id;

  -- Log transaction for sender (deduct)
  INSERT INTO credit_transactions (
    user_id,
    transaction_type,
    credits_change,
    credits_after,
    notes
  ) VALUES (
    p_from_user_id,
    'transfer_out',
    -p_credits,
    v_from_balance,
    'Transferred to ' || v_to_user_name || COALESCE(': ' || p_notes, '')
  );

  -- Log transaction for recipient (add)
  INSERT INTO credit_transactions (
    user_id,
    transaction_type,
    credits_change,
    credits_after,
    notes
  ) VALUES (
    p_to_user_id,
    'transfer_in',
    p_credits,
    v_to_balance,
    'Received from transfer' || COALESCE(': ' || p_notes, '')
  );

  RETURN json_build_object(
    'success', true,
    'transfer_id', v_transfer_id,
    'credits_transferred', p_credits,
    'new_balance', v_from_balance,
    'recipient_name', v_to_user_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- MIGRATION COMPLETE
-- ✅ Created credit_transfers table
-- ✅ Added get_transferable_credits function (respects 7-day window)
-- ✅ Added transfer_credits function with validation
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
