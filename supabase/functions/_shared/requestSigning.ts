// Request Signing for Sensitive API Calls
// Uses HMAC-SHA256 to verify request integrity and authenticity

/**
 * Generate HMAC signature for request payload
 * Used to verify request hasn't been tampered with
 */
export async function generateSignature(
  payload: string,
  secret: string,
  timestamp: number
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${timestamp}.${payload}`);
  const keyData = encoder.encode(secret);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);

  // Convert to hex string
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Verify HMAC signature from request
 * Returns true if signature is valid and timestamp is within tolerance
 */
export async function verifySignature(
  payload: string,
  signature: string,
  timestamp: number,
  secret: string,
  toleranceSeconds: number = 300 // 5 minutes
): Promise<{ valid: boolean; error?: string }> {
  // Check timestamp is within tolerance (prevent replay attacks)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > toleranceSeconds) {
    return { valid: false, error: 'Request timestamp expired' };
  }

  // Generate expected signature
  const expectedSignature = await generateSignature(payload, secret, timestamp);

  // Constant-time comparison to prevent timing attacks
  if (signature.length !== expectedSignature.length) {
    return { valid: false, error: 'Invalid signature' };
  }

  let result = 0;
  for (let i = 0; i < signature.length; i++) {
    result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }

  if (result !== 0) {
    return { valid: false, error: 'Invalid signature' };
  }

  return { valid: true };
}

/**
 * Extract signature components from request headers
 */
export function extractSignatureHeaders(req: Request): {
  signature: string | null;
  timestamp: number | null;
} {
  const signature = req.headers.get('x-signature');
  const timestampStr = req.headers.get('x-timestamp');
  const timestamp = timestampStr ? parseInt(timestampStr, 10) : null;

  return { signature, timestamp };
}

/**
 * Create signature error response
 */
export function signatureErrorResponse(
  error: string,
  corsHeaders: Record<string, string> = {}
): Response {
  console.warn('Request signature validation failed:', error);

  return new Response(
    JSON.stringify({
      error: 'Request validation failed',
      message: 'This request could not be verified'
    }),
    {
      status: 401,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    }
  );
}

/**
 * Middleware to require signed requests
 * Use for sensitive operations like payments and bookings
 */
export async function requireSignedRequest(
  req: Request,
  body: string,
  corsHeaders: Record<string, string> = {}
): Promise<Response | null> {
  // Get signing secret from environment
  const signingSecret = Deno.env.get('REQUEST_SIGNING_SECRET');

  // If no secret configured, skip validation (but log warning)
  if (!signingSecret) {
    console.warn('REQUEST_SIGNING_SECRET not configured - skipping signature validation');
    return null;
  }

  const { signature, timestamp } = extractSignatureHeaders(req);

  if (!signature || !timestamp) {
    return signatureErrorResponse('Missing signature headers', corsHeaders);
  }

  const result = await verifySignature(body, signature, timestamp, signingSecret);

  if (!result.valid) {
    return signatureErrorResponse(result.error || 'Invalid signature', corsHeaders);
  }

  return null; // Request is valid
}
