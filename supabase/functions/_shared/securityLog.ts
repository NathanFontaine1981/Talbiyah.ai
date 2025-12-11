// Security Logging Utility for Edge Functions
// Logs security-relevant events to the database

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getClientIP } from './rateLimit.ts'

export type SecurityEventType =
  | 'auth_login_success'
  | 'auth_login_failed'
  | 'auth_logout'
  | 'auth_password_reset_request'
  | 'auth_password_changed'
  | 'auth_email_changed'
  | 'auth_account_locked'
  | 'auth_account_unlocked'
  | 'payment_initiated'
  | 'payment_completed'
  | 'payment_failed'
  | 'booking_created'
  | 'booking_cancelled'
  | 'admin_action'
  | 'rate_limit_exceeded'
  | 'csrf_blocked'
  | 'signature_invalid'
  | 'suspicious_activity';

export type SecuritySeverity = 'info' | 'warning' | 'error' | 'critical';

export interface SecurityLogParams {
  eventType: SecurityEventType;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  resourceType?: string;
  resourceId?: string;
  action?: string;
  details?: Record<string, unknown>;
  severity?: SecuritySeverity;
}

/**
 * Log a security event to the database
 */
export async function logSecurityEvent(
  supabase: SupabaseClient,
  params: SecurityLogParams
): Promise<void> {
  try {
    const { error } = await supabase.rpc('log_security_event', {
      p_event_type: params.eventType,
      p_user_id: params.userId || null,
      p_ip_address: params.ipAddress || null,
      p_user_agent: params.userAgent || null,
      p_resource_type: params.resourceType || null,
      p_resource_id: params.resourceId || null,
      p_action: params.action || null,
      p_details: params.details || null,
      p_severity: params.severity || 'info',
    });

    if (error) {
      // Don't throw - just log to console as fallback
      console.error('Failed to log security event:', error.message);
    }
  } catch (err) {
    // Fail silently - logging should never break the main flow
    console.error('Security logging error:', err);
  }
}

/**
 * Log a security event from a request context
 * Automatically extracts IP and user agent
 */
export async function logSecurityEventFromRequest(
  supabase: SupabaseClient,
  req: Request,
  params: Omit<SecurityLogParams, 'ipAddress' | 'userAgent'>
): Promise<void> {
  const ipAddress = getClientIP(req);
  const userAgent = req.headers.get('user-agent') || undefined;

  await logSecurityEvent(supabase, {
    ...params,
    ipAddress,
    userAgent,
  });
}

/**
 * Check if an account is locked
 */
export async function checkAccountLocked(
  supabase: SupabaseClient,
  email: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('is_account_locked', {
      p_email: email.toLowerCase(),
    });

    if (error) {
      console.error('Failed to check account lock status:', error.message);
      return false; // Fail open - don't block if check fails
    }

    return data === true;
  } catch (err) {
    console.error('Account lock check error:', err);
    return false;
  }
}

/**
 * Record a failed login attempt
 * Returns true if account should be locked
 */
export async function recordFailedLogin(
  supabase: SupabaseClient,
  email: string,
  ipAddress: string,
  userAgent?: string
): Promise<{ shouldLock: boolean; attemptsCount: number }> {
  try {
    const { data, error } = await supabase.rpc('record_failed_login', {
      p_email: email.toLowerCase(),
      p_ip_address: ipAddress,
      p_user_agent: userAgent || null,
    });

    if (error) {
      console.error('Failed to record failed login:', error.message);
      return { shouldLock: false, attemptsCount: 0 };
    }

    if (data && data.length > 0) {
      return {
        shouldLock: data[0].should_lock,
        attemptsCount: data[0].attempts_count,
      };
    }

    return { shouldLock: false, attemptsCount: 0 };
  } catch (err) {
    console.error('Record failed login error:', err);
    return { shouldLock: false, attemptsCount: 0 };
  }
}

/**
 * Clear failed login attempts (call on successful login)
 */
export async function clearFailedAttempts(
  supabase: SupabaseClient,
  email: string
): Promise<void> {
  try {
    const { error } = await supabase.rpc('clear_failed_attempts', {
      p_email: email.toLowerCase(),
    });

    if (error) {
      console.error('Failed to clear failed attempts:', error.message);
    }
  } catch (err) {
    console.error('Clear failed attempts error:', err);
  }
}

/**
 * Log rate limit exceeded event
 */
export async function logRateLimitExceeded(
  supabase: SupabaseClient,
  req: Request,
  endpoint: string,
  userId?: string
): Promise<void> {
  await logSecurityEventFromRequest(supabase, req, {
    eventType: 'rate_limit_exceeded',
    userId,
    resourceType: 'endpoint',
    resourceId: endpoint,
    action: 'blocked',
    severity: 'warning',
  });
}

/**
 * Log CSRF validation failure
 */
export async function logCSRFBlocked(
  supabase: SupabaseClient,
  req: Request,
  reason: string
): Promise<void> {
  await logSecurityEventFromRequest(supabase, req, {
    eventType: 'csrf_blocked',
    resourceType: 'request',
    action: 'blocked',
    details: { reason },
    severity: 'warning',
  });
}

/**
 * Log payment event
 */
export async function logPaymentEvent(
  supabase: SupabaseClient,
  req: Request,
  eventType: 'payment_initiated' | 'payment_completed' | 'payment_failed',
  userId: string,
  paymentId?: string,
  amount?: number,
  details?: Record<string, unknown>
): Promise<void> {
  await logSecurityEventFromRequest(supabase, req, {
    eventType,
    userId,
    resourceType: 'payment',
    resourceId: paymentId,
    action: eventType.replace('payment_', ''),
    details: { amount, ...details },
    severity: eventType === 'payment_failed' ? 'warning' : 'info',
  });
}
