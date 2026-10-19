-- Create table for webhook idempotency (prevent duplicate processing)
CREATE TABLE IF NOT EXISTS processed_webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookups by event_id
CREATE INDEX IF NOT EXISTS idx_processed_webhook_events_event_id ON processed_webhook_events(event_id);

-- Index for cleanup queries (delete old events)
CREATE INDEX IF NOT EXISTS idx_processed_webhook_events_processed_at ON processed_webhook_events(processed_at);

-- Enable RLS
ALTER TABLE processed_webhook_events ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table (webhooks use service role)
CREATE POLICY "Service role full access" ON processed_webhook_events
  FOR ALL
  USING (auth.role() = 'service_role');

-- Add comment explaining table purpose
COMMENT ON TABLE processed_webhook_events IS 'Tracks processed webhook events to prevent duplicate processing (idempotency)';

-- Create function to clean up old events (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_webhook_events()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM processed_webhook_events
  WHERE processed_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Grant execute to service role
GRANT EXECUTE ON FUNCTION cleanup_old_webhook_events() TO service_role;
