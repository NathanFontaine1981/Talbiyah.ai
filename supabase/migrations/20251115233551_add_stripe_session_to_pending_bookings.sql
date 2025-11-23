-- Add stripe_session_id column to pending_bookings table
-- This column stores the Stripe checkout session ID to link payments to bookings

ALTER TABLE pending_bookings
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;

-- Add index for faster lookups by stripe_session_id
CREATE INDEX IF NOT EXISTS idx_pending_bookings_stripe_session
ON pending_bookings(stripe_session_id);

-- Add comment explaining the column
COMMENT ON COLUMN pending_bookings.stripe_session_id IS 'Stripe checkout session ID for linking payments to pending bookings';
