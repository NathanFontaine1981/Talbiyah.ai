CREATE TABLE IF NOT EXISTS pending_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_data JSONB NOT NULL,
  total_amount INTEGER NOT NULL,
  session_count INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  stripe_session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pending_bookings_user_id ON pending_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_bookings_stripe_session_id ON pending_bookings(stripe_session_id);

ALTER TABLE pending_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pending bookings" ON pending_bookings FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own pending bookings" ON pending_bookings FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Service role can update pending bookings" ON pending_bookings FOR UPDATE TO authenticated USING (true);
