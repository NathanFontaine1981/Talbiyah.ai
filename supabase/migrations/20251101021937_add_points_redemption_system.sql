/*
  # Points Redemption System

  1. New Tables
    - `credit_redemptions`
      - `id` (uuid, primary key) - Unique identifier
      - `learner_id` (uuid, foreign key) - Learner who redeemed
      - `points_redeemed` (integer) - Number of points spent
      - `credits_earned` (numeric) - Free hours earned
      - `created_at` (timestamptz) - When redemption occurred

  2. New Functions
    - `redeem_points_for_credits` - Converts points to learning credits
      - Validates sufficient points
      - Deducts points from learner
      - Adds learning credits
      - Records transaction in credit_redemptions table
      - Atomic transaction ensuring data consistency

  3. Security
    - Enable RLS on `credit_redemptions` table
    - Users can read their own redemption history
    - Only authenticated users can redeem points through the function

  4. Notes
    - Default conversion: 1000 points = 1 free lesson hour
    - Points are deducted atomically with credits added
    - All redemptions are logged for transparency
    - Redemption history helps users track their rewards
*/

-- Create credit redemptions tracking table
CREATE TABLE IF NOT EXISTS credit_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id uuid NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  points_redeemed integer NOT NULL CHECK (points_redeemed > 0),
  credits_earned numeric(10, 2) NOT NULL CHECK (credits_earned > 0),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE credit_redemptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own redemption history
CREATE POLICY "Users can read own redemption history"
  ON credit_redemptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM learners
      WHERE learners.id = credit_redemptions.learner_id
      AND learners.parent_id = auth.uid()
    )
  );

-- Policy: System can insert redemption records
CREATE POLICY "System can insert redemption records"
  ON credit_redemptions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM learners
      WHERE learners.id = credit_redemptions.learner_id
      AND learners.parent_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_credit_redemptions_learner_id ON credit_redemptions(learner_id);
CREATE INDEX IF NOT EXISTS idx_credit_redemptions_created_at ON credit_redemptions(created_at);

-- Function to redeem points for learning credits
CREATE OR REPLACE FUNCTION redeem_points_for_credits(
  learner_id_param uuid,
  points_to_redeem integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_points integer;
  credits_to_add numeric;
BEGIN
  -- Get current points
  SELECT total_xp INTO current_points
  FROM learners
  WHERE id = learner_id_param;

  -- Validate learner exists
  IF current_points IS NULL THEN
    RAISE EXCEPTION 'Learner not found';
  END IF;

  -- Validate sufficient points
  IF current_points < points_to_redeem THEN
    RAISE EXCEPTION 'Insufficient points. You have % points but need %', current_points, points_to_redeem;
  END IF;

  -- Calculate credits (1000 points = 1 hour)
  credits_to_add := points_to_redeem / 1000.0;

  -- Update learner: deduct points and add credits
  UPDATE learners
  SET
    total_xp = total_xp - points_to_redeem,
    learning_credits = COALESCE(learning_credits, 0) + credits_to_add
  WHERE id = learner_id_param;

  -- Record the redemption
  INSERT INTO credit_redemptions (learner_id, points_redeemed, credits_earned)
  VALUES (learner_id_param, points_to_redeem, credits_to_add);

END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION redeem_points_for_credits TO authenticated;