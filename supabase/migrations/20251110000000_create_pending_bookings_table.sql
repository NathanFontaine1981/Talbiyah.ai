-- Create pending_bookings table to store checkout sessions before payment
CREATE TABLE IF NOT EXISTS pending_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_data JSONB NOT NULL,
  total_amount INTEGER NOT NULL,
  session_count INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'expired', 'cancelled')),
  stripe_session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '1 hour')
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pending_bookings_user_id ON pending_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_bookings_stripe_session_id ON pending_bookings(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_pending_bookings_status ON pending_bookings(status);
CREATE INDEX IF NOT EXISTS idx_pending_bookings_expires_at ON pending_bookings(expires_at);

-- Enable RLS
ALTER TABLE pending_bookings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own pending bookings
CREATE POLICY "Users can view own pending bookings"
ON pending_bookings
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy: Allow authenticated users to insert pending bookings (service role will bypass this)
CREATE POLICY "Allow authenticated insert pending bookings"
ON pending_bookings
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: System can update pending bookings (for webhook)
CREATE POLICY "Service role can update pending bookings"
ON pending_bookings
FOR UPDATE
TO authenticated
USING (true);

-- Policy: Admin can view all pending bookings
CREATE POLICY "Admin can view all pending bookings"
ON pending_bookings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND 'admin' = ANY(profiles.roles)
  )
);

-- Create trigger to update updated_at
DROP TRIGGER IF EXISTS update_pending_bookings_updated_at ON pending_bookings;
CREATE TRIGGER update_pending_bookings_updated_at
  BEFORE UPDATE ON pending_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to cleanup expired pending bookings
CREATE OR REPLACE FUNCTION cleanup_expired_pending_bookings()
RETURNS void AS $$
BEGIN
  UPDATE pending_bookings
  SET status = 'expired'
  WHERE status = 'pending'
  AND expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Comment on table
COMMENT ON TABLE pending_bookings IS 'Temporary storage for bookings awaiting payment confirmation';
COMMENT ON COLUMN pending_bookings.booking_data IS 'JSON array of booking details from cart';
COMMENT ON COLUMN pending_bookings.total_amount IS 'Total amount in pence for all bookings';
COMMENT ON COLUMN pending_bookings.stripe_session_id IS 'Stripe checkout session ID';
COMMENT ON COLUMN pending_bookings.expires_at IS 'When this pending booking expires (1 hour after creation)';
