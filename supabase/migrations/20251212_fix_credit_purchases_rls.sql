/*
  # Fix credit_purchases RLS policies

  1. Changes
    - Add RLS policy for users to read their own credit purchases
    - Add policy for service role to insert records (via webhook)

  2. Security
    - Users can only read their own purchases
    - Insert restricted to service role (webhook)
*/

-- Enable RLS if not already enabled
ALTER TABLE credit_purchases ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read own credit purchases" ON credit_purchases;
DROP POLICY IF EXISTS "Service role can manage credit purchases" ON credit_purchases;

-- Users can read their own purchases
CREATE POLICY "Users can read own credit purchases"
  ON credit_purchases
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Admin users can manage all purchases
CREATE POLICY "Admin users can manage credit purchases"
  ON credit_purchases
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND 'admin' = ANY(profiles.roles)
    )
  );
