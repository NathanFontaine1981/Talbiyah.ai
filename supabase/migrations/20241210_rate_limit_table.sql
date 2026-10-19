-- Create rate limit tracking table
-- This provides persistent rate limiting that survives Edge Function cold starts

CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,  -- IP address or user ID
  endpoint TEXT NOT NULL,    -- Which endpoint/action
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint for upsert operations
  UNIQUE(identifier, endpoint)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup
ON rate_limits(identifier, endpoint, window_start);

-- Index for cleanup operations
CREATE INDEX IF NOT EXISTS idx_rate_limits_cleanup
ON rate_limits(window_start);

-- Enable RLS
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table
CREATE POLICY "Service role only" ON rate_limits
  FOR ALL
  USING (auth.role() = 'service_role');

-- Function to check and increment rate limit
-- Returns true if request is allowed, false if rate limited
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier TEXT,
  p_endpoint TEXT,
  p_max_requests INTEGER,
  p_window_minutes INTEGER
)
RETURNS TABLE(
  allowed BOOLEAN,
  current_count INTEGER,
  reset_at TIMESTAMPTZ
) AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_current_count INTEGER;
  v_reset_at TIMESTAMPTZ;
BEGIN
  -- Calculate window start time
  v_window_start := NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  v_reset_at := NOW() + (p_window_minutes || ' minutes')::INTERVAL;

  -- Try to insert or update the rate limit record
  INSERT INTO rate_limits (identifier, endpoint, request_count, window_start, updated_at)
  VALUES (p_identifier, p_endpoint, 1, NOW(), NOW())
  ON CONFLICT (identifier, endpoint) DO UPDATE
  SET
    request_count = CASE
      WHEN rate_limits.window_start < v_window_start THEN 1  -- Reset if window expired
      ELSE rate_limits.request_count + 1
    END,
    window_start = CASE
      WHEN rate_limits.window_start < v_window_start THEN NOW()
      ELSE rate_limits.window_start
    END,
    updated_at = NOW()
  RETURNING request_count, window_start + (p_window_minutes || ' minutes')::INTERVAL
  INTO v_current_count, v_reset_at;

  -- Return result
  RETURN QUERY SELECT
    v_current_count <= p_max_requests,
    v_current_count,
    v_reset_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old rate limit records (run periodically)
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM rate_limits
  WHERE window_start < NOW() - INTERVAL '2 hours'
  RETURNING COUNT(*) INTO deleted_count;

  RETURN COALESCE(deleted_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to service role
GRANT EXECUTE ON FUNCTION check_rate_limit TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_rate_limits TO service_role;
