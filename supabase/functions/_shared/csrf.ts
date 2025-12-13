// CSRF Protection for Edge Functions
// Validates Origin/Referer headers to prevent cross-site request forgery

// Allowed origins for CSRF validation
const ALLOWED_ORIGINS = [
  'https://talbiyah.ai',
  'https://talbiyah2025.netlify.app',
  'https://talbiyah.ai',
  'https://www.talbiyah.ai',
  // Development origins
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];

// Paths that don't require CSRF validation (webhooks, etc.)
const CSRF_EXEMPT_PATHS = [
  '/stripe-webhook',
  '/handle-recording-webhook',
];

export interface CSRFValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate CSRF protection headers
 * Checks Origin and Referer headers against allowed origins
 */
export function validateCSRF(req: Request): CSRFValidationResult {
  // Skip validation for safe methods
  const method = req.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return { valid: true };
  }

  // Check if path is exempt (webhooks)
  const url = new URL(req.url);
  const pathname = url.pathname;
  if (CSRF_EXEMPT_PATHS.some(path => pathname.includes(path))) {
    return { valid: true };
  }

  // Get Origin header (preferred)
  const origin = req.headers.get('origin');
  if (origin) {
    if (ALLOWED_ORIGINS.includes(origin)) {
      return { valid: true };
    }
    return {
      valid: false,
      error: `Invalid origin: ${origin}`
    };
  }

  // Fallback to Referer header
  const referer = req.headers.get('referer');
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`;
      if (ALLOWED_ORIGINS.includes(refererOrigin)) {
        return { valid: true };
      }
      return {
        valid: false,
        error: `Invalid referer origin: ${refererOrigin}`
      };
    } catch {
      return {
        valid: false,
        error: 'Invalid referer URL'
      };
    }
  }

  // No Origin or Referer header present
  // For API calls with Authorization header (JWT), this is acceptable
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // JWT-authenticated request without Origin/Referer is acceptable
    // The JWT itself serves as a form of CSRF protection
    return { valid: true };
  }

  // No valid CSRF protection found
  return {
    valid: false,
    error: 'Missing Origin/Referer header and no Authorization'
  };
}

/**
 * Create a CSRF error response
 */
export function csrfErrorResponse(
  result: CSRFValidationResult,
  corsHeaders: Record<string, string> = {}
): Response {
  console.warn('CSRF validation failed:', result.error);

  return new Response(
    JSON.stringify({
      error: 'CSRF validation failed',
      message: 'This request appears to be from an unauthorized source'
    }),
    {
      status: 403,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    }
  );
}

/**
 * Middleware helper to check CSRF and return early if invalid
 */
export function requireCSRF(
  req: Request,
  corsHeaders: Record<string, string> = {}
): Response | null {
  const result = validateCSRF(req);
  if (!result.valid) {
    return csrfErrorResponse(result, corsHeaders);
  }
  return null; // Request is valid, continue processing
}
