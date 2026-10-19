-- Create promo_codes table for managing promotional codes
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'free_lesson')),
  discount_value DECIMAL(10, 2) NOT NULL DEFAULT 0, -- Percentage (0-100) or fixed amount in GBP
  max_uses INTEGER, -- NULL means unlimited
  current_uses INTEGER DEFAULT 0,
  first_lesson_only BOOLEAN DEFAULT FALSE,
  min_cart_value DECIMAL(10, 2) DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Track promo code usage per user
CREATE TABLE IF NOT EXISTS promo_code_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  discount_applied DECIMAL(10, 2) NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(promo_code_id, user_id, lesson_id) -- Prevent duplicate usage for same lesson
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_code_usage_user ON promo_code_usage(user_id);

-- Enable RLS
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_usage ENABLE ROW LEVEL SECURITY;

-- Policies: Admins can manage promo codes, everyone can read active ones
CREATE POLICY "Anyone can read active promo codes"
  ON promo_codes FOR SELECT
  TO authenticated
  USING (is_active = true AND (valid_until IS NULL OR valid_until > NOW()));

CREATE POLICY "Admins can manage promo codes"
  ON promo_codes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND 'admin' = ANY(p.roles)
    )
  );

-- Users can view their own usage
CREATE POLICY "Users can view their promo usage"
  ON promo_code_usage FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage promo usage"
  ON promo_code_usage FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND 'admin' = ANY(p.roles)
    )
  );

-- Insert default promo codes (the existing ones)
INSERT INTO promo_codes (code, description, discount_type, discount_value, first_lesson_only, is_active)
VALUES
  ('100HONOR', 'First lesson free - Honor code', 'free_lesson', 100, true, true),
  ('100OWNER', 'First lesson free - Owner code', 'free_lesson', 100, true, true)
ON CONFLICT (code) DO NOTHING;

-- Function to validate and apply promo code
CREATE OR REPLACE FUNCTION validate_promo_code(
  p_code VARCHAR,
  p_user_id UUID,
  p_cart_value DECIMAL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_promo promo_codes%ROWTYPE;
  v_user_uses INTEGER;
  v_completed_lessons INTEGER;
  v_discount DECIMAL;
  v_result JSON;
BEGIN
  -- Find the promo code
  SELECT * INTO v_promo
  FROM promo_codes
  WHERE UPPER(code) = UPPER(p_code)
  AND is_active = true
  AND (valid_from IS NULL OR valid_from <= NOW())
  AND (valid_until IS NULL OR valid_until > NOW());

  IF NOT FOUND THEN
    RETURN json_build_object('valid', false, 'error', 'Invalid or expired promo code');
  END IF;

  -- Check max uses
  IF v_promo.max_uses IS NOT NULL AND v_promo.current_uses >= v_promo.max_uses THEN
    RETURN json_build_object('valid', false, 'error', 'This promo code has reached its usage limit');
  END IF;

  -- Check if user already used this code
  SELECT COUNT(*) INTO v_user_uses
  FROM promo_code_usage
  WHERE promo_code_id = v_promo.id AND user_id = p_user_id;

  IF v_user_uses > 0 THEN
    RETURN json_build_object('valid', false, 'error', 'You have already used this promo code');
  END IF;

  -- Check first lesson only restriction
  IF v_promo.first_lesson_only THEN
    SELECT COUNT(*) INTO v_completed_lessons
    FROM lessons l
    JOIN learners lr ON l.learner_id = lr.id
    WHERE lr.parent_id = p_user_id
    AND l.status = 'completed';

    IF v_completed_lessons > 0 THEN
      RETURN json_build_object('valid', false, 'error', 'This promo code is only valid for your first lesson');
    END IF;
  END IF;

  -- Check minimum cart value
  IF p_cart_value < v_promo.min_cart_value THEN
    RETURN json_build_object('valid', false, 'error', 'Cart value is below minimum required: £' || v_promo.min_cart_value);
  END IF;

  -- Calculate discount
  CASE v_promo.discount_type
    WHEN 'percentage' THEN
      v_discount := p_cart_value * (v_promo.discount_value / 100);
    WHEN 'fixed' THEN
      v_discount := LEAST(v_promo.discount_value, p_cart_value);
    WHEN 'free_lesson' THEN
      v_discount := p_cart_value;
  END CASE;

  RETURN json_build_object(
    'valid', true,
    'promo_code_id', v_promo.id,
    'code', v_promo.code,
    'discount_type', v_promo.discount_type,
    'discount_value', v_promo.discount_value,
    'discount_amount', v_discount,
    'description', v_promo.description
  );
END;
$$;

-- Function to record promo code usage
CREATE OR REPLACE FUNCTION use_promo_code(
  p_promo_code_id UUID,
  p_user_id UUID,
  p_lesson_id UUID,
  p_discount_applied DECIMAL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Record usage
  INSERT INTO promo_code_usage (promo_code_id, user_id, lesson_id, discount_applied)
  VALUES (p_promo_code_id, p_user_id, p_lesson_id, p_discount_applied);

  -- Increment usage counter
  UPDATE promo_codes
  SET current_uses = current_uses + 1
  WHERE id = p_promo_code_id;

  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;
