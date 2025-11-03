/*
  # Create Shopping Cart Table

  1. New Tables
    - `cart_items`
      - `id` (uuid, primary key) - Unique identifier for each cart item
      - `user_id` (uuid, foreign key) - Links to profiles.id (the student/parent)
      - `teacher_id` (uuid, foreign key) - Links to teacher_profiles.id
      - `subject_id` (uuid, foreign key) - Links to subjects.id
      - `scheduled_time` (timestamptz) - Desired lesson date/time with timezone
      - `duration_minutes` (integer) - Lesson duration (30 or 60 minutes)
      - `price` (numeric) - Price for this specific item (£7.50 or £15.00)
      - `created_at` (timestamptz) - When item was added to cart
      - `expires_at` (timestamptz) - Cart item expiration (15 minutes hold)

  2. Security
    - Enable RLS on `cart_items` table
    - Users can only read, insert, update, and delete their own cart items
    - Admin users can manage all cart items

  3. Notes
    - Cart items expire after 15 minutes to prevent indefinite slot blocking
    - Price is stored to lock in the rate at time of adding to cart
    - Upon checkout, cart items are converted to lessons and cleared
*/

-- Create the cart_items table
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
  scheduled_time timestamptz NOT NULL,
  duration_minutes integer NOT NULL CHECK (duration_minutes IN (30, 60)),
  price numeric(10, 2) NOT NULL CHECK (price > 0),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + INTERVAL '15 minutes')
);

-- Enable Row Level Security
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own cart items
CREATE POLICY "Users can read own cart items"
  ON cart_items
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Users can insert their own cart items
CREATE POLICY "Users can insert own cart items"
  ON cart_items
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own cart items
CREATE POLICY "Users can update own cart items"
  ON cart_items
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can delete their own cart items
CREATE POLICY "Users can delete own cart items"
  ON cart_items
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Admin users can read all cart items
CREATE POLICY "Admin users can read all cart items"
  ON cart_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- Policy: Admin users can delete all cart items
CREATE POLICY "Admin users can delete all cart items"
  ON cart_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_teacher_id ON cart_items(teacher_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_expires_at ON cart_items(expires_at);
CREATE INDEX IF NOT EXISTS idx_cart_items_scheduled_time ON cart_items(scheduled_time);

-- Create composite index for conflict detection (same teacher + time)
CREATE INDEX IF NOT EXISTS idx_cart_teacher_time ON cart_items(teacher_id, scheduled_time);

-- Function to clean up expired cart items
CREATE OR REPLACE FUNCTION cleanup_expired_cart_items()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM cart_items
  WHERE expires_at < now();
END;
$$;

-- Note: In production, set up a cron job or scheduled function to call cleanup_expired_cart_items()
-- For now, expired items will be filtered in queries
