// Rate limiting utility for Edge Functions
// Supports both in-memory (fast but resets) and database-backed (persistent) modes

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (fallback)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
function cleanupExpired() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup every 60 seconds
setInterval(cleanupExpired, 60000);

export interface RateLimitConfig {
  maxRequests: number;      // Max requests allowed
  windowMs: number;         // Time window in milliseconds
  keyPrefix?: string;       // Optional prefix for the key
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;      // Seconds until reset (only if blocked)
}

/**
 * Check if a request should be rate limited (in-memory version - fast but resets on cold start)
 * @param identifier - Usually IP address or user ID
 * @param config - Rate limit configuration
 * @returns RateLimitResult
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const { maxRequests, windowMs, keyPrefix = '' } = config;
  const key = `${keyPrefix}:${identifier}`;
  const now = Date.now();

  let entry = rateLimitStore.get(key);

  // If no entry or window expired, create new entry
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 1,
      resetTime: now + windowMs
    };
    rateLimitStore.set(key, entry);

    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: entry.resetTime
    };
  }

  // Increment counter
  entry.count++;

  // Check if limit exceeded
  if (entry.count > maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter
    };
  }

  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetTime: entry.resetTime
  };
}

/**
 * Check if a request should be rate limited (database version - persistent across cold starts)
 * Use this for critical security operations like auth, payments
 * @param identifier - Usually IP address or user ID
 * @param endpoint - Endpoint name for tracking
 * @param maxRequests - Max requests allowed in window
 * @param windowMinutes - Time window in minutes
 * @param supabaseClient - Supabase client with service role
 * @returns Promise<RateLimitResult>
 */
export async function checkRateLimitDB(
  identifier: string,
  endpoint: string,
  maxRequests: number,
  windowMinutes: number,
  supabaseClient: SupabaseClient
): Promise<RateLimitResult> {
  try {
    const { data, error } = await supabaseClient
      .rpc('check_rate_limit', {
        p_identifier: identifier,
        p_endpoint: endpoint,
        p_max_requests: maxRequests,
        p_window_minutes: windowMinutes
      })
      .single();

    if (error) {
      console.error('Rate limit DB check failed, falling back to allow:', error);
      // Fail open - allow request if DB check fails
      return {
        allowed: true,
        remaining: maxRequests,
        resetTime: Date.now() + (windowMinutes * 60 * 1000)
      };
    }

    const resetTime = new Date(data.reset_at).getTime();
    const retryAfter = data.allowed ? undefined : Math.ceil((resetTime - Date.now()) / 1000);

    return {
      allowed: data.allowed,
      remaining: Math.max(0, maxRequests - data.current_count),
      resetTime,
      retryAfter
    };
  } catch (err) {
    console.error('Rate limit DB error:', err);
    // Fail open
    return {
      allowed: true,
      remaining: maxRequests,
      resetTime: Date.now() + (windowMinutes * 60 * 1000)
    };
  }
}

/**
 * Get client IP from request headers
 */
export function getClientIP(req: Request): string {
  // Try various headers that might contain the real IP
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP in the chain (original client)
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback - won't be accurate but prevents errors
  return 'unknown';
}

/**
 * Create a rate limit response with proper headers
 */
export function rateLimitResponse(result: RateLimitResult, corsHeaders: Record<string, string> = {}): Response {
  return new Response(
    JSON.stringify({
      error: 'Too many requests. Please try again later.',
      retryAfter: result.retryAfter
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Retry-After': String(result.retryAfter || 60),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(result.resetTime)
      }
    }
  );
}

// Pre-configured rate limits for common use cases
export const RATE_LIMITS = {
  // Authentication: 5 attempts per 15 minutes per IP
  AUTH: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    keyPrefix: 'auth'
  },

  // Signup: 3 attempts per hour per IP
  SIGNUP: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyPrefix: 'signup'
  },

  // Password reset: 3 attempts per hour per IP
  PASSWORD_RESET: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyPrefix: 'pwd_reset'
  },

  // API: 100 requests per minute per IP
  API_STANDARD: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    keyPrefix: 'api'
  },

  // Booking: 10 bookings per hour per user
  BOOKING: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyPrefix: 'booking'
  },

  // Email sending: 5 emails per hour per user
  EMAIL: {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyPrefix: 'email'
  },

  // Webhook replay protection: 100 per minute
  WEBHOOK: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    keyPrefix: 'webhook'
  }
};

// Database-backed rate limit configs (minutes instead of ms)
export const DB_RATE_LIMITS = {
  AUTH: { maxRequests: 5, windowMinutes: 15, endpoint: 'auth' },
  SIGNUP: { maxRequests: 3, windowMinutes: 60, endpoint: 'signup' },
  PASSWORD_RESET: { maxRequests: 3, windowMinutes: 60, endpoint: 'pwd_reset' },
  BOOKING: { maxRequests: 10, windowMinutes: 60, endpoint: 'booking' },
  PAYMENT: { maxRequests: 5, windowMinutes: 60, endpoint: 'payment' },
  WEBHOOK: { maxRequests: 100, windowMinutes: 1, endpoint: 'webhook' },
};
