/*
  # Fix credit_transactions RLS policies

  1. Changes
    - Enable RLS on credit_transactions table
    - Add policy for users to read their own transactions
    - Add policy for admin users to manage all transactions

  2. Security
    - Users can only read their own credit transactions
    - Admin users have full access
*/

-- Enable RLS if not already enabled
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read own credit transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Admin users can manage credit transactions" ON credit_transactions;

-- Users can read their own transactions
CREATE POLICY "Users can read own credit transactions"
  ON credit_transactions
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Admin users can manage all transactions
CREATE POLICY "Admin users can manage credit transactions"
  ON credit_transactions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND 'admin' = ANY(profiles.roles)
    )
  );
