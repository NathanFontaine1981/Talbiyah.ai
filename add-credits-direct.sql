-- Get the most recent profile (assuming it's you who just purchased)
DO $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_credits INTEGER := 8; -- Standard pack
BEGIN
  -- Find the most recent user (you)
  SELECT id, email INTO v_user_id, v_user_email
  FROM auth.users
  ORDER BY created_at DESC
  LIMIT 1;

  RAISE NOTICE 'Adding % credits to user: % (%)', v_credits, v_user_email, v_user_id;

  -- Insert or update user_credits
  INSERT INTO user_credits (user_id, credits_remaining, total_credits_purchased, created_at, updated_at)
  VALUES (v_user_id, v_credits, v_credits, NOW(), NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    credits_remaining = user_credits.credits_remaining + v_credits,
    total_credits_purchased = user_credits.total_credits_purchased + v_credits,
    updated_at = NOW();

  -- Log transaction
  INSERT INTO credit_transactions (
    user_id,
    transaction_type,
    credits_change,
    credits_after,
    notes,
    created_at
  )
  SELECT
    v_user_id,
    'purchase',
    v_credits,
    credits_remaining,
    'Manual credit addition - Stripe webhook not processing',
    NOW()
  FROM user_credits
  WHERE user_id = v_user_id;

  RAISE NOTICE 'Credits added successfully!';
END $$;

-- Verify
SELECT
  p.email,
  uc.credits_remaining,
  uc.total_credits_purchased,
  uc.updated_at
FROM user_credits uc
JOIN profiles p ON p.id = uc.user_id
ORDER BY uc.updated_at DESC
LIMIT 5;
