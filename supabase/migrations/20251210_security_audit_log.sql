-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- SECURITY AUDIT LOG TABLE
-- Tracks security-relevant events for monitoring and incident response
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event identification
  event_type TEXT NOT NULL CHECK (event_type IN (
    'auth_login_success',
    'auth_login_failed',
    'auth_logout',
    'auth_password_reset_request',
    'auth_password_changed',
    'auth_email_changed',
    'auth_account_locked',
    'auth_account_unlocked',
    'payment_initiated',
    'payment_completed',
    'payment_failed',
    'booking_created',
    'booking_cancelled',
    'admin_action',
    'rate_limit_exceeded',
    'csrf_blocked',
    'signature_invalid',
    'suspicious_activity'
  )),

  -- Actor information
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address TEXT,
  user_agent TEXT,

  -- Event details
  resource_type TEXT, -- e.g., 'lesson', 'payment', 'profile'
  resource_id TEXT,   -- ID of affected resource
  action TEXT,        -- e.g., 'create', 'update', 'delete'
  details JSONB,      -- Additional event-specific data

  -- Security classification
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_security_audit_log_event_type ON security_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_ip_address ON security_audit_log(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_severity ON security_audit_log(severity);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at ON security_audit_log(created_at DESC);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_event ON security_audit_log(user_id, event_type, created_at DESC);

-- Enable RLS - only service role and admins can access
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can read security logs
CREATE POLICY "Admins can view security logs"
ON security_audit_log
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND 'admin' = ANY(profiles.roles)
  )
);

-- No INSERT/UPDATE/DELETE policies for authenticated users
-- Only service_role can write to this table

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- FAILED LOGIN ATTEMPTS TABLE
-- Tracks failed logins for account lockout functionality
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS failed_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  attempt_time TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_failed_login_email ON failed_login_attempts(email, attempt_time DESC);
CREATE INDEX IF NOT EXISTS idx_failed_login_ip ON failed_login_attempts(ip_address, attempt_time DESC);

-- Enable RLS - only service role can access
ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;

-- No policies for authenticated users - service_role only

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ACCOUNT LOCKOUTS TABLE
-- Tracks locked accounts
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS account_lockouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  locked_at TIMESTAMPTZ DEFAULT NOW(),
  unlock_at TIMESTAMPTZ NOT NULL,
  reason TEXT DEFAULT 'too_many_failed_attempts',
  failed_attempts INTEGER DEFAULT 0
);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_account_lockouts_email ON account_lockouts(email);
CREATE INDEX IF NOT EXISTS idx_account_lockouts_unlock_at ON account_lockouts(unlock_at);

-- Enable RLS - only service role can access
ALTER TABLE account_lockouts ENABLE ROW LEVEL SECURITY;

-- No policies for authenticated users - service_role only

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- HELPER FUNCTIONS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  p_event_type TEXT,
  p_user_id UUID DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id TEXT DEFAULT NULL,
  p_action TEXT DEFAULT NULL,
  p_details JSONB DEFAULT NULL,
  p_severity TEXT DEFAULT 'info'
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO security_audit_log (
    event_type,
    user_id,
    ip_address,
    user_agent,
    resource_type,
    resource_id,
    action,
    details,
    severity
  ) VALUES (
    p_event_type,
    p_user_id,
    p_ip_address,
    p_user_agent,
    p_resource_type,
    p_resource_id,
    p_action,
    p_details,
    p_severity
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if account is locked
CREATE OR REPLACE FUNCTION is_account_locked(p_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM account_lockouts
    WHERE email = LOWER(p_email)
    AND unlock_at > NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record failed login and check for lockout
CREATE OR REPLACE FUNCTION record_failed_login(
  p_email TEXT,
  p_ip_address TEXT,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS TABLE(should_lock BOOLEAN, attempts_count INTEGER) AS $$
DECLARE
  v_attempts INTEGER;
  v_lockout_threshold INTEGER := 5;
  v_lockout_window_minutes INTEGER := 15;
  v_lockout_duration_minutes INTEGER := 30;
BEGIN
  -- Record the failed attempt
  INSERT INTO failed_login_attempts (email, ip_address, user_agent)
  VALUES (LOWER(p_email), p_ip_address, p_user_agent);

  -- Count recent failed attempts
  SELECT COUNT(*) INTO v_attempts
  FROM failed_login_attempts
  WHERE email = LOWER(p_email)
  AND attempt_time > NOW() - (v_lockout_window_minutes || ' minutes')::INTERVAL;

  -- Check if threshold exceeded
  IF v_attempts >= v_lockout_threshold THEN
    -- Lock the account
    INSERT INTO account_lockouts (email, unlock_at, failed_attempts)
    VALUES (
      LOWER(p_email),
      NOW() + (v_lockout_duration_minutes || ' minutes')::INTERVAL,
      v_attempts
    )
    ON CONFLICT (email) DO UPDATE
    SET
      locked_at = NOW(),
      unlock_at = NOW() + (v_lockout_duration_minutes || ' minutes')::INTERVAL,
      failed_attempts = v_attempts;

    -- Log the lockout
    PERFORM log_security_event(
      'auth_account_locked',
      NULL,
      p_ip_address,
      p_user_agent,
      'account',
      p_email,
      'lock',
      jsonb_build_object('failed_attempts', v_attempts, 'lockout_minutes', v_lockout_duration_minutes),
      'warning'
    );

    RETURN QUERY SELECT TRUE, v_attempts;
  ELSE
    RETURN QUERY SELECT FALSE, v_attempts;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clear failed attempts on successful login
CREATE OR REPLACE FUNCTION clear_failed_attempts(p_email TEXT)
RETURNS VOID AS $$
BEGIN
  -- Remove failed attempts
  DELETE FROM failed_login_attempts
  WHERE email = LOWER(p_email);

  -- Remove lockout if exists
  DELETE FROM account_lockouts
  WHERE email = LOWER(p_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old records (run periodically)
CREATE OR REPLACE FUNCTION cleanup_security_records()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
  temp_count INTEGER;
BEGIN
  -- Delete failed attempts older than 24 hours
  DELETE FROM failed_login_attempts
  WHERE attempt_time < NOW() - INTERVAL '24 hours';
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;

  -- Delete expired lockouts
  DELETE FROM account_lockouts
  WHERE unlock_at < NOW();
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;

  -- Delete old audit logs (keep 90 days)
  DELETE FROM security_audit_log
  WHERE created_at < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to service role
GRANT EXECUTE ON FUNCTION log_security_event TO service_role;
GRANT EXECUTE ON FUNCTION is_account_locked TO service_role;
GRANT EXECUTE ON FUNCTION record_failed_login TO service_role;
GRANT EXECUTE ON FUNCTION clear_failed_attempts TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_security_records TO service_role;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- MIGRATION COMPLETE
-- ✅ Created security_audit_log table
-- ✅ Created failed_login_attempts table
-- ✅ Created account_lockouts table
-- ✅ Created helper functions for logging and lockout
-- ✅ Set up proper RLS policies (admin read-only, service_role write)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
